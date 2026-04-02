'use client';

import { formatUsd } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

export default function WhaleFeed({ trades }) {
  const [playAudio, setPlayAudio] = useState(false);
  const prevCount = useRef(0);

  useEffect(() => {
    if (playAudio && trades.length > prevCount.current && trades.length > 0) {
      const latest = trades[0];
      if (latest.usdVol >= 500000) {
        const msg = `Balina Alarmı! ${latest.s.replace('USDT', '')} üzerinde ${latest.m ? 'satış' : 'alım'} baskısı.`;
        const speech = new SpeechSynthesisUtterance(msg);
        speech.lang = 'tr-TR';
        window.speechSynthesis.speak(speech);
      }
    }
    prevCount.current = trades.length;
  }, [trades, playAudio]);

  return (
    <div className="whale-radar-ticker">
      <div className="radar-label">
        <div className="radar-pulse"></div>
        <span>WHALE RADAR</span>
      </div>
      
      <div className="ticker-viewport">
        <div className="ticker-track">
          {trades.length === 0 ? (
            <div className="ticker-item placeholder">Derin sular taranıyor... Anlık işlem bekleniyor.</div>
          ) : (
            // Repeat trades to ensure smooth looping
            [...trades, ...trades].map((t, idx) => (
              <div key={`${t.id || idx}-${idx}`} className={`ticker-item ${t.m ? 'sell' : 'buy'}`}>
                <span className="t-sym">{t.s.replace('USDT','')}</span>
                <span className="t-vol">{formatUsd(t.usdVol)}</span>
                <span className="t-exch">{t.x.toUpperCase()}</span>
                <span className="t-arrow">{t.m ? '↓' : '↑'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <button 
        className={`radar-audio-btn ${playAudio ? 'active' : ''}`}
        onClick={() => setPlayAudio(!playAudio)}
      >
        {playAudio ? '🔊' : '🔇'}
      </button>

      <style jsx>{`
        .whale-radar-ticker {
          display: flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          height: 44px;
          padding: 0 12px;
          gap: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .radar-label {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          font-weight: 800;
          font-size: 0.65rem;
          letter-spacing: 1.5px;
          color: #94a3b8;
          padding-right: 16px;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .radar-pulse {
          width: 6px;
          height: 6px;
          background: #38bdf8;
          border-radius: 50%;
          box-shadow: 0 0 10px #38bdf8;
          animation: pulse-ring 1.5s infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }

        .ticker-viewport {
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .ticker-track {
          display: flex;
          gap: 24px;
          animation: slide-ticker 30s linear infinite;
        }

        @keyframes slide-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          white-space: nowrap;
          animation: fade-in-scale 0.5s ease-out;
        }

        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .t-sym { font-weight: 700; color: #f8fafc; }
        .buy .t-vol { color: #10b981; }
        .sell .t-vol { color: #ef4444; }
        .t-exch { font-size: 0.6rem; color: #64748b; background: rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 4px; }
        
        .placeholder { color: #475569; font-style: italic; }

        .radar-audio-btn {
          background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0.6; transition: 0.2s;
        }
        .radar-audio-btn:hover { opacity: 1; transform: scale(1.1); }
        .radar-audio-btn.active { opacity: 1; }
      `}</style>
    </div>
  );
}
