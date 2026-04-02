/**
 * FluxTrade v3.0 — SymbolCard Component
 *
 * Premium Apple-quality UI featuring frosted glass layouts,
 * SVG radial gauges for signals, and animated liquid pressure bars.
 */
'use client';

import { formatUsd, formatPrice, formatNumber, getSymbolMeta } from '@/lib/utils';
import { useMemo } from 'react';

export default function SymbolCard({ data, onClick }) {
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
    <div 
      className="stat-card symbol-card-premium compact" 
      id={`card-${data.symbol}`}
      onClick={() => onClick && onClick(data.symbol)}
      style={{ cursor: 'pointer' }}
    >
      {/* Compact Header */}
      <div className="symbol-header-flex compact">
        <div className="symbol-id-group">
          <div className={`symbol-logo-chip small ${meta.icon}`}>
            {meta.short}
          </div>
          <div className="symbol-titles">
            <h2 className="symbol-name-display compact">{meta.name}</h2>
            <div className="symbol-ticker small">{data.symbol}</div>
          </div>
        </div>
        <div className="symbol-price-group compact">
          <div className="symbol-current-price compact">
            {data.lastPrice > 0 ? formatPrice(data.lastPrice) : '—'}
          </div>
        </div>
      </div>

      {/* Slim Pressure Bar */}
      <div className="pressure-container compact">
        <div className="liquid-bar-track slim">
          <div 
            className="liquid-bar-fill"
            style={{ 
              width: `${Math.max(data.buyRatio * 100, 2)}%`,
              background: `linear-gradient(90deg, var(--buy-primary) 0%, ${gaugeColor} 100%)`
            }}
          />
        </div>
        <div className="pressure-labels-bottom">
          <span className="p-val buy">{formatUsd(data.windowBuyVolume)}</span>
          <span className="p-val sell">{formatUsd(data.windowSellVolume)}</span>
        </div>
      </div>

      {/* Compact Metrics Grid */}
      <div className="metrics-compact-row">
        <div className="m-cell">
          <span className="m-label">CVD</span>
          <span className={`m-val ${data.windowCvd >= 0 ? 'pos' : 'neg'}`}>
            {formatNumber(data.windowCvd / 1000)}k
          </span>
        </div>
        <div className="m-cell">
          <span className="m-label">OBI</span>
          <span className="m-val">{(data.obi * 100).toFixed(0)}%</span>
        </div>
        <div className="m-cell gauge-mini">
          <svg width="28" height="28" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" className="radial-bg" />
            <circle 
              cx="20" cy="20" r="16" 
              className="radial-progress"
              stroke={gaugeColor}
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeWidth="4"
            />
          </svg>
          <span className="m-val" style={{ color: gaugeColor }}>{(data.buyRatio * 100).toFixed(0)}</span>
        </div>
      </div>

      {/* Ultra Slim Vol Chart */}
      {volumeHistory.length > 2 && (
        <div className="mini-volume-chart slim">
          {volumeHistory.slice(-15).map((v, i) => {
            const dominant = v.buy >= v.sell ? 'buy' : 'sell';
            const height = Math.max((Math.max(v.buy, v.sell) / maxVol) * 100, 10);
            return (
              <div
                key={i}
                className={`mini-vol-bar ${dominant === 'buy' ? 'vol-buy' : 'vol-sell'}`}
                style={{ height: `${height}%`, width: '3px' }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
