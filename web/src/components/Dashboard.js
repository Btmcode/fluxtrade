/**
 * FluxTrade — Dashboard Component
 * 
 * Main dashboard layout with header, stats row, symbol cards, and footer.
 */
'use client';

import { useBinanceStream } from '@/hooks/useBinanceStream';
import SymbolCard from '@/components/SymbolCard';
import AlertsManager from '@/components/AlertsManager';
import BacktestPanel from '@/components/BacktestPanel';
import { formatUsd, formatNumber } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { 
    snapshots, 
    globalStats, 
    connectionStatus, 
    connectionMode,
    messagesPerSecond, 
    symbols,
    startBacktest,
    stopBacktest,
    isBacktesting
  } = useBinanceStream();
  
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
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
            <div className="header-subtitle">Canlı Piyasa İstihbarat Terminali</div>
          </div>
        </div>

        <div className="header-status">
          <BacktestPanel 
            isActive={isBacktesting}
            onStartReplay={startBacktest}
            onStopReplay={stopBacktest}
          />
          <AlertsManager snapshots={snapshots} />
          
          <div className={`status-badge ${connectionStatus}`} id="connection-status">
            <span className="status-dot" />
            {connectionStatus === 'connected' && connectionMode === 'aggregator' && '🟢 Aggregator'}
            {connectionStatus === 'connected' && connectionMode === 'direct-binance' && '🟡 Binance Direct'}
            {connectionStatus === 'connecting' && 'Bağlanıyor...'}
            {connectionStatus === 'disconnected' && 'Bağlantı Kesildi'}
            {connectionStatus === 'backtesting' && '⏪ Backtest Aktif'}
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
        {/* Stats Row */}
        <div className="stats-row" id="global-stats">
          <div className="stat-card buy">
            <div className="stat-label">📈 Toplam Alım Hacmi</div>
            <div className="stat-value buy">{formatUsd(globalStats.totalBuyVolume)}</div>
            <div className="stat-detail">Taker buy orders</div>
          </div>
          <div className="stat-card sell">
            <div className="stat-label">📉 Toplam Satım Hacmi</div>
            <div className="stat-value sell">{formatUsd(globalStats.totalSellVolume)}</div>
            <div className="stat-detail">Taker sell orders</div>
          </div>
          <div className="stat-card neutral">
            <div className="stat-label">📊 İşlem Sayısı</div>
            <div className="stat-value neutral">{formatNumber(globalStats.totalTrades)}</div>
            <div className="stat-detail">aggTrade mesajları</div>
          </div>
          <div className="stat-card flow">
            <div className="stat-label">💰 Net Para Akışı</div>
            <div className={`stat-value ${netFlow >= 0 ? 'positive' : 'negative'}`}>
              {netFlow >= 0 ? '+' : ''}{formatUsd(netFlow)}
            </div>
            <div className="stat-detail">
              {netFlow >= 0 ? 'Alıcılar baskın' : 'Satıcılar baskın'}
            </div>
          </div>
        </div>

        {/* Symbol Cards Grid */}
        <div className="symbol-grid" id="symbol-grid">
          {symbols.map(sym => {
            const data = snapshots[sym];
            if (!data) {
              return (
                <div key={sym} className="symbol-card animate-in signal-neutral">
                  <div className="loading-container" style={{ minHeight: '200px' }}>
                    <div className="loading-spinner" />
                    <div className="loading-text">{sym} bağlanıyor...</div>
                  </div>
                </div>
              );
            }
            return <SymbolCard key={sym} data={data} />;
          })}
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="footer" id="main-footer">
        <div className="footer-left">
          <span>⚡ FluxTrade v2.0</span>
          <span>•</span>
          <span>📡 {connectionMode === 'aggregator' ? 'Kaynak: Multi-Exchange Aggregator (Binance + Bybit + OKX)' : connectionMode === 'direct-binance' ? 'Kaynak: Binance Direct (Fallback)' : 'Backtest Modu'}</span>
          <span>•</span>
          <span>CVD: 60s pencere | Baskı: 10s pencere</span>
        </div>
        <div className="footer-right">
          {currentTime}
        </div>
      </footer>
    </div>
  );
}
