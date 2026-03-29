'use client';

import { useState, useRef } from 'react';

export default function BacktestPanel({ onStartReplay, onStopReplay, isActive }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [csvPreview, setCsvPreview] = useState('');

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setCsvPreview(text.substring(0, 200) + '...');
    };
    reader.readAsText(f);
  };

  const startReplay = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      // Basic CSV Parser for: timestamp_ms,symbol,price,quantity,is_buyer_maker(true/false)
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('timestamp'));
      
      const parsedTrades = lines.map(line => {
        const parts = line.split(',');
        if (parts.length >= 5) {
          return {
            timestampMs: parseInt(parts[0]),
            symbol: parts[1],
            price: parseFloat(parts[2]),
            quantity: parseFloat(parts[3]),
            isBuyerMaker: parts[4] === 'true' || parts[4] === '1',
            volumeUsd: parseFloat(parts[2]) * parseFloat(parts[3]),
            side: (parts[4] === 'true' || parts[4] === '1') ? 'SELL' : 'BUY',
            isBacktest: true
          };
        }
        return null;
      }).filter(t => t !== null);

      // Sort chronological
      parsedTrades.sort((a,b) => a.timestampMs - b.timestampMs);
      
      onStartReplay(parsedTrades, speed);
      setIsOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="backtest-panel-wrapper">
      <button 
        className={`backtest-toggle-btn ${isActive ? 'active-pulse' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        ⏮️ {isActive ? 'Backtest Aktif' : 'Backtest Modu'}
      </button>

      {isOpen && (
        <div className="backtest-dropdown animate-in">
          <div className="backtest-header">
            <h4>Zaman Makinesi (CSV Replay)</h4>
            <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div className="backtest-body">
            <p className="instruction">
              Trade geçmişi içeren bir CSV dosyası yükleyin.<br/>
              Format: <code>timestamp_ms, symbol, price, qty, is_buyer_maker</code>
            </p>
            
            <input type="file" accept=".csv" onChange={handleFile} />
            
            {csvPreview && (
              <div className="preview-box">
                {csvPreview}
              </div>
            )}

            <div className="speed-control">
              <label>Oynatma Hızı: {speed}x</label>
              <input 
                type="range" min="1" max="100" value={speed} 
                onChange={e => setSpeed(parseInt(e.target.value))} 
              />
            </div>

            <div className="actions">
              {isActive ? (
                <button className="stop-btn" onClick={() => { onStopReplay(); setIsOpen(false); }}>
                  ⏹️ Canlı Veriye Dön
                </button>
              ) : (
                <button className="play-btn" onClick={startReplay} disabled={!file}>
                  ▶️ Simülasyonu Başlat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .backtest-panel-wrapper {
          position: relative;
        }

        .backtest-toggle-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition-fast);
        }

        .backtest-toggle-btn:hover {
          background: var(--bg-card-hover);
        }

        .active-pulse {
          background: rgba(167, 139, 250, 0.15);
          border-color: var(--accent-purple);
          color: var(--accent-purple);
          animation: pulsePurple 2s infinite;
        }

        @keyframes pulsePurple {
          0% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(167, 139, 250, 0); }
          100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); }
        }

        .backtest-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 350px;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 16px;
          z-index: 50;
        }

        .backtest-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border-primary);
          padding-bottom: 8px;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .instruction {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        code {
          background: var(--bg-secondary);
          padding: 2px 4px;
          border-radius: 4px;
          font-family: var(--font-mono);
          color: var(--accent-cyan);
        }

        input[type="file"] {
          font-size: 0.8rem;
          margin-bottom: 12px;
          width: 100%;
        }

        .preview-box {
          background: var(--bg-secondary);
          padding: 8px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--text-tertiary);
          white-space: pre-wrap;
          margin-bottom: 12px;
          max-height: 80px;
          overflow-y: hidden;
        }

        .speed-control {
          background: var(--bg-secondary);
          padding: 10px;
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.8rem;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .play-btn {
          flex: 1;
          background: rgba(167, 139, 250, 0.15);
          color: var(--accent-purple);
          border: 1px solid rgba(167, 139, 250, 0.3);
          padding: 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .play-btn:hover:not(:disabled) { background: rgba(167, 139, 250, 0.25); }
        .play-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .stop-btn {
          flex: 1;
          background: rgba(239, 68, 68, 0.1);
          color: var(--sell-primary);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .stop-btn:hover { background: rgba(239, 68, 68, 0.2); }
      `}</style>
    </div>
  );
}
