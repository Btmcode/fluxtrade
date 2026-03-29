/**
 * FluxTrade — SymbolCard Component
 * 
 * Displays a single symbol's live pressure, CVD, signal, and volume chart.
 */
'use client';

import { formatUsd, formatPrice, getSymbolMeta } from '@/lib/utils';

export default function SymbolCard({ data }) {
  const meta = getSymbolMeta(data.symbol);
  
  const signalClass = data.signal || 'signal-neutral';
  const cardSignalClass = 
    signalClass.includes('buy') ? 'signal-buy' : 
    signalClass.includes('sell') ? 'signal-sell' : 'signal-neutral';

  // Volume chart bars
  const volumeHistory = data.volumeHistory || [];
  const maxVol = Math.max(
    ...volumeHistory.map(v => Math.max(v.buy, v.sell)),
    1
  );

  return (
    <div className={`symbol-card animate-in ${cardSignalClass}`} id={`card-${data.symbol}`}>
      {/* Header */}
      <div className="symbol-header">
        <div className="symbol-info">
          <div className={`symbol-icon ${meta.icon}`}>
            {meta.short}
          </div>
          <div>
            <div className="symbol-name">{meta.name}</div>
            <div className="symbol-pair">{data.symbol} • Perpetual</div>
          </div>
        </div>
        <div className="symbol-price-area">
          <div className="symbol-price">
            {data.lastPrice > 0 ? formatPrice(data.lastPrice) : '—'}
          </div>
          <div className="symbol-trades">
            {data.totalTradeCount.toLocaleString()} işlem
          </div>
        </div>
      </div>

      {/* Pressure Bar */}
      <div className="pressure-section">
        <div className="pressure-labels">
          <span className="pressure-label buy">
            ALIŞ {formatUsd(data.windowBuyVolume)}
          </span>
          <span className="pressure-label sell">
            SATIŞ {formatUsd(data.windowSellVolume)}
          </span>
        </div>
        <div className="pressure-bar-track">
          <div 
            className={`pressure-bar-fill ${
              data.buyRatio >= 0.55 ? 'bullish' : 
              data.buyRatio <= 0.45 ? 'bearish' : 'neutral-bar'
            }`}
            style={{ width: `${Math.max(data.buyRatio * 100, 2)}%` }}
          />
        </div>
        <div className="pressure-percentage" style={{ 
          color: data.buyRatio >= 0.55 ? 'var(--buy-primary)' : 
                 data.buyRatio <= 0.45 ? 'var(--sell-primary)' : 'var(--text-secondary)' 
        }}>
          {(data.buyRatio * 100).toFixed(1)}% Alıcı Baskısı
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="metric-box">
          <div className="metric-box-label">CVD (60s)</div>
          <div className={`metric-box-value ${data.windowCvd >= 0 ? 'positive' : 'negative'}`}>
            {data.windowCvd >= 0 ? '+' : ''}{formatUsd(data.windowCvd)}
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-box-label">Net Akış</div>
          <div className={`metric-box-value ${data.cvdLifetime >= 0 ? 'positive' : 'negative'}`}>
            {data.cvdLifetime >= 0 ? '+' : ''}{formatUsd(data.cvdLifetime)}
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-box-label">OBI</div>
          <div className={`metric-box-value ${data.obi > 0.5 ? 'positive' : data.obi < 0.5 ? 'negative' : ''}`}>
            {(data.obi * 100).toFixed(1)}%
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-box-label">Sinyal</div>
          <div className="metric-box-value">
            <span className={`signal-badge ${data.signal}`}>
              {data.signalLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Mini Volume Chart */}
      {volumeHistory.length > 2 && (
        <div className="volume-chart">
          {volumeHistory.map((v, i) => {
            const dominant = v.buy >= v.sell ? 'buy' : 'sell';
            const height = Math.max((Math.max(v.buy, v.sell) / maxVol) * 100, 4);
            return (
              <div
                key={i}
                className={`volume-bar ${dominant === 'buy' ? 'buy-bar' : 'sell-bar'}`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
