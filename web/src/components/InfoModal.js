'use client';

import { useState } from 'react';

export default function InfoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="premium-glass-btn info-trigger-btn"
        onClick={() => setIsOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Keşfet
      </button>

      {isOpen && (
        <div className="apple-fullscreen-presentation animate-fade-in">
          
          <button className="apple-close-btn" onClick={() => setIsOpen(false)}>
            <span>Kapat</span>
            <div className="close-circle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </button>

          <div className="presentation-scroll-container">
            
            {/* HERO SECTION */}
            <section className="apple-hero-section">
              <div className="hero-glow"></div>
              <h1 className="apple-hero-title">FluxTrade 3.</h1>
              <h2 className="apple-hero-subtitle">Borsa verilerine yepyeni bir kutlama.</h2>
              <p className="apple-hero-text">
                Kripto dünyasının devleri Binance, Bybit ve OKX'i aynı anda dinleyerek, orderflow ve likidite dengesini saniyede 100 kere tarayıcınızda işler. Gecikme yok. Aracı sunucu yok. Sadece saf, kesintisiz veri.
              </p>
            </section>

            {/* BENTO GRID FEATURES SECTION */}
            <section className="apple-bento-section">
              <div className="bento-grid">
                
                {/* OBI Card */}
                <div className="bento-card card-large">
                  <div className="card-bg-gradient gradient-cyan"></div>
                  <div className="bento-content">
                    <div className="bento-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    </div>
                    <h3>Order Book Imbalance (OBI)</h3>
                    <p>Likidite duvarlarının arkasını görün. Emir defterindeki anlık dengesizlikleri yüzdelik olarak (Örn: 80% Alış Duvarı) tespit eder.</p>
                  </div>
                </div>

                {/* CVD Card */}
                <div className="bento-card card-medium">
                  <div className="card-bg-gradient gradient-purple"></div>
                  <div className="bento-content">
                    <div className="bento-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    </div>
                    <h3>Kümülatif Hacim (CVD)</h3>
                    <p>Piyasadaki saf "Akıllı Para" (Smart Money) ağırlığını USD cinsinden ölçer. Suni hareketleri filtreler.</p>
                  </div>
                </div>

                {/* Automation Card */}
                <div className="bento-card card-small">
                  <div className="card-bg-gradient gradient-green"></div>
                  <div className="bento-content">
                    <div className="bento-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <h3>Zaman Makinesi</h3>
                    <p>Kendi stratejilerinizi geçmiş verilerle (CSV) gerçek zamanlı yeniden oynatarak simüle edin.</p>
                  </div>
                </div>

                {/* Velocity Card */}
                <div className="bento-card card-small">
                  <div className="card-bg-gradient gradient-orange"></div>
                  <div className="bento-content">
                    <div className="bento-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    </div>
                    <h3>Hız Sensörü</h3>
                    <p>Alım ve satım ivmesini renkli Radial (Halka) grafiklerle anlık takip edin.</p>
                  </div>
                </div>

              </div>
            </section>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Header Button Trigger */
        .info-trigger-btn {
          color: #f1f5f9;
          border-color: rgba(255,255,255,0.1);
        }
        .info-trigger-btn:hover { background: rgba(255,255,255,0.1); }

        /* Fullscreen Takeover */
        .apple-fullscreen-presentation {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(4, 6, 10, 0.85);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          color: white;
          overflow: hidden;
        }

        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }

        /* Floating Close Button */
        .apple-close-btn {
          position: absolute;
          top: 30px; right: 40px;
          display: flex; align-items: center; gap: 12px;
          background: none; border: none; color: #a1a1aa;
          cursor: pointer; z-index: 100;
          font-size: 0.85rem; font-weight: 500; letter-spacing: 0.5px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .close-circle {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s;
        }
        .apple-close-btn:hover { color: white; }
        .apple-close-btn:hover .close-circle { background: rgba(255,255,255,0.15); transform: rotate(90deg) scale(1.05); }

        /* Presentation Scroll Area */
        .presentation-scroll-container {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 80px 20px 100px;
          display: flex; flex-direction: column; align-items: center;
        }
        .presentation-scroll-container::-webkit-scrollbar { width: 0; }

        /* Hero Section */
        .apple-hero-section {
          text-align: center; max-width: 800px; margin: 0 auto 80px; position: relative;
        }
        .hero-glow {
          position: absolute; top: -50%; left: 50%; transform: translateX(-50%);
          width: 100%; height: 200%; background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%);
          z-index: -1; pointer-events: none;
        }
        .apple-hero-title {
          font-size: clamp(3rem, 6vw, 5rem); font-weight: 600; letter-spacing: -0.04em;
          background: linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          margin-bottom: 5px;
        }
        .apple-hero-subtitle {
          font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 400; color: #a1a1aa; letter-spacing: -0.02em;
          margin-bottom: 30px;
        }
        .apple-hero-text {
          font-size: 1.15rem; color: #71717a; line-height: 1.6; max-width: 600px; margin: 0 auto;
          font-weight: 300;
        }

        /* Bento Grid Section */
        .apple-bento-section {
          width: 100%; max-width: 1100px; margin: 0 auto;
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 20px;
        }

        .bento-card {
          position: relative; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05); border-radius: 24px;
          padding: 40px; overflow: hidden;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s;
        }
        .bento-card:hover { transform: translateY(-4px) scale(1.01); background: rgba(255,255,255,0.03); }

        .card-large { grid-column: span 2; }
        .card-medium { grid-column: span 1; }
        .card-small { grid-column: span 1; }

        .card-bg-gradient {
          position: absolute; top: -50%; right: -50%; width: 100%; height: 100%;
          border-radius: 50%; opacity: 0.15; filter: blur(60px); z-index: 0;
          transition: opacity 0.5s;
        }
        .bento-card:hover .card-bg-gradient { opacity: 0.3; }
        
        .gradient-cyan { background: #22d3ee; }
        .gradient-purple { background: #c084fc; }
        .gradient-green { background: #34d399; }
        .gradient-orange { background: #fb923c; }

        .bento-content { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }
        .bento-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
        }
        .bento-content h3 { font-size: 1.35rem; font-weight: 500; letter-spacing: -0.02em; margin-bottom: 12px; color: #f4f4f5; }
        .bento-content p { font-size: 0.95rem; line-height: 1.6; color: #a1a1aa; font-weight: 400; flex: 1; }

        /* Responsive Layout */
        @media (max-width: 900px) {
          .bento-grid { grid-template-columns: 1fr; }
          .card-large, .card-medium, .card-small { grid-column: span 1; padding: 30px; }
          .apple-hero-title { margin-top: 40px; }
        }
      `}</style>
    </>
  );
}
