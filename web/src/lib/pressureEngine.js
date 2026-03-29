/**
 * FluxTrade — Pressure Calculator Engine
 * 
 * Sliding-window CVD, buy/sell pressure, and signal calculation.
 * Mirrors the Python SymbolPressure logic for the browser.
 */

const CVD_WINDOW_MS = 60_000;       // 60s CVD window
const PRESSURE_WINDOW_MS = 10_000;  // 10s pressure window
const VOLUME_HISTORY_SIZE = 30;     // Mini chart bar count

export function createPressureEngine() {
  // Per-symbol state
  const symbols = {};

  function getOrCreate(symbol) {
    if (!symbols[symbol]) {
      symbols[symbol] = {
        symbol,
        trades: [],          // [{ts, volumeUsd, isBuy}]
        totalBuyVolume: 0,
        totalSellVolume: 0,
        totalTradeCount: 0,
        lastPrice: 0,
        cvdLifetime: 0,
        obi: 0.5,            // Default neutral Order Book Imbalance
        // Mini volume chart history (each entry = 1 second aggregate)
        volumeHistory: [],   // [{buy, sell, ts}]
        _currentSecond: 0,
        _currentBucket: { buy: 0, sell: 0 },
      };
    }
    return symbols[symbol];
  }

  function recordTrade(trade) {
    const s = getOrCreate(trade.symbol);
    const now = Date.now();
    const isBuy = trade.side === 'BUY';

    // Sliding window entry
    s.trades.push({ ts: now, volumeUsd: trade.volumeUsd, isBuy });
    s.lastPrice = trade.price;
    s.totalTradeCount++;

    if (isBuy) {
      s.totalBuyVolume += trade.volumeUsd;
      s.cvdLifetime += trade.volumeUsd;
    } else {
      s.totalSellVolume += trade.volumeUsd;
      s.cvdLifetime -= trade.volumeUsd;
    }

    // Volume history bucketing (1s intervals)
    const sec = Math.floor(now / 1000);
    if (sec !== s._currentSecond) {
      if (s._currentSecond > 0) {
        s.volumeHistory.push({ ...s._currentBucket, ts: s._currentSecond });
        if (s.volumeHistory.length > VOLUME_HISTORY_SIZE) {
          s.volumeHistory.shift();
        }
      }
      s._currentSecond = sec;
      s._currentBucket = { buy: 0, sell: 0 };
    }
    if (isBuy) {
      s._currentBucket.buy += trade.volumeUsd;
    } else {
      s._currentBucket.sell += trade.volumeUsd;
    }

    // Prune old trades
    prune(s, now);
  }

  function updateDepth(symbol, obi) {
    const s = getOrCreate(symbol);
    s.obi = obi;
  }

  /**
   * Record a trade using a specific timestamp (for backtest/CSV replay).
   * Uses the provided ts instead of Date.now() so sliding windows
   * operate on simulated time rather than real time.
   */
  function recordTradeWithTimestamp(trade, ts) {
    const s = getOrCreate(trade.symbol);
    const isBuy = trade.side === 'BUY';

    s.trades.push({ ts, volumeUsd: trade.volumeUsd, isBuy });
    s.lastPrice = trade.price;
    s.totalTradeCount++;

    if (isBuy) {
      s.totalBuyVolume += trade.volumeUsd;
      s.cvdLifetime += trade.volumeUsd;
    } else {
      s.totalSellVolume += trade.volumeUsd;
      s.cvdLifetime -= trade.volumeUsd;
    }

    const sec = Math.floor(ts / 1000);
    if (sec !== s._currentSecond) {
      if (s._currentSecond > 0) {
        s.volumeHistory.push({ ...s._currentBucket, ts: s._currentSecond });
        if (s.volumeHistory.length > VOLUME_HISTORY_SIZE) {
          s.volumeHistory.shift();
        }
      }
      s._currentSecond = sec;
      s._currentBucket = { buy: 0, sell: 0 };
    }
    if (isBuy) {
      s._currentBucket.buy += trade.volumeUsd;
    } else {
      s._currentBucket.sell += trade.volumeUsd;
    }

    prune(s, ts);
  }

  function prune(s, now) {
    const cutoff = now - CVD_WINDOW_MS;
    while (s.trades.length > 0 && s.trades[0].ts < cutoff) {
      s.trades.shift();
    }
  }

  function getSnapshot(symbol) {
    const s = symbols[symbol];
    if (!s || s.totalTradeCount === 0) {
      return {
        symbol,
        lastPrice: 0,
        totalTradeCount: 0,
        windowBuyVolume: 0,
        windowSellVolume: 0,
        buyRatio: 0.5,
        windowCvd: 0,
        cvdLifetime: 0,
        obi: s ? s.obi : 0.5,
        signal: 'neutral',
        signalLabel: '⚪ NÖTR',
        volumeHistory: [],
        totalBuyVolume: 0,
        totalSellVolume: 0,
      };
    }

    const now = Date.now();
    const pressureCutoff = now - PRESSURE_WINDOW_MS;

    let windowBuy = 0;
    let windowSell = 0;
    let windowCvd = 0;

    for (const t of s.trades) {
      const vol = t.volumeUsd;
      if (t.isBuy) {
        windowCvd += vol;
        if (t.ts >= pressureCutoff) windowBuy += vol;
      } else {
        windowCvd -= vol;
        if (t.ts >= pressureCutoff) windowSell += vol;
      }
    }

    const total = windowBuy + windowSell;
    const buyRatio = total > 0 ? windowBuy / total : 0.5;

    let signal, signalLabel;
    if (buyRatio >= 0.65) {
      signal = 'strong-buy';
      signalLabel = '🟢 GÜÇLÜ ALIŞ';
    } else if (buyRatio >= 0.55) {
      signal = 'mild-buy';
      signalLabel = '🟡 HAFİF ALIŞ';
    } else if (buyRatio <= 0.35) {
      signal = 'strong-sell';
      signalLabel = '🔴 GÜÇLÜ SATIŞ';
    } else if (buyRatio <= 0.45) {
      signal = 'mild-sell';
      signalLabel = '🟠 HAFİF SATIŞ';
    } else {
      signal = 'neutral-signal';
      signalLabel = '⚪ NÖTR';
    }

    return {
      symbol: s.symbol,
      lastPrice: s.lastPrice,
      totalTradeCount: s.totalTradeCount,
      windowBuyVolume: windowBuy,
      windowSellVolume: windowSell,
      buyRatio,
      windowCvd,
      cvdLifetime: s.cvdLifetime,
      obi: s.obi,
      signal,
      signalLabel,
      volumeHistory: [...s.volumeHistory],
      totalBuyVolume: s.totalBuyVolume,
      totalSellVolume: s.totalSellVolume,
    };
  }

  function getAllSnapshots() {
    return Object.keys(symbols).map(getSnapshot);
  }

  function getGlobalStats() {
    const snaps = getAllSnapshots();
    return {
      totalTrades: snaps.reduce((a, s) => a + s.totalTradeCount, 0),
      totalBuyVolume: snaps.reduce((a, s) => a + s.totalBuyVolume, 0),
      totalSellVolume: snaps.reduce((a, s) => a + s.totalSellVolume, 0),
      netFlow: snaps.reduce((a, s) => a + s.totalBuyVolume - s.totalSellVolume, 0),
    };
  }

  return { recordTrade, recordTradeWithTimestamp, updateDepth, getSnapshot, getAllSnapshots, getGlobalStats };
}
