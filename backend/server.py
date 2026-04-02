import asyncio
import json
import logging
import os
from typing import Set
import websockets

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("FluxBackend")

# ═══════════════════════════════════════════════════════
# Global State
# ═══════════════════════════════════════════════════════
connected_clients: Set = set()
SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "YFIUSDT", "AVAXUSDT", "LINKUSDT"]

# OKX uses different symbol format: BTC-USDT instead of BTCUSDT
OKX_SYMBOL_MAP = {
    "BTC-USDT": "BTCUSDT",
    "ETH-USDT": "ETHUSDT",
    "SOL-USDT": "SOLUSDT",
    # OKX doesn't list BNB-USDT on spot/swap — we skip it
    "XRP-USDT": "XRPUSDT",
}
OKX_SYMBOLS = list(OKX_SYMBOL_MAP.keys())

# Per-symbol depth state across exchanges
depth_state = {
    sym: {
        "binance": {"b": [], "a": []},
        "bybit":   {"b": [], "a": []},
        "okx":     {"b": [], "a": []},
    }
    for sym in SYMBOLS
}

# Broadcast queue — async-safe message dispatch
broadcast_queue: asyncio.Queue = None  # initialized in main()


# ═══════════════════════════════════════════════════════
# Broadcast System (async-safe)
# ═══════════════════════════════════════════════════════
async def broadcast_worker():
    """Dedicated coroutine that drains the queue and sends to all clients."""
    while True:
        payload = await broadcast_queue.get()
        if not connected_clients:
            continue

        dead = set()
        tasks = []
        for ws in connected_clients:
            try:
                tasks.append(asyncio.ensure_future(ws.send(payload)))
            except Exception:
                dead.add(ws)

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        connected_clients.difference_update(dead)


def enqueue_broadcast(message: dict):
    """Thread/context-safe way to schedule a broadcast. Never blocks."""
    try:
        broadcast_queue.put_nowait(json.dumps(message))
    except Exception:
        pass


# ═══════════════════════════════════════════════════════
# OBI & Normalization Engine
# ═══════════════════════════════════════════════════════
def calculate_network_obi(symbol: str) -> float:
    """Aggregate depth across ALL exchanges and compute Order Book Imbalance."""
    total_bids = 0.0
    total_asks = 0.0

    st = depth_state.get(symbol)
    if not st:
        return 0.5

    for exch in st.values():
        for b in exch["b"]:
            try:
                total_bids += float(b[1])
            except (IndexError, ValueError, TypeError):
                pass
        for a in exch["a"]:
            try:
                total_asks += float(a[1])
            except (IndexError, ValueError, TypeError):
                pass

    if total_bids + total_asks == 0:
        return 0.5  # Neutral

    return total_bids / (total_bids + total_asks)


def handle_depth_update(exchange: str, symbol: str, bids: list, asks: list):
    """Update local depth state and broadcast OBI."""
    if symbol not in depth_state:
        return

    depth_state[symbol][exchange]["b"] = bids
    depth_state[symbol][exchange]["a"] = asks

    obi = calculate_network_obi(symbol)

    enqueue_broadcast({
        "stream": "depth",
        "data": {
            "s": symbol,
            "obi": round(obi, 4),
        }
    })


def handle_trade(exchange: str, symbol: str, price: float, qty: float, is_buyer_maker: bool, ts: int):
    """Normalize and broadcast a trade in unified format."""
    enqueue_broadcast({
        "stream": "trade",
        "data": {
            "e": "aggTrade",
            "s": symbol,
            "p": str(price),
            "q": str(qty),
            "m": is_buyer_maker,
            "T": ts,
            "x": exchange,
        }
    })


# ═══════════════════════════════════════════════════════
# Exchange Client: Binance
# ═══════════════════════════════════════════════════════
async def binance_client():
    streams = []
    for s in SYMBOLS:
        ls = s.lower()
        streams.append(f"{ls}@aggTrade")
        streams.append(f"{ls}@depth10@100ms")

    url = f"wss://stream.binance.com:9443/stream?streams={'/'.join(streams)}"
    logger.info(f"Connecting to Binance: {url[:80]}...")

    while True:
        try:
            async with websockets.connect(url, max_size=None, ping_interval=20, ping_timeout=10) as ws:
                logger.info("🟢 Binance WS Connected")
                async for msg in ws:
                    data = json.loads(msg)
                    if "stream" not in data or "data" not in data:
                        continue

                    stream_name = data["stream"]
                    d = data["data"]

                    if "@aggTrade" in stream_name:
                        handle_trade("binance", d["s"], float(d["p"]), float(d["q"]), d["m"], d["T"])
                    elif "@depth" in stream_name:
                        sym = stream_name.split("@")[0].upper()
                        handle_depth_update("binance", sym, d.get("bids", []), d.get("asks", []))

        except Exception as e:
            logger.error(f"Binance error: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)


# ═══════════════════════════════════════════════════════
# Exchange Client: Bybit
# ═══════════════════════════════════════════════════════
async def bybit_client():
    url = "wss://stream.bybit.com/v5/public/linear"

    while True:
        try:
            async with websockets.connect(url, ping_interval=20, ping_timeout=10, max_size=None) as ws:
                logger.info("🟢 Bybit WS Connected")

                args = []
                for s in SYMBOLS:
                    args.append(f"publicTrade.{s}")
                    args.append(f"orderbook.50.{s}")

                await ws.send(json.dumps({"op": "subscribe", "args": args}))

                async for msg in ws:
                    data = json.loads(msg)
                    if "topic" not in data or "data" not in data:
                        continue

                    topic = data["topic"]
                    d = data["data"]

                    if topic.startswith("publicTrade"):
                        # topic = "publicTrade.BTCUSDT"
                        sym = topic.split(".")[1]
                        for t in d:
                            is_maker = (t.get("S") == "Sell")
                            ts_raw = t.get("T", 0)
                            # Bybit timestamps can be ms or μs — normalize to ms
                            ts = ts_raw if ts_raw < 1e13 else int(ts_raw / 1000)
                            handle_trade("bybit", sym, float(t["p"]), float(t["v"]), is_maker, ts)

                    elif topic.startswith("orderbook"):
                        # topic = "orderbook.50.BTCUSDT" → last element is the symbol
                        parts = topic.split(".")
                        sym = parts[-1]  # FIX: was parts[1] which returned "50"
                        handle_depth_update(
                            "bybit", sym,
                            d.get("b", depth_state.get(sym, {}).get("bybit", {}).get("b", [])),
                            d.get("a", depth_state.get(sym, {}).get("bybit", {}).get("a", [])),
                        )

        except Exception as e:
            logger.error(f"Bybit error: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)


# ═══════════════════════════════════════════════════════
# Exchange Client: OKX
# ═══════════════════════════════════════════════════════
async def okx_client():
    url = "wss://ws.okx.com:8443/ws/v5/public"

    while True:
        try:
            async with websockets.connect(url, ping_interval=20, ping_timeout=10, max_size=None) as ws:
                logger.info("🟢 OKX WS Connected")

                # Subscribe to trades and order book for each symbol
                trade_args = [{"channel": "trades", "instId": s} for s in OKX_SYMBOLS]
                book_args = [{"channel": "books5", "instId": s} for s in OKX_SYMBOLS]

                await ws.send(json.dumps({"op": "subscribe", "args": trade_args}))
                await ws.send(json.dumps({"op": "subscribe", "args": book_args}))

                async for msg in ws:
                    data = json.loads(msg)

                    # Skip subscription confirmations
                    if "event" in data:
                        if data["event"] == "subscribe":
                            logger.info(f"  OKX subscribed: {data.get('arg', {}).get('channel', '?')}")
                        continue

                    if "arg" not in data or "data" not in data:
                        continue

                    channel = data["arg"].get("channel", "")
                    inst_id = data["arg"].get("instId", "")  # e.g. "BTC-USDT"
                    unified_sym = OKX_SYMBOL_MAP.get(inst_id)

                    if not unified_sym:
                        continue

                    d_list = data["data"]

                    if channel == "trades":
                        for t in d_list:
                            price = float(t["px"])
                            qty = float(t["sz"])
                            is_maker = (t["side"] == "sell")
                            ts = int(t["ts"])
                            handle_trade("okx", unified_sym, price, qty, is_maker, ts)

                    elif channel == "books5":
                        for book in d_list:
                            # OKX books5 format: [[price, size, _, numOrders], ...]
                            bids = [[b[0], b[1]] for b in book.get("bids", [])]
                            asks = [[a[0], a[1]] for a in book.get("asks", [])]
                            handle_depth_update("okx", unified_sym, bids, asks)

        except Exception as e:
            logger.error(f"OKX error: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)


# ═══════════════════════════════════════════════════════
# WebSocket Server (Client-Facing)
# ═══════════════════════════════════════════════════════
async def handler(websocket):
    logger.info(f"📱 Client connected: {websocket.remote_address}")
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            # Clients may send pings; we just ignore them
            pass
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        logger.info(f"📴 Client disconnected: {websocket.remote_address}")


async def main():
    global broadcast_queue
    broadcast_queue = asyncio.Queue(maxsize=10000)

    # Render.com provides PORT env var; fallback to 8765 for local dev
    port = int(os.environ.get("PORT", 8765))

    logger.info("Starting FluxTrade Unified Backend Server...")

    server = await websockets.serve(handler, "0.0.0.0", port, max_size=None)
    logger.info(f"✅ WS Server listening on ws://0.0.0.0:{port}")

    # Run all exchange clients + broadcast worker concurrently
    await asyncio.gather(
        server.wait_closed(),
        broadcast_worker(),
        binance_client(),
        bybit_client(),
        okx_client(),
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped.")
