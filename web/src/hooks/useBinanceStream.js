/**
 * FluxTrade — useFluxStream Hook
 *
 * Connects to the hybrid WebSocket stream (aggregator → Binance fallback),
 * feeds trades and depth into the pressure engine, provides snapshots.
 * Includes Backtest Replay support with proper speed & timestamp handling.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createFluxStream, SYMBOLS } from '@/lib/binanceStream';
import { createPressureEngine } from '@/lib/pressureEngine';

const UPDATE_INTERVAL = 800;

export function useBinanceStream() {
  const [snapshots, setSnapshots] = useState({});
  const [globalStats, setGlobalStats] = useState({
    totalTrades: 0,
    totalBuyVolume: 0,
    totalSellVolume: 0,
    netFlow: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [connectionMode, setConnectionMode] = useState('aggregator');
  const [messagesPerSecond, setMessagesPerSecond] = useState(0);

  // Backtest State
  const [isBacktesting, setIsBacktesting] = useState(false);
  const backtestRef = useRef({ trades: [], speed: 1 });

  const engineRef = useRef(null);
  const msgCountRef = useRef(0);

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
      stream = createFluxStream(
        (trade) => {
          engine.recordTrade(trade);
          msgCountRef.current++;
        },
        (depthData) => {
          if (depthData?.s && depthData?.obi !== undefined) {
            engine.updateDepth(depthData.s, depthData.obi);
          }
        },
        (status) => setConnectionStatus(status),
        (mode) => setConnectionMode(mode),
      );
    } else {
      setConnectionStatus('backtesting');
      setConnectionMode('backtest');
    }

    const updateInterval = setInterval(() => {
      const allSnaps = {};
      SYMBOLS.forEach(sym => {
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

    // Pump trades at a rate proportional to speed
    // At speed=1: ~100 trades every 100ms ≈ 1000 trades/sec
    // At speed=100: ~100 trades every 1ms ≈ virtually instant
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
        // Use the CSV timestamp so sliding windows work on simulated time
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
    connectionMode,
    messagesPerSecond,
    symbols: SYMBOLS.map(s => s.toUpperCase()),
    startBacktest,
    stopBacktest,
    isBacktesting,
  };
}
