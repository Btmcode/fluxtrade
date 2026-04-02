import asyncio
import json
import time
import logging
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
import websockets
from collections import deque
from notifications import notification_manager

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Aggregator")

@dataclass
class UniversalTrade:
    exchange: str
    symbol: str
    price: float
    quantity: float
    side: str  # "BUY" or "SELL"
    timestamp: float

class SymbolStats:
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.last_price = 0.0
        self.trades = deque(maxlen=1000)  # Keep last 1000 trades for momentum
        self.cvd = 0.0
        self.volume_24h = 0.0 # Placeholder for future API integration
        self.momentum_score = 0.0

    def add_trade(self, trade: UniversalTrade):
        self.last_price = trade.price
        self.trades.append(trade)
        
        if trade.side == "BUY":
            self.cvd += trade.price * trade.quantity
        else:
            self.cvd -= trade.price * trade.quantity
        
        # Simple momentum calculation: trades in last 60 seconds
        now = time.time()
        recent_vol = sum(t.price * t.quantity for t in self.trades if now - t.timestamp < 60)
        self.momentum_score = recent_vol

class MarketAggregator:
    def __init__(self):
        self.stats: Dict[str, SymbolStats] = {}
        self.active_symbols = ["ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "AVAXUSDT", "DOGEUSDT"]
        self.on_trade_callback: Optional[Callable] = None
        self._running = False

    def get_stats(self):
        # Sort by momentum and return top 10 (excluding BTC as requested)
        sorted_stats = sorted(
            [s for s in self.stats.values() if s.symbol != "BTCUSDT"],
            key=lambda x: x.momentum_score,
            reverse=True
        )
        return {
            s.symbol: {
                "price": s.last_price,
                "cvd": s.cvd,
                "momentum": s.momentum_score,
                "label": self._get_label(s)
            } for s in sorted_stats[:12]
        }

    async def _evaluate_market_signals(self, broadcast_func):
        """Periodically evaluates overall market momentum signals."""
        for symbol, s in self.stats.items():
            await notification_manager.evaluate_momentum(symbol, s.momentum_score, broadcast_func)

    def _get_label(self, stat: SymbolStats):
        # Simple label logic
        if stat.momentum_score > 100000: return "🔥 HYPER"
        if stat.momentum_score > 50000: return "⚡ ACTIVE"
        return "稳定" # Stable

    async def _listen_binance(self):
        url = "wss://stream.binance.com:9443/stream?streams=" + "/".join([f"{s.lower()}@aggTrade" for s in self.active_symbols])
        while self._running:
            try:
                async with websockets.connect(url) as ws:
                    async for msg in ws:
                        data = json.loads(msg).get('data', {})
                        if data.get('e') == 'aggTrade':
                            trade = UniversalTrade(
                                exchange="Binance",
                                symbol=data['s'],
                                price=float(data['p']),
                                quantity=float(data['q']),
                                side="SELL" if data['m'] else "BUY",
                                timestamp=data['T'] / 1000.0
                            )
                            self._process_trade(trade)
            except Exception as e:
                logger.error(f"Binance Error: {e}")
                await asyncio.sleep(5)

    async def _listen_bybit(self):
        url = "wss://stream.bybit.com/v5/public/linear"
        while self._running:
            try:
                async with websockets.connect(url) as ws:
                    # Subscribe
                    subs = {"op": "subscribe", "args": [f"publicTrade.{s}" for s in self.active_symbols]}
                    await ws.send(json.dumps(subs))
                    async for msg in ws:
                        data = json.loads(msg)
                        if data.get('topic', '').startswith('publicTrade'):
                            for t in data.get('data', []):
                                trade = UniversalTrade(
                                    exchange="Bybit",
                                    symbol=t['s'],
                                    price=float(t['p']),
                                    quantity=float(t['v']),
                                    side=t['S'].upper(),
                                    timestamp=t['T'] / 1000.0
                                )
                                self._process_trade(trade)
            except Exception as e:
                logger.error(f"Bybit Error: {e}")
                await asyncio.sleep(5)

    def _process_trade(self, trade: UniversalTrade):
        if trade.symbol not in self.stats:
            self.stats[trade.symbol] = SymbolStats(trade.symbol)
        
        self.stats[trade.symbol].add_trade(trade)
        
        # Trigger Notification Evaluation
        if self.on_trade_callback:
            asyncio.create_task(self.on_trade_callback(trade))

    async def run(self):
        self._running = True
        await asyncio.gather(
            self._listen_binance(),
            self._listen_bybit()
        )

aggregator = MarketAggregator()
