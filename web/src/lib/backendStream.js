/**
 * FluxTrade — Unified Backend Stream Client (Phase 16)
 * 
 * Replaces the multi-exchange browser connections with a single
 * connection to the Python Institutional Aggregator.
 */
'use client';

const BACKEND_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8765';
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'YFIUSDT', 'AVAXUSDT', 'LINKUSDT'];

export function createBackendStream(onTrade, onDepth, onStatus) {
  let ws = null;
  let attempts = 0;
  let destroyed = false;
  const MAX_RECONNECT = 20;

  function connect() {
    if (destroyed) return;
    onStatus?.({ exchange: 'backend', status: 'connecting' });

    try {
      ws = new WebSocket(BACKEND_URL);
    } catch (e) {
      onStatus?.({ exchange: 'backend', status: 'error' });
      retry();
      return;
    }

    ws.onopen = () => {
      attempts = 0;
      onStatus?.({ exchange: 'backend', status: 'connected' });
      // Identify all 3 sub-exchanges as 'connected' for UI compatibility
      ['binance', 'bybit', 'okx'].forEach(exch => {
        onStatus?.({ exchange: exch, status: 'connected' });
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.stream === 'trade') {
          onTrade?.(msg.data);
        } else if (msg.stream === 'depth') {
          onDepth?.(msg.data);
        }
      } catch (e) {
        // Silently skip parse errors
      }
    };

    ws.onclose = () => {
      if (!destroyed) {
        onStatus?.({ exchange: 'backend', status: 'disconnected' });
        ['binance', 'bybit', 'okx'].forEach(exch => {
          onStatus?.({ exchange: exch, status: 'disconnected' });
        });
        retry();
      }
    };

    ws.onerror = (e) => {
      // ws.onclose will handle the reconnection
    };
  }

  function retry() {
    if (destroyed || attempts >= MAX_RECONNECT) return;
    attempts++;
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000) + (Math.random() * 1000);
    setTimeout(connect, delay);
  }

  function destroy() {
    destroyed = true;
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
  }

  connect();
  return {
    destroy,
    getSymbols: () => SYMBOLS
  };
}
