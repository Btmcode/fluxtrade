/**
 * FluxTrade v3.0 — Dashboard Component
 *
 * Main dashboard with per-exchange status indicators,
 * multi-exchange data grid, alerts, and backtest controls.
 */
'use client';

import { useBinanceStream } from '@/hooks/useBinanceStream';
import SymbolCard from '@/components/SymbolCard';
import AlertsManager from '@/components/AlertsManager';
import BacktestPanel from '@/components/BacktestPanel';
import InfoModal from '@/components/InfoModal';
import OracleModal from '@/components/OracleModal';
import WhaleFeed from '@/components/WhaleFeed';
import SymbolDetailModal from '@/components/SymbolDetailModal';
import { formatUsd, formatNumber, formatPrice } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

const EXCHANGE_LABELS = {
  binance: { name: 'Binance', emoji: '🟡' },
  bybit:   { name: 'Bybit',   emoji: '🟠' },
  okx:     { name: 'OKX',     emoji: '🔵' },
};

export default function Dashboard() {
  const {
    snapshots,
    globalStats,
    connectionStatus,
    exchangeStatuses,
    connectedCount,
    messagesPerSecond,
    symbols: rawSymbols,
    startBacktest,
    stopBacktest,
    isBacktesting,
    whaleTrades,
  } = useBinanceStream();

  const [currentTime, setCurrentTime] = useState('');
  const [autoSort, setAutoSort] = useState(true);
  const [sortedSymbols, setSortedSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const lastSortTimeRef = useRef(0);

  // Handle Dynamic Sorting (Auto-Sort) - Throttled to 5 seconds
  useEffect(() => {
    if (!rawSymbols.length) return;

    // Initial load
    if (sortedSymbols.length === 0) {
      setSortedSymbols(rawSymbols);
      return;
    }

    if (!autoSort) return;

    // We check every time snapshots update, but only EXECUTE sort if 5s passed
    const now = Date.now();
    if (now - lastSortTimeRef.current < 5000) return;

    const btc = 'BTCUSDT';
    const others = rawSymbols.filter(s => s.toUpperCase() !== btc);
    
    const sortedOthers = [...others].sort((a, b) => {
      const snapA = snapshots[a.toUpperCase()] || { windowBuyVolume: 0, windowSellVolume: 0 };
      const snapB = snapshots[b.toUpperCase()] || { windowBuyVolume: 0, windowSellVolume: 0 };
      const scoreA = (snapA.windowBuyVolume || 0) + (snapA.windowSellVolume || 0);
      const scoreB = (snapB.windowBuyVolume || 0) + (snapB.windowSellVolume || 0);
      return scoreB - scoreA; // Descending by intensity
    });

    setSortedSymbols([rawSymbols.find(s => s.toUpperCase() === btc), ...sortedOthers]);
    lastSortTimeRef.current = now;
  }, [rawSymbols, snapshots, autoSort, sortedSymbols.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const netFlow = globalStats.netFlow || 0;

  return (
    <div className={`app-wrapper ${isBacktesting ? 'backtest-mode-active' : ''}`}>
      {/* ─── Header ─── */}
      <header className="header" id="main-header">
        <div className="header-brand">
          <div className="header-logo">⚡</div>
          <div>
            <div className="header-title">FLUXTRADE</div>
            <div className="header-subtitle">Multi-Exchange İstihbarat Terminali</div>
          </div>
        </div>

        <div className="header-status">
          <button 
            className={`premium-glass-btn sort-toggle ${autoSort ? 'active' : ''}`}
            onClick={() => setAutoSort(!autoSort)}
            title={autoSort ? "Yoğunluğa göre sıralama aktif" : "Sıralama sabit (Manuel mod)"}
          >
            {autoSort ? '⚡ Akıllı Sıralama' : '⏸️ Sabit Düzen'}
          </button>
          <OracleModal snapshots={snapshots} />
          <InfoModal />
          <BacktestPanel
            isActive={isBacktesting}
            onStartReplay={startBacktest}
            onStopReplay={stopBacktest}
          />
          <AlertsManager snapshots={snapshots} />

          <div className="exchange-badges" id="exchange-status">
            {isBacktesting ? (
              <div className="status-badge backtesting">
                <span className="status-dot" />
                ⏪ Backtest Aktif
              </div>
            ) : (
              Object.entries(exchangeStatuses).map(([exch, status]) => {
                const label = EXCHANGE_LABELS[exch];
                const isOk = status === 'connected';
                return (
                  <div
                    key={exch}
                    className={`exchange-pill ${isOk ? 'connected' : 'disconnected'}`}
                    title={`${label.name}: ${status}`}
                  >
                    <span className="pill-dot" />
                    {label.name}
                  </div>
                );
              })
            )}
          </div>

          <div className="header-stats">
            <div className="header-stat">
              <div className="header-stat-label">Msg/s</div>
              <div className="header-stat-value">{messagesPerSecond}</div>
            </div>
            <div className="header-stat">
              <div className="header-stat-label">Toplam İşlem</div>
              <div className="header-stat-value">{formatNumber(globalStats.totalTrades)}</div>
            </div>
            <div className="header-stat">
              <div className="header-stat-label">Saat</div>
              <div className="header-stat-value">{currentTime}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="main-content">
        <div className="dashboard-primary">
          <div className="stats-row" id="global-stats">
            <div className="stat-card buy">
              <div className="stat-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                Toplam Alım Hacmi
              </div>
              <div className="stat-value buy">{formatUsd(globalStats.totalBuyVolume)}</div>
              <div className="stat-detail">Taker buy orders</div>
            </div>
            <div className="stat-card sell">
              <div className="stat-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>
                Toplam Satım Hacmi
              </div>
              <div className="stat-value sell">{formatUsd(globalStats.totalSellVolume)}</div>
              <div className="stat-detail">Taker sell orders</div>
            </div>
            <div className="stat-card neutral">
              <div className="stat-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                İşlem Sayısı
              </div>
              <div className="stat-value neutral">{formatNumber(globalStats.totalTrades)}</div>
              <div className="stat-detail">aggTrade mesajları</div>
            </div>
            <div className="stat-card flow">
              <div className="stat-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                Net Para Akışı
              </div>
              <div className={`stat-value ${netFlow >= 0 ? 'positive' : 'negative'}`}>
                {netFlow >= 0 ? '+' : ''}{formatUsd(netFlow)}
              </div>
              <div className="stat-detail">
                {netFlow >= 0 ? 'Alıcılar baskın' : 'Satıcılar baskın'}
              </div>
            </div>
          </div>

          <div className="symbol-grid" id="symbol-grid">
            {sortedSymbols.map(sym => {
              const data = snapshots[sym.toUpperCase()];
              if (!data) return null;
              return (
                <SymbolCard 
                  key={sym} 
                  data={data} 
                  onClick={(s) => setSelectedSymbol(s)}
                />
              );
            })}
          </div>
        </div>

        {/* Whale Radar */}
        <div className="dashboard-radar-strip">
          <WhaleFeed trades={whaleTrades} />
        </div>

        {selectedSymbol && (
          <SymbolDetailModal
            symbol={selectedSymbol}
            data={snapshots[selectedSymbol.toUpperCase()]}
            whaleTrades={whaleTrades}
            onClose={() => setSelectedSymbol(null)}
          />
        )}
      </main>

      <footer className="footer" id="main-footer">
        <div className="footer-left">
          <span>⚡ FluxTrade v3.5 - High Intelligence</span>
          <span>•</span>
          <span>📡 {connectedCount}/3 Borsa Bağlı (Binance + Bybit + OKX)</span>
          <span className="build-ver-tag">v3.5 - STABLE</span>
        </div>
        <div className="footer-right">
          {currentTime}
        </div>
      </footer>
    </div>
  );
}
