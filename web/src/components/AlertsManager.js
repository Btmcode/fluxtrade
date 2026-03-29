'use client';

import { useState, useEffect, useRef } from 'react';

// A simple short futuristic ping sound
const ALERT_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';

export default function AlertsManager({ snapshots }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ symbol: 'BTCUSDT', metric: 'obi', condition: '>', value: '0.8' });
  const audioRef = useRef(null);
  const triggeredRef = useRef({}); // To prevent spamming the exact same alert within seconds

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fluxAlerts');
      if (saved) setAlerts(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
    
    audioRef.current = new Audio(ALERT_SOUND_URL);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Save to local storage when changed
  useEffect(() => {
    localStorage.setItem('fluxAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Evaluate conditions on every snapshot update
  useEffect(() => {
    if (!snapshots || Object.keys(snapshots).length === 0 || alerts.length === 0) return;

    alerts.forEach(alert => {
      const snap = snapshots[alert.symbol];
      if (!snap) return;

      let metricVal = 0;
      if (alert.metric === 'obi') metricVal = snap.obi;
      if (alert.metric === 'buyRatio') metricVal = snap.buyRatio;
      if (alert.metric === 'cvd') metricVal = snap.windowCvd;

      const targetVal = parseFloat(alert.value);
      let isTriggered = false;

      if (alert.condition === '>' && metricVal > targetVal) isTriggered = true;
      if (alert.condition === '<' && metricVal < targetVal) isTriggered = true;

      const triggerKey = `${alert.id}-${Date.now()}`;
      const lastTriggered = triggeredRef.current[alert.id] || 0;

      // Prevent spam: only trigger once every 60 seconds per rule
      if (isTriggered && Date.now() - lastTriggered > 60000) {
        triggeredRef.current[alert.id] = Date.now();
        fireAlert(alert, metricVal);
      }
    });
  }, [snapshots, alerts]);

  function fireAlert(alert, currentVal) {
    const text = `🚨 FluxTrade Uyarısı: ${alert.symbol} ${alert.metric.toUpperCase()} ${alert.condition} ${alert.value} koşulu sağlandı! (Anlık: ${currentVal.toFixed(2)})`;
    
    // Play sound (may require user interaction policy bypass, but typical for trading apps)
    audioRef.current?.play().catch(() => {});

    // Browser Push
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FluxTrade Sinyali', {
        body: text,
        icon: '/favicon.ico'
      });
    }

    // Console fallback
    console.log(text);
  }

  function addAlert() {
    setAlerts([...alerts, { ...newAlert, id: Date.now().toString() }]);
  }

  function removeAlert(id) {
    setAlerts(alerts.filter(a => a.id !== id));
  }

  return (
    <div className="alerts-manager-wrapper">
      <button 
        className={`alerts-toggle-btn ${alerts.length > 0 ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Uyarı Yöneticisi"
      >
        🔔 <span className="badge">{alerts.length}</span>
      </button>

      {isOpen && (
        <div className="alerts-dropdown animate-in">
          <div className="alerts-header">
            <h4>Bildirim Kuralları</h4>
            <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div className="alerts-form">
            <select value={newAlert.symbol} onChange={e => setNewAlert({...newAlert, symbol: e.target.value})}>
              <option value="BTCUSDT">BTC</option>
              <option value="ETHUSDT">ETH</option>
              <option value="SOLUSDT">SOL</option>
              <option value="BNBUSDT">BNB</option>
              <option value="XRPUSDT">XRP</option>
            </select>
            
            <select value={newAlert.metric} onChange={e => setNewAlert({...newAlert, metric: e.target.value})}>
              <option value="obi">Order Book Imbalance (OBI)</option>
              <option value="buyRatio">Alım Baskısı Oranı</option>
              <option value="cvd">CVD (USD)</option>
            </select>
            
            <select value={newAlert.condition} onChange={e => setNewAlert({...newAlert, condition: e.target.value})}>
              <option value=">">Büyüktür (&gt;)</option>
              <option value="<">Küçüktür (&lt;)</option>
            </select>
            
            <input 
              type="number" 
              step="0.01"
              value={newAlert.value} 
              onChange={e => setNewAlert({...newAlert, value: e.target.value})}
              placeholder="Değer (örn: 0.8 veya 500000)"
            />
            
            <button className="add-btn" onClick={addAlert}>+ Ekle</button>
          </div>

          <div className="alerts-list">
            {alerts.length === 0 && <div className="empty-state">Henüz hiç uyarı kuralı yok.</div>}
            {alerts.map(a => (
              <div key={a.id} className="alert-item">
                <span className="alert-text">{a.symbol} {a.metric.toUpperCase()} {a.condition} {a.value}</span>
                <button className="delete-btn" onClick={() => removeAlert(a.id)}>Sil</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .alerts-manager-wrapper {
          position: relative;
        }

        .alerts-toggle-btn {
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

        .alerts-toggle-btn:hover {
          background: var(--bg-card-hover);
        }

        .alerts-toggle-btn.active {
          border-color: var(--accent-cyan);
          box-shadow: var(--shadow-glow-cyan);
        }

        .badge {
          background: var(--accent-cyan);
          color: #000;
          font-size: 0.65rem;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .alerts-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 320px;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 16px;
          z-index: 50;
        }

        .alerts-header {
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

        .alerts-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .alerts-form select, .alerts-form input {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          color: var(--text-primary);
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
        }

        .add-btn {
          background: rgba(56, 189, 248, 0.1);
          color: var(--accent-cyan);
          border: 1px solid rgba(56, 189, 248, 0.2);
          padding: 6px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .add-btn:hover { background: rgba(56, 189, 248, 0.2); }

        .alerts-list {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .alert-item {
          background: var(--bg-secondary);
          padding: 8px;
          border-radius: var(--radius-sm);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          font-family: var(--font-mono);
        }

        .delete-btn {
          background: rgba(239, 68, 68, 0.1);
          color: var(--sell-primary);
          border: none;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .empty-state {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
