/**
 * FluxTrade v3.0 — Dashboard Component
 *
 * Main dashboard with per-exchange status indicators,
 * multi-exchange data grid, alerts, and backtest controls.
 */
'use client';

import { useUnifiedStream } from '@/hooks/useUnifiedStream';
import { motion, AnimatePresence } from 'framer-motion';
import SymbolCard from '@/components/SymbolCard';
import AlertsManager from '@/components/AlertsManager';
import BacktestPanel from '@/components/BacktestPanel';
import InfoModal from '@/components/InfoModal';
import OracleModal from '@/components/OracleModal';
import WhaleFeed from '@/components/WhaleFeed';
import SymbolDetailModal from '@/components/SymbolDetailModal';
import AIRadar from '@/components/AIRadar';
import { formatUsd, formatNumber, formatPrice } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogIn, LogOut, User as UserIcon, Save, PieChart } from 'lucide-react';

const EXCHANGE_LABELS = {
  binance: { name: 'Binance', emoji: '🟡' },
  bybit:   { name: 'Bybit',   emoji: '🟠' },
  okx:     { name: 'OKX',     emoji: '🔵' },
};

export default function Dashboard() {
  const { marketData, lastAlert, isConnected } = useUnifiedStream();
  const [alerts, setAlerts] = useState([]);
  const { data: session } = useSession();

  // Manage alert history
  useEffect(() => {
    if (lastAlert) {
      setAlerts(prev => [lastAlert, ...prev].slice(0, 5));
    }
  }, [lastAlert]);

  // Legacy compatibility: Map marketData to snapshots format
  const snapshots = marketData;
  const connectedCount = isConnected ? 3 : 0; // Simplified for MVP
  const connectionStatus = isConnected ? 'connected' : 'connecting';
  const exchangeStatuses = { binance: isConnected ? 'connected' : 'off', bybit: isConnected ? 'connected' : 'off', okx: isConnected ? 'connected' : 'off' };
  const globalStats = { totalTrades: 0, totalBuyVolume: 0, totalSellVolume: 0, netFlow: 0 }; // Backend will provide these later
  const messagesPerSecond = 0; // Backend will provide this later
  const whaleTrades = []; // Phase 19 will re-integrate this
  const isBacktesting = false;
  const startBacktest = () => {};
  const stopBacktest = () => {};

  const [currentTime, setCurrentTime] = useState('');
  const [autoSort, setAutoSort] = useState(true);
  // Dynamic Symbol Selection (BTC + Top Momentum from Aggregator)
  const activeSymbols = Object.keys(marketData);
  const displaySymbols = ["BTCUSDT", ...activeSymbols.filter(s => s !== "BTCUSDT")].slice(0, 12);
  const symbols = displaySymbols;

  const [sortedSymbols, setSortedSymbols] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load user configuration from DB
  useEffect(() => {
    if (session?.user) {
      const fetchWatchlist = async () => {
        try {
          const res = await fetch('/api/watchlist');
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const savedSymbols = JSON.parse(data[0].symbols);
            if (savedSymbols.length > 0) {
              setSymbols(savedSymbols);
            }
          }
        } catch (error) {
          console.error('Watchlist Yükleme Hatası:', error);
        }
      };
      fetchWatchlist();
    }
  }, [session]);

  const handleSaveConfig = async () => {
    if (!session) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Default',
          symbols: symbols
        }),
      });
      if (res.ok) {
        alert('Yapılandırma başarıyla kaydedildi! ✅');
      } else {
        throw new Error('Kaydetme hatası');
      }
    } catch (error) {
      alert('Hata: Yapılandırma kaydedilemedi. ❌');
    } finally {
      setIsSaving(false);
    }
  };
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const lastSortTimeRef = useRef(0);

  // Handle Dynamic Sorting (Auto-Sort) - Throttled to 5 seconds
  useEffect(() => {
    if (!symbols.length) return;

    // Initial load
    if (sortedSymbols.length === 0) {
      setSortedSymbols(symbols);
      return;
    }

    if (!autoSort) return;

    // We check every time snapshots update, but only EXECUTE sort if 5s passed
    const now = Date.now();
    if (now - lastSortTimeRef.current < 5000) return;

    const btc = 'BTCUSDT';
    const others = symbols.filter(s => s.toUpperCase() !== btc);
    
    const sortedOthers = [...others].sort((a, b) => {
      const snapA = snapshots[a.toUpperCase()] || { windowBuyVolume: 0, windowSellVolume: 0 };
      const snapB = snapshots[b.toUpperCase()] || { windowBuyVolume: 0, windowSellVolume: 0 };
      const scoreA = (snapA.windowBuyVolume || 0) + (snapA.windowSellVolume || 0);
      const scoreB = (snapB.windowBuyVolume || 0) + (snapB.windowSellVolume || 0);
      return scoreB - scoreA; // Descending by intensity
    });

    setSortedSymbols([symbols.find(s => s.toUpperCase() === btc), ...sortedOthers]);
    lastSortTimeRef.current = now;
  }, [symbols, snapshots, autoSort, sortedSymbols.length]);

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
            <div className="header-title">FLUXTRADE <span className="build-ver-tag">v3.6-stable</span></div>
            <div className="header-subtitle">Senior Engineering Terminal — Multi-Exchange</div>
          </div>
        </div>

        <div className="header-market-temp">
          <div className="temp-label">Piyasa Isısı</div>
          <div className="temp-gauge-track">
            <div 
              className="temp-gauge-fill" 
              style={{ 
                width: `${globalStats.marketTemp || 50}%`,
                background: (globalStats.marketTemp || 50) > 50 ? 'var(--buy-primary)' : 'var(--sell-primary)',
                boxShadow: `0 0 10px ${(globalStats.marketTemp || 50) > 50 ? 'var(--buy-glow)' : 'var(--sell-glow)'}`
              }} 
            />
          </div>
          <div className="temp-value" style={{ color: (globalStats.marketTemp || 50) > 50 ? 'var(--buy-primary)' : 'var(--sell-primary)' }}>
            {(globalStats.marketTemp || 50)}% { (globalStats.marketTemp || 50) > 55 ? '🔥 Bul' : (globalStats.marketTemp || 50) < 45 ? '❄️ Bear' : '☁️ Nötr' }
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
          <Link href="/portfolio" className="premium-glass-btn portfolio-btn no-underline">
            <PieChart size={16} />
            <span>Portföy</span>
          </Link>
          <InfoModal />
          
          {session ? (
            <div className="user-profile-container">
              <button 
                className="premium-glass-btn user-btn" 
                onClick={() => signOut()}
                title={`${session.user.name} olarak çıkış yap`}
              >
                <UserIcon size={16} />
                <span className="user-name-trim">{session.user.name?.split(' ')[0]}</span>
                <LogOut size={14} className="logout-icon-sub" />
              </button>
              <button 
                className={`premium-glass-btn save-btn ${isSaving ? 'loading-pulse' : ''}`}
                onClick={handleSaveConfig}
                disabled={isSaving}
                title="İzleme listesini ve ayarları buluta kaydet"
              >
                <Save size={16} />
                <span>{isSaving ? 'Bekleyin...' : 'Kaydet'}</span>
              </button>
            </div>
          ) : (
            <button 
              className="premium-glass-btn login-btn" 
              onClick={() => signIn('github')}
              title="GitHub ile Terminale Bağlan (Veri Senkronizasyonu)"
            >
              <LogIn size={16} />
              <span>Bağlan</span>
            </button>
          )}

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

      <main className="main-content">
        <div className="dashboard-layout-body">
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
          <AIRadar snapshots={snapshots} />
        </div>

        {/* Whale Radar Strip */}
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

        {/* Floating Signal Toasts */}
        <div className="fixed bottom-12 right-8 z-[100] flex flex-col gap-4 max-w-[380px]">
          <AnimatePresence mode="popLayout">
            {alerts.map((alert, idx) => (
              <motion.div
                key={alert.timestamp || idx}
                initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.5, filter: 'blur(8px)', transition: { duration: 0.2 } }}
                layout
                className={`relative overflow-hidden p-4 rounded-2xl border backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 border-white/10 ${
                  alert.type === 'WHALE_ALERT' 
                  ? 'bg-blue-600/10' 
                  : 'bg-amber-500/10'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                  alert.type === 'WHALE_ALERT' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {alert.type === 'WHALE_ALERT' ? '🐋' : '⚡'}
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black tracking-widest uppercase opacity-40">
                      {alert.type.replace('_', ' ')}
                    </span>
                    <span className="text-[8px] font-mono opacity-20">
                      NOW
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-lg font-black text-white truncate">{alert.symbol}</h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      alert.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {alert.type === 'WHALE_ALERT' ? alert.side : 'PULSE'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white/70">
                    {alert.type === 'WHALE_ALERT' 
                      ? `$${(alert.value / 1000).toFixed(0)}K Transaction` 
                      : `${alert.label}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
