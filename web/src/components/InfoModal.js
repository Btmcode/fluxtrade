'use client';

import { useState } from 'react';

export default function InfoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="premium-glass-btn info-trigger-btn"
        onClick={() => setIsOpen(true)}
        title="Nasıl Çalışır?"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Nasıl Çalışır?
      </button>

      {isOpen && (
        <div className="fullscreen-overlay animate-fade-in" onClick={() => setIsOpen(false)}>
          <div className="premium-modal animate-scale-up" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="modal-header-hero">
              <div className="hero-icon info-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
              <h2>FluxTrade Terminali</h2>
              <p>Kurumsal seviye, tarayıcı tabanlı kripto istihbarat platformu.</p>
            </div>

            <div className="info-content-scroll">
              <div className="info-section">
                <h3><span className="sec-num">1</span> Bu Proje Nedir?</h3>
                <p>
                  FluxTrade, kripto para piyasalarındaki mikro yapısal hareketleri (order flow, likidite değişimleri) gerçek zamanlı analiz eden <strong>Apple kalitesinde premium bir gösterge panelidir.</strong> 
                  Sıradan grafiklerin ötesine geçerek piyasanın "içyüzünü" gösterir.
                </p>
              </div>

              <div className="info-section">
                <h3><span className="sec-num">2</span> Nasıl Çalışır?</h3>
                <p>
                  Terminal, gücünü <strong>Browser-Native Multi-Exchange</strong> mimarisinden alır. Aracı bir backend sunucusuna ihtiyaç duymadan, tarayıcınız üzerinden doğrudan <strong>Binance, Bybit ve OKX</strong> WebSocket verilerine bağlanır.
                </p>
                <div className="metric-cards">
                  <div className="metric-card">
                    <div className="m-title">OBI (Order Book Imbalance)</div>
                    <div className="m-desc">Emir defterindeki alım (Bid) ve satım (Ask) likidite oranını (0 ile 1 arası) ölçer. Yüksek OBI, alım duvarlarının kalın olduğunu gösterir.</div>
                  </div>
                  <div className="metric-card">
                    <div className="m-title">CVD (Cumulative Volume Delta)</div>
                    <div className="m-desc">Market alımları ile market satımları arasındaki net hacim farkını (USD) gösterir. Akıllı para (smart money) eğilimini yakalar.</div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3><span className="sec-num">3</span> Nasıl Kullanılır?</h3>
                <ul className="feature-list">
                  <li>
                    <strong>Sinyal Halkaları (Radial Gauges):</strong> Kartlardaki yuvarlak gösterge yeşile döndüğünde güçlü bir alım momentumu, kırmızıda ise satım baskısı vardır.
                  </li>
                  <li>
                    <strong>Zaman Makinesi (Backtest):</strong> Kendi algoritmalarınızı (veya dışa aktarılan trade history CSV dosyalarını) geçmiş verilerle test etmek için "Zaman Makinesi" butonunu kullanın. Canlı veriyi durdurup geçmişi istediğiniz hızda tekrar oynatır.
                  </li>
                  <li>
                    <strong>Bildirim Merkezi:</strong> Sizi sürekli ekrana kilitlemez. Zil ikonuna tıklayıp <em>"BTC OBI değeri 0.8 üzerine çıkarsa"</em> gibi akıllı alarmlar kurabilirsiniz.
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              v3.0 Edge Architecture • Client-Side Processing
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .target-wrapper { position: relative; }

        .premium-glass-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary);
          padding: 8px 16px;
          border-radius: 100px;
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          font-size: 0.8rem; font-weight: 500;
          transition: all var(--transition-med);
          backdrop-filter: blur(10px);
        }
        .premium-glass-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
        .info-trigger-btn { color: #93c5fd; border-color: rgba(147, 197, 253, 0.2); }
        .info-trigger-btn:hover { background: rgba(147, 197, 253, 0.1); border-color: rgba(147, 197, 253, 0.4); }

        .fullscreen-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          z-index: 1000; display: flex; align-items: center; justify-content: center;
        }

        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .premium-modal {
          position: relative; width: 90%; max-width: 650px; max-height: 85vh;
          background: var(--bg-card); border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl); box-shadow: 0 30px 60px -15px rgba(0,0,0,0.6);
          padding: 40px; overflow: hidden; display: flex; flex-direction: column;
        }
        .premium-modal::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.3), transparent);
        }

        .animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scaleUp { 
          from { opacity: 0; transform: scale(0.96) translateY(20px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }

        .modal-close-btn {
          position: absolute; top: 24px; right: 24px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-tertiary); width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; z-index: 10;
        }
        .modal-close-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); transform: rotate(90deg); }

        .modal-header-hero { text-align: center; margin-bottom: 30px; flex-shrink: 0; }
        .info-icon {
          width: 64px; height: 64px; margin: 0 auto 16px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.05));
          border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #7dd3fc; box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
        }
        .modal-header-hero h2 { font-size: 1.6rem; color: var(--text-primary); margin-bottom: 8px; font-weight: 700; letter-spacing: -0.5px; }
        .modal-header-hero p { color: var(--text-secondary); font-size: 0.95rem; font-weight: 400; }

        .info-content-scroll {
          overflow-y: auto; padding-right: 12px;
          display: flex; flex-direction: column; gap: 28px;
        }
        .info-content-scroll::-webkit-scrollbar { width: 6px; }
        .info-content-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .info-section h3 {
          font-size: 1.05rem; color: var(--text-primary); margin-bottom: 12px;
          display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;
        }
        .sec-num {
          background: rgba(56, 189, 248, 0.15); color: #7dd3fc;
          width: 24px; height: 24px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; font-family: var(--font-mono);
        }
        
        .info-section p { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; }
        .info-section strong { color: var(--text-primary); font-weight: 600; }

        .metric-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        .metric-card {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
          padding: 16px; border-radius: 12px; transition: 0.3s;
        }
        .metric-card:hover { border-color: rgba(56, 189, 248, 0.3); background: rgba(56, 189, 248, 0.02); }
        .m-title { font-family: var(--font-mono); font-weight: 600; color: #7dd3fc; font-size: 0.85rem; margin-bottom: 8px; }
        .m-desc { font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.5; }

        .feature-list { list-style: none; padding: 0; margin: 12px 0 0 0; display: flex; flex-direction: column; gap: 12px; }
        .feature-list li {
          position: relative; padding-left: 20px; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;
        }
        .feature-list li::before {
          content: '•'; position: absolute; left: 0; color: #7dd3fc; font-size: 1.5rem; line-height: 1; top: -2px;
        }

        .modal-footer {
          margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);
          text-align: center; font-size: 0.75rem; color: var(--text-tertiary); font-family: var(--font-mono); flex-shrink: 0;
        }
      `}</style>
    </>
  );
}
