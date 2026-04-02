/**
 * FluxTrade — AIRadar Component
 * 
 * A high-intelligence sidebar that aggregates the top AI signals 
 * from across all monitored exchanges.
 */
'use client';

import { generateOracleAnalysis } from '@/lib/aiOracleEngine';
import { useMemo } from 'react';

export default function AIRadar({ snapshots }) {
  const topSignals = useMemo(() => {
    if (!snapshots) return [];
    
    return Object.entries(snapshots)
      .map(([symbol, snap]) => {
        const analysis = generateOracleAnalysis(symbol, snap);
        return { symbol, ...analysis };
      })
      .filter(a => a.bias !== 'nötr')
      .sort((a, b) => {
        // Sort by 'conviction' (distance from 50)
        const convictionA = Math.abs(a.score - 50);
        const convictionB = Math.abs(b.score - 50);
        return convictionB - convictionA;
      })
      .slice(0, 5); // Keep top 5 strongest signals
  }, [snapshots]);

  return (
    <aside className="ai-radar-container">
      <div className="radar-header">
        <span className="radar-icon">📡</span>
        <div className="radar-title-group">
          <h3 className="radar-title">AGENTIC RADAR</h3>
          <p className="radar-subtitle">Live AI Momentum Analysis</p>
        </div>
      </div>

      <div className="radar-feed">
        {topSignals.length === 0 ? (
          <div className="radar-empty">
            <div className="radar-scanner" />
            <p>Piyasa taranıyor... Belirgin bir anomali saptanmadı.</p>
          </div>
        ) : (
          topSignals.map((sig) => (
            <div key={sig.symbol} className={`radar-item bias-${sig.bias}`}>
              <div className="item-header">
                <span className="item-symbol">{sig.symbol.replace('USDT', '')}</span>
                <span className="item-score">{sig.score} pps</span>
              </div>
              <p className="item-text">{sig.text.split('): ')[1]}</p>
              <div className="item-footer">
                <div className="conviction-bar">
                  <div 
                    className="conviction-fill" 
                    style={{ width: `${sig.score}%` }} 
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .ai-radar-container {
          width: 320px;
          height: 100%;
          background: rgba(15, 15, 20, 0.4);
          backdrop-filter: blur(20px);
          border-left: 1px solid var(--border-primary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .radar-header {
          padding: 20px;
          border-bottom: 1px solid var(--border-primary);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .radar-icon {
          font-size: 1.5rem;
          filter: drop-shadow(0 0 10px var(--accent-primary));
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }

        .radar-title {
          font-size: 0.85rem;
          font-weight: 900;
          letter-spacing: 2px;
          color: #fff;
          margin: 0;
        }

        .radar-subtitle {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          margin: 0;
        }

        .radar-feed {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .radar-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: transform 0.2s ease;
        }

        .radar-item:hover {
          transform: translateX(-5px);
          background: rgba(255, 255, 255, 0.05);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .item-symbol {
          font-weight: 800;
          font-size: 0.9rem;
          color: #fff;
        }

        .item-score {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.3);
        }

        .item-text {
          font-size: 0.75rem;
          line-height: 1.4;
          color: var(--text-secondary);
          margin: 0 0 10px 0;
        }

        .conviction-bar {
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .conviction-fill {
          height: 100%;
          transition: width 1s ease;
        }

        .bias-long { border-left: 3px solid var(--buy-primary); }
        .bias-short { border-left: 3px solid var(--sell-primary); }
        .bias-long .conviction-fill { background: var(--buy-primary); }
        .bias-short .conviction-fill { background: var(--sell-primary); }

        .radar-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-tertiary);
          text-align: center;
          font-size: 0.8rem;
          gap: 15px;
        }

        .radar-scanner {
          width: 40px;
          height: 40px;
          border: 2px solid var(--accent-primary);
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </aside>
  );
}
