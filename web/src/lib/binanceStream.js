/**
 * FluxTrade — Hybrid Data Stream Manager
 *
 * Connection strategy:
 *   1. Try the Python Aggregator backend (env var or localhost:8765)
 *   2. After 3 failed attempts → fallback to direct Binance WS
 *
 * This ensures the app works both:
 *   - Locally with the Python backend running
 *   - On Vercel without a backend (single-exchange fallback)
 */

const AGGREGATOR_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WS_URL) || 'ws://localhost:8765';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream?streams=';

const SYMBOLS = ['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt'];

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT = 15;
const AGGREGATOR_MAX_TRIES = 3; // after this many failures, switch to Binance
const PING_INTERVAL = 30000;

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

/**
 * Create a hybrid stream that connects to the aggregator first,
 * then falls back to direct Binance if the aggregator is unreachable.
 */
export function createFluxStream(onTrade, onDepth, onStatus, onModeChange) {
  let ws = null;
  let reconnectAttempts = 0;
  let aggregatorFailures = 0;
  let pingTimer = null;
  let isDestroyed = false;
  let mode = 'aggregator'; // 'aggregator' | 'direct-binance'

  function getBinanceUrl() {
    const streams = SYMBOLS.map(s => `${s}@aggTrade`).join('/');
    return BINANCE_WS_URL + streams;
  }

  function getUrl() {
    return mode === 'aggregator' ? AGGREGATOR_URL : getBinanceUrl();
  }

  function connect() {
    if (isDestroyed) return;

    onStatus?.('connecting');

    const url = getUrl();

    try {
      ws = new WebSocket(url);
    } catch {
      onStatus?.('disconnected');
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      reconnectAttempts = 0;
      if (mode === 'aggregator') aggregatorFailures = 0;
      onStatus?.('connected');
      onModeChange?.(mode);

      pingTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ ping: 1 }));
        }
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (mode === 'aggregator') {
          // Aggregator sends: { stream: "trade"|"depth", data: {...} }
          const { stream, data } = msg;
          if (stream === 'trade') {
            onTrade?.(parseAggTrade(data));
          } else if (stream === 'depth') {
            onDepth?.(data);
          }
        } else {
          // Direct Binance sends: { stream: "btcusdt@aggTrade", data: {...} }
          const data = msg.data || msg;
          if (data.e === 'aggTrade') {
            onTrade?.(parseAggTrade(data));
          }
        }
      } catch {
        // Skip malformed messages
      }
    };

    ws.onclose = () => {
      clearInterval(pingTimer);
      if (isDestroyed) return;

      onStatus?.('disconnected');

      // If aggregator keeps failing, switch to direct Binance
      if (mode === 'aggregator') {
        aggregatorFailures++;
        if (aggregatorFailures >= AGGREGATOR_MAX_TRIES) {
          console.warn(
            `[FluxStream] Aggregator unreachable after ${AGGREGATOR_MAX_TRIES} attempts. Falling back to direct Binance.`
          );
          mode = 'direct-binance';
          reconnectAttempts = 0; // reset for the new mode
          onModeChange?.(mode);
        }
      }

      scheduleReconnect();
    };

    ws.onerror = () => {
      // Error is handled in onclose
    };
  }

  function scheduleReconnect() {
    if (isDestroyed || reconnectAttempts >= MAX_RECONNECT) return;
    reconnectAttempts++;
    const delay = RECONNECT_DELAY * Math.min(reconnectAttempts, 5);
    setTimeout(connect, delay);
  }

  function destroy() {
    isDestroyed = true;
    clearInterval(pingTimer);
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
  }

  // Start
  connect();

  return {
    destroy,
    getSymbols: () => SYMBOLS,
    getMode: () => mode,
  };
}

export { SYMBOLS };
