/**
 * FluxTrade v3.0 — useFluxStream Hook
 *
 * Browser-based multi-exchange aggregator hook.
 * Connects directly to Binance, Bybit, and OKX — no backend needed.
 * Includes Backtest Replay with speed and timestamp support.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBackendStream } from '@/lib/backendStream';
import { createPressureEngine } from '@/lib/pressureEngine';

const UPDATE_INTERVAL = 1000;

export function useBinanceStream() {
  const [snapshots, setSnapshots] = useState({});
  const [globalStats, setGlobalStats] = useState({
    totalTrades: 0,
    totalBuyVolume: 0,
    totalSellVolume: 0,
    netFlow: 0,
  });
  const [exchangeStatuses, setExchangeStatuses] = useState({
    binance: 'connecting',
    bybit: 'connecting',
    okx: 'connecting',
  });
  const [messagesPerSecond, setMessagesPerSecond] = useState(0);
  const [whaleTrades, setWhaleTrades] = useState([]);

  // Backtest State
  const [isBacktesting, setIsBacktesting] = useState(false);
  const backtestRef = useRef({ trades: [], speed: 1 });

  const engineRef = useRef(null);
  const msgCountRef = useRef(0);

  // Derive a simple overall connection status
  const connectionStatus = isBacktesting
    ? 'backtesting'
    : Object.values(exchangeStatuses).some(s => s === 'connected')
      ? 'connected'
      : Object.values(exchangeStatuses).every(s => s === 'disconnected' || s === 'error')
        ? 'disconnected'
        : 'connecting';

  // Count connected exchanges
  const connectedCount = Object.values(exchangeStatuses).filter(s => s === 'connected').length;

  // ─── Live Mode ───
  useEffect(() => {
    const engine = createPressureEngine();
    engineRef.current = engine;

    const mpsInterval = setInterval(() => {
      setMessagesPerSecond(msgCountRef.current);
      msgCountRef.current = 0;
    }, 1000);

    let stream = null;

    if (!isBacktesting) {
      stream = createBackendStream(
        (trade) => {
          engine.recordTrade(trade);
          msgCountRef.current++;
          
          const usdVol = trade.p * trade.q;
          if (usdVol >= 150000) {
            setWhaleTrades(prev => {
              const newFeed = [{...trade, usdVol, id: Math.random().toString(36).substr(2,9)}, ...prev];
              return newFeed.slice(0, 50); // keep last 50
            });
          }
        },
        (depthData) => {
          if (depthData?.s && depthData?.obi !== undefined) {
            engine.updateDepth(depthData.s, depthData.obi);
          }
        },
        ({ exchange, status }) => {
          setExchangeStatuses(prev => ({ ...prev, [exchange]: status }));
        },
      );
    } else {
      setExchangeStatuses({ binance: 'paused', bybit: 'paused', okx: 'paused' });
    }

    const updateInterval = setInterval(() => {
      const allSnaps = {};
      const activeSymbols = stream ? stream.getSymbols() : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'YFIUSDT', 'AVAXUSDT', 'LINKUSDT'];
      activeSymbols.forEach(sym => {
        const key = sym.toUpperCase();
        allSnaps[key] = engine.getSnapshot(key);
      });
      setSnapshots(allSnaps);
      setGlobalStats(engine.getGlobalStats());
    }, UPDATE_INTERVAL);

    return () => {
      if (stream) stream.destroy();
      clearInterval(updateInterval);
      clearInterval(mpsInterval);
    };
  }, [isBacktesting]);

  // ─── Backtest Playback ───
  useEffect(() => {
    if (!isBacktesting || backtestRef.current.trades.length === 0) return;

    let isActive = true;
    const { trades, speed } = backtestRef.current;
    let index = 0;

    const batchSize = Math.max(50, speed * 10);
    const intervalMs = Math.max(10, Math.floor(100 / speed));

    const replayInterval = setInterval(() => {
      if (!isActive) return;
      const engine = engineRef.current;
      if (!engine) return;

      for (let i = 0; i < batchSize; i++) {
        if (index >= trades.length) {
          clearInterval(replayInterval);
          return;
        }
        const t = trades[index];
        engine.recordTradeWithTimestamp(t, t.timestampMs);
        msgCountRef.current++;
        index++;
      }
    }, intervalMs);

    return () => {
      isActive = false;
      clearInterval(replayInterval);
    };
  }, [isBacktesting]);

  const startBacktest = useCallback((trades, speed) => {
    engineRef.current = createPressureEngine();
    backtestRef.current = { trades, speed: speed || 1 };
    setIsBacktesting(true);
  }, []);

  const stopBacktest = useCallback(() => {
    setIsBacktesting(false);
    backtestRef.current = { trades: [], speed: 1 };
    engineRef.current = createPressureEngine();
  }, []);

  return {
    snapshots,
    globalStats,
    connectionStatus,
    exchangeStatuses,
    connectedCount,
    messagesPerSecond,
    symbols: SYMBOLS.map(s => s.toUpperCase()),
    startBacktest,
    stopBacktest,
    isBacktesting,
    whaleTrades,
  };
}
