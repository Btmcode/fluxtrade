/**
 * FluxTrade — Ejder Kaptan Welcome Animation
 * 
 * Epic full-screen animated welcome splash with dragon theme.
 * Styles are in globals.css for proper Next.js compatibility.
 */
'use client';

import { useState, useEffect } from 'react';

export default function WelcomeSplash({ onComplete }) {
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const pts = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      size: 3 + Math.random() * 8,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 2,
      color: ['#ff6b35', '#ff8c42', '#ffd700', '#ff4500', '#ff1744', '#ffab00'][Math.floor(Math.random() * 6)],
      drift: -20 + Math.random() * 40,
    }));
    setParticles(pts);

    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 5500),
      setTimeout(() => onComplete?.(), 6500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`splash-overlay ${phase >= 4 ? 'splash-exit' : ''}`}>
      {/* Ambient background effects */}
      <div className="splash-bg-glow splash-glow-1" />
      <div className="splash-bg-glow splash-glow-2" />
      <div className="splash-bg-glow splash-glow-3" />

      {/* Fire particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="fire-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}

      {/* Dragon emoji with pulse */}
      <div className={`splash-dragon ${phase >= 0 ? 'splash-visible' : ''}`}>
        🐉
      </div>

      {/* Main title */}
      <h1 className={`splash-title ${phase >= 1 ? 'splash-visible' : ''}`}>
        <span className="splash-title-line">
          {'Ejder Kaptan\'a'.split('').map((char, i) => (
            <span
              key={i}
              className="splash-char"
              style={{ animationDelay: `${1.2 + i * 0.06}s` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
        <span className="splash-title-line splash-title-line-2">
          {'Selamlar!'.split('').map((char, i) => (
            <span
              key={i}
              className="splash-char"
              style={{ animationDelay: `${1.8 + i * 0.06}s` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </h1>

      {/* Subtitle */}
      <p className={`splash-subtitle ${phase >= 2 ? 'splash-visible' : ''}`}>
        ⚡ FluxTrade Piyasa İstihbarat Terminali Hazır
      </p>

      {/* Decorative fire line */}
      <div className={`splash-fire-line ${phase >= 3 ? 'splash-visible' : ''}`} />

      {/* Skip hint */}
      <div 
        className={`splash-skip ${phase >= 2 ? 'splash-visible' : ''}`} 
        onClick={() => { setPhase(4); setTimeout(() => onComplete?.(), 800); }}
      >
        Devam etmek için tıklayın →
      </div>
    </div>
  );
}
