/**
 * FluxTrade v3.0 — Browser Multi-Exchange Aggregator
 *
 * Connects DIRECTLY from the browser to Binance, Bybit, and OKX
 * public WebSocket APIs. No backend server needed.
 *
 * Architecture:
 *   Browser ──┬── wss://stream.binance.com  (aggTrade + depth10)
 *             ├── wss://stream.bybit.com    (publicTrade + orderbook)
 *             └── wss://ws.okx.com          (trades + books5)
 *
 * All trade data is normalized to a unified format.
 * OBI (Order Book Imbalance) is calculated locally from depth data.
 */

// ═══════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════
const SYMBOLS = ['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt'];

const OKX_SYMBOL_MAP = {
  'BTC-USDT': 'BTCUSDT',
  'ETH-USDT': 'ETHUSDT',
  'SOL-USDT': 'SOLUSDT',
  'XRP-USDT': 'XRPUSDT',
};
const OKX_SYMBOLS = Object.keys(OKX_SYMBOL_MAP);

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT = 20;

// ═══════════════════════════════════════════════════════
// OBI State — aggregated order book across exchanges
// ═══════════════════════════════════════════════════════
const depthState = {};
SYMBOLS.forEach(s => {
  const sym = s.toUpperCase();
  depthState[sym] = {
    binance: { bids: 0, asks: 0 },
    bybit:   { bids: 0, asks: 0 },
    okx:     { bids: 0, asks: 0 },
  };
});

function calculateOBI(symbol) {
  const st = depthState[symbol];
  if (!st) return 0.5;

  let totalBids = 0;
  let totalAsks = 0;

  for (const exch of Object.values(st)) {
    totalBids += exch.bids;
    totalAsks += exch.asks;
  }

  if (totalBids + totalAsks === 0) return 0.5;
  return totalBids / (totalBids + totalAsks);
}

function updateDepthState(exchange, symbol, bidsArr, asksArr) {
  if (!depthState[symbol]) return null;

  let bidTotal = 0;
  let askTotal = 0;

  for (const b of bidsArr) {
    try { bidTotal += parseFloat(b[1] || b); } catch { /* skip */ }
  }
  for (const a of asksArr) {
    try { askTotal += parseFloat(a[1] || a); } catch { /* skip */ }
  }

  depthState[symbol][exchange] = { bids: bidTotal, asks: askTotal };

  return {
    s: symbol,
    obi: calculateOBI(symbol),
  };
}

// ═══════════════════════════════════════════════════════
// Unified Trade Parser
// ═══════════════════════════════════════════════════════
export function parseAggTrade(data) {
  return {
    symbol: data.s,
    price: parseFloat(data.p),
    quantity: parseFloat(data.q),
    timestampMs: data.T,
    isBuyerMaker: data.m,
    volumeUsd: parseFloat(data.p) * parseFloat(data.q),
    side: data.m ? 'SELL' : 'BUY',
    exchange: data.x || 'binance',
  };
}

// ═══════════════════════════════════════════════════════
// Exchange Client: Binance (Browser WS)
// ═══════════════════════════════════════════════════════
function createBinanceClient(onTrade, onDepth, onStatus) {
  let ws = null;
  let attempts = 0;
  let destroyed = false;

  const streams = SYMBOLS.flatMap(s => [`${s}@aggTrade`, `${s}@depth10@100ms`]);
  const url = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;

  function connect() {
    if (destroyed) return;
    onStatus?.('connecting');

    try { ws = new WebSocket(url); } catch {
      onStatus?.('error');
      retry();
      return;
    }

    ws.onopen = () => {
      attempts = 0;
      onStatus?.('connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.stream || !msg.data) return;

        const stream = msg.stream;
        const d = msg.data;

        if (stream.includes('@aggTrade')) {
          onTrade?.(parseAggTrade({ ...d, x: 'binance' }));
        } else if (stream.includes('@depth')) {
          const sym = stream.split('@')[0].toUpperCase();
          const depthResult = updateDepthState('binance', sym, d.bids || [], d.asks || []);
          if (depthResult) onDepth?.(depthResult);
        }
      } catch { /* skip */ }
    };

    ws.onclose = () => {
      if (!destroyed) { onStatus?.('disconnected'); retry(); }
    };
    ws.onerror = () => {};
  }

  function retry() {
    if (destroyed || attempts >= MAX_RECONNECT) return;
    attempts++;
    setTimeout(connect, RECONNECT_DELAY * Math.min(attempts, 5));
  }

  function destroy() {
    destroyed = true;
    if (ws) { ws.onclose = null; ws.close(); }
  }

  connect();
  return { destroy };
}

// ═══════════════════════════════════════════════════════
// Exchange Client: Bybit (Browser WS)
// ═══════════════════════════════════════════════════════
function createBybitClient(onTrade, onDepth, onStatus) {
  let ws = null;
  let attempts = 0;
  let destroyed = false;
  const url = 'wss://stream.bybit.com/v5/public/linear';

  function connect() {
    if (destroyed) return;
    onStatus?.('connecting');

    try { ws = new WebSocket(url); } catch {
      onStatus?.('error');
      retry();
      return;
    }

    ws.onopen = () => {
      attempts = 0;
      onStatus?.('connected');

      const args = SYMBOLS.flatMap(s => [
        `publicTrade.${s.toUpperCase()}`,
        `orderbook.25.${s.toUpperCase()}`,
      ]);
      ws.send(JSON.stringify({ op: 'subscribe', args }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data.topic || !data.data) return;

        const topic = data.topic;
        const d = data.data;

        if (topic.startsWith('publicTrade')) {
          const sym = topic.split('.')[1];
          for (const t of d) {
            const isMaker = t.S === 'Sell';
            let ts = t.T || 0;
            if (ts > 1e13) ts = Math.floor(ts / 1000);

            onTrade?.(parseAggTrade({
              s: sym, p: t.p, q: t.v, T: ts, m: isMaker, x: 'bybit',
            }));
          }
        } else if (topic.startsWith('orderbook')) {
          const sym = topic.split('.').pop(); // "orderbook.25.BTCUSDT" → last
          const depthResult = updateDepthState(
            'bybit', sym,
            (d.b || []).map(b => [b[0], b[1]]),
            (d.a || []).map(a => [a[0], a[1]]),
          );
          if (depthResult) onDepth?.(depthResult);
        }
      } catch { /* skip */ }
    };

    ws.onclose = () => {
      if (!destroyed) { onStatus?.('disconnected'); retry(); }
    };
    ws.onerror = () => {};
  }

  function retry() {
    if (destroyed || attempts >= MAX_RECONNECT) return;
    attempts++;
    setTimeout(connect, RECONNECT_DELAY * Math.min(attempts, 5));
  }

  function destroy() {
    destroyed = true;
    if (ws) { ws.onclose = null; ws.close(); }
  }

  connect();
  return { destroy };
}

// ═══════════════════════════════════════════════════════
// Exchange Client: OKX (Browser WS)
// ═══════════════════════════════════════════════════════
function createOKXClient(onTrade, onDepth, onStatus) {
  let ws = null;
  let attempts = 0;
  let destroyed = false;
  const url = 'wss://ws.okx.com:8443/ws/v5/public';

  function connect() {
    if (destroyed) return;
    onStatus?.('connecting');

    try { ws = new WebSocket(url); } catch {
      onStatus?.('error');
      retry();
      return;
    }

    ws.onopen = () => {
      attempts = 0;
      onStatus?.('connected');

      const tradeArgs = OKX_SYMBOLS.map(s => ({ channel: 'trades', instId: s }));
      const bookArgs = OKX_SYMBOLS.map(s => ({ channel: 'books5', instId: s }));

      ws.send(JSON.stringify({ op: 'subscribe', args: tradeArgs }));
      ws.send(JSON.stringify({ op: 'subscribe', args: bookArgs }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event) return; // subscription confirmations
        if (!data.arg || !data.data) return;

        const channel = data.arg.channel;
        const instId = data.arg.instId;
        const unifiedSym = OKX_SYMBOL_MAP[instId];
        if (!unifiedSym) return;

        if (channel === 'trades') {
          for (const t of data.data) {
            onTrade?.(parseAggTrade({
              s: unifiedSym,
              p: t.px,
              q: t.sz,
              T: parseInt(t.ts),
              m: t.side === 'sell',
              x: 'okx',
            }));
          }
        } else if (channel === 'books5') {
          for (const book of data.data) {
            const bids = (book.bids || []).map(b => [b[0], b[1]]);
            const asks = (book.asks || []).map(a => [a[0], a[1]]);
            const depthResult = updateDepthState('okx', unifiedSym, bids, asks);
            if (depthResult) onDepth?.(depthResult);
          }
        }
      } catch { /* skip */ }
    };

    ws.onclose = () => {
      if (!destroyed) { onStatus?.('disconnected'); retry(); }
    };
    ws.onerror = () => {};
  }

  function retry() {
    if (destroyed || attempts >= MAX_RECONNECT) return;
    attempts++;
    setTimeout(connect, RECONNECT_DELAY * Math.min(attempts, 5));
  }

  function destroy() {
    destroyed = true;
    if (ws) { ws.onclose = null; ws.close(); }
  }

  connect();
  return { destroy };
}

// ═══════════════════════════════════════════════════════
// Main Export: createFluxStream
// ═══════════════════════════════════════════════════════
/**
 * Creates a browser-based multi-exchange aggregator.
 *
 * @param {Function} onTrade   - Called with normalized trade objects
 * @param {Function} onDepth   - Called with { s: symbol, obi: 0.0-1.0 }
 * @param {Function} onExchangeStatus - Called with { exchange, status }
 * @returns {{ destroy: Function, getSymbols: Function }}
 */
export function createFluxStream(onTrade, onDepth, onExchangeStatus) {
  const binance = createBinanceClient(
    onTrade, onDepth,
    (status) => onExchangeStatus?.({ exchange: 'binance', status }),
  );

  const bybit = createBybitClient(
    onTrade, onDepth,
    (status) => onExchangeStatus?.({ exchange: 'bybit', status }),
  );

  const okx = createOKXClient(
    onTrade, onDepth,
    (status) => onExchangeStatus?.({ exchange: 'okx', status }),
  );

  return {
    destroy: () => {
      binance.destroy();
      bybit.destroy();
      okx.destroy();
    },
    getSymbols: () => SYMBOLS,
  };
}

export { SYMBOLS };
