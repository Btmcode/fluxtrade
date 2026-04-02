'use client';

import { useState, useRef } from 'react';
import { formatUsd } from '@/lib/utils';

export default function BacktestPanel({ onStartReplay, onStopReplay, isActive }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [speed, setSpeed] = useState(5);
  const [csvPreview, setCsvPreview] = useState(null);
  const [tradeCount, setTradeCount] = useState(0);
  
  // Fake progress state logic strictly for UI display logic (replaces generic bar)
  // Replay actually processes on the backend context or parent component state in JS
  const [progress, setProgress] = useState(0);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      setTradeCount(lines.length - 1);
      
      const snippetLines = lines.slice(0, 5);
      setCsvPreview(snippetLines.join('\n'));
    };
    reader.readAsText(f);
  };

  const startReplay = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
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

      parsedTrades.sort((a,b) => a.timestampMs - b.timestampMs);
      
      onStartReplay(parsedTrades, speed);
      setProgress(0); // Optional: Link progress back via props later
      setIsOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* Header Button */}
      <button 
        className={`premium-glass-btn ${isActive ? 'btn-active-backtest' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        {isActive ? 'Zaman Makinesi (Aktif)' : 'Zaman Makinesi'}
      </button>

      {/* Full-Screen Overlay Modal */}
      {isOpen && (
        <div className="fullscreen-overlay animate-fade-in" onClick={() => setIsOpen(false)}>
          <div className="premium-modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="modal-header-hero">
              <div className="hero-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
              <h2>Geçmiş Veri Simülasyonu</h2>
              <p>Stratejilerinizi geçmiş emir defteri verileriyle gerçek zamanlı test edin.</p>
            </div>

            <div className="modal-content-grid">
              
              {/* File Upload Area */}
              <div className="upload-zone">
                <div className="upload-label">Trade Geçmişi (CSV)</div>
                <label className="upload-box glass-panel">
                  <input type="file" accept=".csv" className="hidden-file-input" onChange={handleFile} />
                  <div className="upload-interior">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <span>{file ? file.name : "Dosya Yüklemek İçin Tıklayın"}</span>
                  </div>
                </label>
                
                {file && (
                  <div className="upload-meta glass-panel">
                    <div className="meta-stat">
                      <span className="meta-lbl">Kayıt Sayısı:</span>
                      <span className="meta-val">{tradeCount.toLocaleString()} İşlem</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Area */}
              <div className="controls-zone">
                <div className="speed-slider-container glass-panel">
                  <div className="slider-header">
                    <span>Oynatma Hızı</span>
                    <span className="speed-val">{speed}x</span>
                  </div>
                  <input 
                    type="range" min="1" max="100" value={speed} 
                    className="premium-slider"
                    onChange={e => setSpeed(parseInt(e.target.value))} 
                  />
                  <div className="slider-ticks">
                    <span>1x</span>
                    <span>100x</span>
                  </div>
                </div>

                <div className="modal-actions">
                  {isActive ? (
                    <button className="premium-btn btn-danger" onClick={() => { onStopReplay(); setIsOpen(false); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                      Simülasyonu Durdur (Canlıya Dön)
                    </button>
                  ) : (
                    <button className="premium-btn btn-primary" onClick={startReplay} disabled={!file}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      Simülasyonu Başlat
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Premium Header Button */
        .premium-glass-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary);
          padding: 8px 16px;
          border-radius: 100px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all var(--transition-med);
          backdrop-filter: blur(10px);
        }
        .premium-glass-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }
        .btn-active-backtest {
          background: rgba(167, 139, 250, 0.15);
          color: #d8b4fe;
          border-color: rgba(167, 139, 250, 0.4);
          box-shadow: 0 0 15px rgba(167, 139, 250, 0.2);
        }

        /* Overlay */
        .fullscreen-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Modal */
        .premium-modal {
          position: relative;
          width: 90%;
          max-width: 600px;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          padding: 40px;
          overflow: hidden;
        }
        .premium-modal::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        }

        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(40px) scale(0.98); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        .modal-close-btn {
          position: absolute;
          top: 24px; right: 24px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-tertiary);
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-close-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }

        .modal-header-hero {
          text-align: center;
          margin-bottom: 32px;
        }
        .hero-icon {
          width: 64px; height: 64px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(167, 139, 250, 0.05));
          border: 1px solid rgba(167, 139, 250, 0.3);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #c4b5fd;
          box-shadow: 0 0 20px rgba(167, 139, 250, 0.15);
        }
        .modal-header-hero h2 {
          font-size: 1.5rem;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .modal-header-hero p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .modal-content-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .glass-panel {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: var(--radius-md);
          padding: 16px;
        }

        .upload-label { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px; }
        
        .upload-box {
          display: block;
          cursor: pointer;
          border: 1px dashed rgba(255,255,255,0.15);
          transition: all 0.2s;
          margin-bottom: 12px;
        }
        .upload-box:hover {
          border-color: rgba(167, 139, 250, 0.4);
          background: rgba(167, 139, 250, 0.05);
        }
        .upload-interior {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 32px 0;
          color: var(--text-secondary);
        }
        .hidden-file-input { display: none; }

        .upload-meta { display: flex; align-items: center; justify-content: center; }
        .meta-stat { display: flex; gap: 8px; font-size: 0.85rem; }
        .meta-lbl { color: var(--text-tertiary); }
        .meta-val { color: var(--text-primary); font-family: var(--font-mono); font-weight: 500; }

        .slider-header { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 0.85rem; color: var(--text-secondary); }
        .speed-val { color: #c4b5fd; font-family: var(--font-mono); font-weight: 600; }
        
        .premium-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 100px;
          outline: none;
          margin-bottom: 8px;
        }
        .premium-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #c4b5fd;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(167, 139, 250, 0.5);
          transition: transform 0.1s;
        }
        .premium-slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
        
        .slider-ticks { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-tertiary); font-family: var(--font-mono); }

        .premium-btn {
          width: 100%;
          padding: 16px;
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-weight: 600;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(167, 139, 250, 0.05));
          border: 1px solid rgba(167, 139, 250, 0.4);
          color: #c4b5fd;
          box-shadow: 0 4px 20px rgba(167, 139, 250, 0.1);
        }
        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(167, 139, 250, 0.1));
          box-shadow: 0 4px 25px rgba(167, 139, 250, 0.2);
        }
        .btn-primary:disabled {
          opacity: 0.4; cursor: not-allowed;
        }

        .btn-danger {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        .btn-danger:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.1));
        }
      `}</style>
    </>
  );
}
