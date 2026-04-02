'use client';

import { useState, useEffect } from 'react';
import { generateOracleAnalysis } from '@/lib/aiOracleEngine';

export default function OracleModal({ snapshots }) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysisText, setAnalysisText] = useState('Veriler senkronize ediliyor...');
  const [confidence, setConfidence] = useState(50);
  const [bias, setBias] = useState('nötr');
  const [isTyping, setIsTyping] = useState(false);
  const [targetSymbol, setTargetSymbol] = useState('BTCUSDT');

  // Trigger Oracle generation when modal is open or target changes
  useEffect(() => {
    if (!isOpen) return;
    
    // Simulate thinking delay
    setIsTyping(true);
    setAnalysisText('');
    setConfidence(50);
    setBias('nötr');

    const snap = snapshots[targetSymbol];
    
    const timer = setTimeout(() => {
      if (!snap) {
        setAnalysisText('Seçili borsa çiftinden veri bekleniyor... Lütfen bekleyin.');
        setIsTyping(false);
        return;
      }
      const result = generateOracleAnalysis(targetSymbol, snap);
      setConfidence(result.score);
      setBias(result.bias);
      setIsTyping(false);
      
      // Typewriter Effect
      let i = 0;
      const tTimer = setInterval(() => {
        setAnalysisText(result.text.slice(0, i));
        i++;
        if (i > result.text.length) clearInterval(tTimer);
      }, 20); // typing speed
      
    }, 800);

    return () => clearTimeout(timer);
  }, [isOpen, targetSymbol, snapshots]); // Intentionally leaving out snapshots from full reactive re-trigger to not interrupt typing unless symbol changes, but wait, usually we want snapshot updates to trigger a new thought. Let's not hook it to snapshots directly, only when modal opens or symbol changes.

  return (
    <>
      <button 
        className="premium-glass-btn oracle-trigger-btn"
        onClick={() => setIsOpen(true)}
      >
        <span className="ai-dot"></span>
        Flux Oracle
      </button>

      {isOpen && (
        <div className="oracle-overlay animate-fade-in" onClick={() => setIsOpen(false)}>
          <div className="oracle-modal animate-slide-up" onClick={e => e.stopPropagation()}>
            
            <button className="icon-btn-close" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="oracle-header">
              <div className="oracle-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#gradient-ai)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  <defs><linearGradient id="gradient-ai" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c084fc" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
                </svg>
              </div>
              <h3 className="gradient-text">Flux Oracle AI</h3>
            </div>

            <div className="symbol-selector">
              <span className="sel-label">Hedef Analiz:</span>
              <div className="sel-pills hide-scrollbar" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                {['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','YFIUSDT','AVAXUSDT','LINKUSDT'].map(sym => (
                  <button 
                    key={sym} 
                    className={`sym-pill ${targetSymbol === sym ? 'active-pill' : ''}`}
                    onClick={() => setTargetSymbol(sym)}
                  >
                    {sym.replace('USDT','')}
                  </button>
                ))}
              </div>
            </div>

            <div className="oracle-output-box">
              {isTyping ? (
                <div className="thinking-anim">
                  <div className="t-dot"></div><div className="t-dot"></div><div className="t-dot"></div>
                </div>
              ) : (
                <p className="typewriter-text">{analysisText}</p>
              )}
            </div>

            <div className="oracle-footer">
              <div className="conf-label">Yön İvmesi / Güven Skoru</div>
              <div className="conf-bar-wrapper">
                <div 
                  className={`conf-bar-fill ${bias}`}
                  style={{ width: `${Math.max(confidence, 5)}%` }}
                />
              </div>
              <div className="conf-score-text">
                <span className={`bias-tag ${bias}`}>{bias.toUpperCase()} EĞİLİMİ</span>
                <span>%{(confidence).toFixed(0)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      <style jsx>{`
        .oracle-trigger-btn {
          border-color: rgba(192, 132, 252, 0.3);
          color: #e879f9;
        }
        .oracle-trigger-btn:hover { background: rgba(192, 132, 252, 0.1); border-color: rgba(192, 132, 252, 0.5); box-shadow: 0 0 15px rgba(192,132,252,0.2); }
        .ai-dot { width: 8px; height: 8px; background: #e879f9; border-radius: 50%; box-shadow: 0 0 10px #e879f9; animation: pulseAi 2s infinite; }

        @keyframes pulseAi { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.85); box-shadow: 0 0 20px #e879f9; } }

        .oracle-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .oracle-modal {
          position: relative; width: 90%; max-width: 500px;
          background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(25px);
          border: 1px solid rgba(192, 132, 252, 0.3); border-radius: var(--radius-xl);
          padding: 30px; box-shadow: 0 25px 50px -12px rgba(192, 132, 252, 0.2);
        }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .icon-btn-close {
          position: absolute; top: 20px; right: 20px;
          background: none; border: none; color: var(--text-tertiary); cursor: pointer; transition: 0.2s;
        }
        .icon-btn-close:hover { color: white; transform: rotate(90deg); }

        .oracle-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .oracle-icon-wrapper {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(192, 132, 252, 0.1); border: 1px solid rgba(192, 132, 252, 0.3);
          display: flex; align-items: center; justify-content: center;
        }
        .gradient-text {
          font-size: 1.4rem; margin: 0; font-weight: 700; letter-spacing: -0.5px;
          background: linear-gradient(90deg, #c084fc, #22d3ee);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .symbol-selector { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .sel-label { font-size: 0.8rem; color: var(--text-secondary); }
        .sel-pills { display: flex; gap: 8px; }
        .sym-pill {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary); padding: 4px 10px; border-radius: 100px;
          font-size: 0.75rem; cursor: pointer; transition: 0.2s;
        }
        .sym-pill:hover { background: rgba(255,255,255,0.1); color: white; }
        .active-pill { background: rgba(34, 211, 238, 0.15); border-color: rgba(34, 211, 238, 0.4); color: #22d3ee; }

        .oracle-output-box {
          background: rgba(0,0,0,0.3); border: 1px dashed rgba(192, 132, 252, 0.3);
          border-radius: 12px; padding: 20px; min-height: 120px;
          font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.6; color: #e2e8f0;
          margin-bottom: 24px;
        }

        .thinking-anim { display: flex; gap: 6px; align-items: center; height: 80px; justify-content: center; }
        .t-dot { width: 8px; height: 8px; background: #c084fc; border-radius: 50%; animation: bounceAi 1.4s infinite ease-in-out both; }
        .t-dot:nth-child(1) { animation-delay: -0.32s; }
        .t-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounceAi { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        .oracle-footer { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; }
        .conf-label { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        
        .conf-bar-wrapper { width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
        .conf-bar-fill { height: 100%; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1), background 0.5s; }
        .conf-bar-fill.long { background: linear-gradient(90deg, #10b981, #34d399); box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); }
        .conf-bar-fill.short { background: linear-gradient(90deg, #ef4444, #f87171); box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
        .conf-bar-fill.nötr { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }

        .conf-score-text { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 0.9rem; font-weight: 600; color: white; }
        .bias-tag { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; border: 1px solid; }
        .bias-tag.long { color: #10b981; border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1); }
        .bias-tag.short { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); }
        .bias-tag.nötr { color: #94a3b8; border-color: rgba(148, 163, 184, 0.3); background: rgba(148, 163, 184, 0.1); }
      `}</style>
    </>
  );
}
