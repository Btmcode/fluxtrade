'use client';

import { useEffect, useRef, useState } from 'react';
import { formatUsd, formatPrice, getSymbolMeta } from '@/lib/utils';

export default function SymbolDetailModal({ symbol, data, onClose, whaleTrades }) {
  const meta = getSymbolMeta(symbol);
  const container = useRef();
  
  // Filter whale trades for ONLY this symbol
  const symbolWhales = whaleTrades.filter(t => t.s.toLowerCase() === symbol.toLowerCase()).slice(0, 10);

  useEffect(() => {
    if (!symbol) return;
    
    // Inject TradingView Widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": `BINANCE:${symbol.toUpperCase()}`,
      "interval": "1",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "tr",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "backgroundColor": "rgba(0, 0, 0, 1)",
      "gridColor": "rgba(0, 0, 0, 0.06)",
      "container_id": "tv_chart_container"
    });
    
    if (container.current) {
      container.current.innerHTML = '';
      container.current.appendChild(script);
    }
  }, [symbol]);

  if (!symbol || !data) return null;

  return (
    <div className="detail-overlay animate-fade-in" onClick={onClose}>
      <div className="detail-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        
        {/* Floating Close */}
        <button className="icon-btn-close" onClick={onClose} style={{ top: '20px', right: '20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="detail-layout">
          
          {/* Header Section */}
          <div className="detail-header">
            <div className="detail-symbol-info">
              <div className={`detail-logo-chip ${meta.icon}`}>{meta.short}</div>
              <div>
                <h2 className="detail-title">{meta.name} Analizi</h2>
                <div className="detail-subtitle">{symbol.toUpperCase()} — Canlı Veri Akışı</div>
              </div>
            </div>
            <div className="detail-price-box">
              <div className="d-price">{formatPrice(data.lastPrice)}</div>
              <div className={`d-change ${data.buyRatio >= 0.5 ? 'pos' : 'neg'}`}>
                {data.buyRatio >= 0.5 ? '↑' : '↓'} %{((data.buyRatio - 0.5) * 200).toFixed(2)} Momentum
              </div>
            </div>
          </div>

          <div className="detail-grid">
            
            {/* Left: TradingView Chart */}
            <div className="detail-chart-card">
              <div id="tv_chart_container" ref={container} style={{ height: '500px', width: '100%' }}>
                <div className="chart-loader">Grafik yükleniyor...</div>
              </div>
            </div>

            {/* Right: Intelligence Panel */}
            <div className="detail-intel-panel">
              
              <div className="intel-section">
                <h4 className="intel-title">⚡ Likidite Metrikleri</h4>
                <div className="intel-metrics">
                  <div className="i-metric">
                    <span>CVD (60s)</span>
                    <strong className={data.windowCvd >= 0 ? 'pos' : 'neg'}>{formatUsd(data.windowCvd)}</strong>
                  </div>
                  <div className="i-metric">
                    <span>OBI (Depth)</span>
                    <strong>%{(data.obi * 100).toFixed(1)}</strong>
                  </div>
                </div>
              </div>

              <div className="intel-section">
                <h4 className="intel-title">🐋 Son Balina Hareketleri ({symbol.replace('USDT','')})</h4>
                <div className="symbol-whale-list">
                  {symbolWhales.length === 0 ? (
                    <div className="no-whales">Bu sembolde henüz büyük işlem saptanmadı.</div>
                  ) : (
                    symbolWhales.map((t, i) => (
                      <div key={i} className={`s-whale-item ${t.m ? 'sell' : 'buy'}`}>
                        <span>{t.m ? '🔴 Satış' : '🟢 Alım'}</span>
                        <strong>{formatUsd(t.usdVol)}</strong>
                        <span className="s-whale-time">{new Date().toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button className="premium-glass-btn share-btn" onClick={() => {
                navigator.clipboard.writeText(`FluxTrade Intelligence Analysis: ${symbol} is showing ${(data.buyRatio*100).toFixed(0)}% buy pressure!`);
                alert('Analiz linki kopyalandı! X (Twitter) veya Telegram\'da paylaşabilirsiniz.');
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                Analizi Paylaş
              </button>

            </div>

          </div>

        </div>
      </div>

      <style jsx>{`
        .detail-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(15px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .detail-modal {
          position: relative; width: 100%; max-width: 1200px; max-height: 90vh;
          background: rgba(10, 14, 23, 0.9); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 40px; overflow-y: auto;
          box-shadow: 0 50px 100px rgba(0,0,0,0.5);
        }
        .detail-layout { display: flex; flex-direction: column; gap: 30px; }
        
        .detail-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
        .detail-symbol-info { display: flex; align-items: center; gap: 15px; }
        .detail-logo-chip { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
        .detail-title { font-size: 1.8rem; margin: 0; font-weight: 700; }
        .detail-subtitle { font-size: 0.9rem; color: #94a3b8; }
        
        .detail-price-box { text-align: right; }
        .d-price { font-size: 2rem; font-weight: 800; font-family: var(--font-mono); }
        .d-change { font-size: 0.9rem; font-weight: 600; margin-top: 4px; }
        .d-change.pos { color: #10b981; }
        .d-change.neg { color: #ef4444; }

        .detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 30px; }
        
        .detail-chart-card { background: black; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
        .chart-loader { height: 100%; display: flex; align-items: center; justify-content: center; color: #475569; }

        .detail-intel-panel { display: flex; flex-direction: column; gap: 20px; }
        .intel-section { background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .intel-title { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; }
        .intel-metrics { display: flex; flex-direction: column; gap: 12px; }
        .i-metric { display: flex; justify-content: space-between; font-size: 0.9rem; }
        .i-metric span { color: #94a3b8; }
        .pos { color: #10b981; }
        .neg { color: #ef4444; }

        .symbol-whale-list { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
        .s-whale-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; padding: 8px; border-radius: 8px; background: rgba(0,0,0,0.2); }
        .s-whale-item.buy { border-left: 3px solid #10b981; }
        .s-whale-item.sell { border-left: 3px solid #ef4444; }
        .s-whale-time { font-size: 0.65rem; color: #475569; }
        .no-whales { font-size: 0.8rem; color: #475569; font-style: italic; text-align: center; padding: 20px 0; }

        .share-btn { width: 100%; justify-content: center; gap: 10px; margin-top: 10px; border-color: #38bdf8; color: #38bdf8; }
        .share-btn:hover { background: rgba(56, 189, 248, 0.1); }

        @media (max-width: 1000px) {
          .detail-grid { grid-template-columns: 1fr; }
          .detail-modal { padding: 20px; }
        }
      `}</style>
    </div>
  );
}
