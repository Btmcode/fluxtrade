/**
 * FluxTrade v3.0 — SymbolCard Component
 *
 * Premium Apple-quality UI featuring frosted glass layouts,
 * SVG radial gauges for signals, and animated liquid pressure bars.
 */
'use client';

import { formatUsd, formatPrice, getSymbolMeta } from '@/lib/utils';
import { useMemo } from 'react';

export default function SymbolCard({ data }) {
  const meta = getSymbolMeta(data.symbol);

  const signalClass = data.signal || 'signal-neutral';
  
  // Calculate stroke dasharray for the radial gauge (circumference of r=16 is ~100.5)
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (data.buyRatio * circumference);

  const gaugeColor = 
    data.buyRatio >= 0.6 ? 'var(--buy-primary)' :
    data.buyRatio <= 0.4 ? 'var(--sell-primary)' : 'var(--neutral-primary)';

  // Volume chart bars extraction
  const volumeHistory = data.volumeHistory || [];
  const maxVol = Math.max(
    ...volumeHistory.map(v => Math.max(v.buy, v.sell)),
    1
  );

  return (
    <div className="stat-card symbol-card-premium" id={`card-${data.symbol}`}>
      {/* Header Area */}
      <div className="symbol-header-flex">
        <div className="symbol-id-group">
          <div className={`symbol-logo-chip ${meta.icon}`}>
            {meta.short}
          </div>
          <div className="symbol-titles">
            <h2 className="symbol-name-display">{meta.name}</h2>
            <div className="symbol-ticker">{data.symbol}</div>
          </div>
        </div>
        <div className="symbol-price-group">
          <div className="symbol-current-price">
            {data.lastPrice > 0 ? formatPrice(data.lastPrice) : '—'}
          </div>
          <div className="symbol-trade-count">
            {data.totalTradeCount.toLocaleString()} vol
          </div>
        </div>
      </div>

      {/* Pressure Bar Area (Animated Gradient) */}
      <div className="pressure-container">
        <div className="pressure-labels-top">
          <span className="pressure-label-buy">Alış: {formatUsd(data.windowBuyVolume)}</span>
          <span className="pressure-label-sell">Satış: {formatUsd(data.windowSellVolume)}</span>
        </div>
        <div className="liquid-bar-track">
          <div 
            className="liquid-bar-fill"
            style={{ 
              width: `${Math.max(data.buyRatio * 100, 2)}%`,
              background: `linear-gradient(90deg, var(--buy-primary) 0%, ${gaugeColor} 100%)`
            }}
          />
        </div>
      </div>

      {/* Metrics Row Grid */}
      <div className="metrics-bento-row">
        <div className="metric-bento-cell">
          <div className="cell-label">CVD (60s)</div>
          <div className={`cell-value ${data.windowCvd >= 0 ? 'positive' : 'negative'}`}>
            {data.windowCvd >= 0 ? '+' : ''}{formatUsd(data.windowCvd)}
          </div>
        </div>
        
        <div className="metric-bento-cell">
          <div className="cell-label">Net Akış</div>
          <div className={`cell-value ${data.cvdLifetime >= 0 ? 'positive' : 'negative'}`}>
            {data.cvdLifetime >= 0 ? '+' : ''}{formatUsd(data.cvdLifetime)}
          </div>
        </div>

        <div className="metric-bento-cell">
          <div className="cell-label">OBI</div>
          <div className={`cell-value ${data.obi > 0.5 ? 'positive' : data.obi < 0.5 ? 'negative' : ''}`}>
            {(data.obi * 100).toFixed(1)}%
          </div>
        </div>

        {/* Radial Signal Gauge */}
        <div className="metric-bento-cell gauge-cell">
          <div className="cell-label">Momentum</div>
          <div className="radial-signal">
            <svg width="40" height="40" viewBox="0 0 40 40" className="radial-svg">
              <circle cx="20" cy="20" r="16" className="radial-bg" />
              <circle 
                cx="20" cy="20" r="16" 
                className="radial-progress"
                stroke={gaugeColor}
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
              />
            </svg>
            <div className="radial-text" style={{ color: gaugeColor }}>
              {(data.buyRatio * 100).toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Refined Volume Chart */}
      {volumeHistory.length > 2 && (
        <div className="mini-volume-chart">
          {volumeHistory.map((v, i) => {
            const dominant = v.buy >= v.sell ? 'buy' : 'sell';
            const height = Math.max((Math.max(v.buy, v.sell) / maxVol) * 100, 4);
            return (
              <div
                key={i}
                className={`mini-vol-bar ${dominant === 'buy' ? 'vol-buy' : 'vol-sell'}`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
