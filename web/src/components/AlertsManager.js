'use client';

import { useState, useEffect, useRef } from 'react';

const ALERT_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';

export default function AlertsManager({ snapshots }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ symbol: 'BTCUSDT', metric: 'obi', condition: '>', value: '0.8' });
  const audioRef = useRef(null);
  const triggeredRef = useRef({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fluxAlerts');
      if (saved) setAlerts(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
    audioRef.current = new Audio(ALERT_SOUND_URL);
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fluxAlerts', JSON.stringify(alerts));
  }, [alerts]);

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

      const lastTriggered = triggeredRef.current[alert.id] || 0;

      if (isTriggered && Date.now() - lastTriggered > 60000) {
        triggeredRef.current[alert.id] = Date.now();
        fireAlert(alert, metricVal);
        
        // Update state to record the trigger time for the UI
        setAlerts(prev => prev.map(a => 
          a.id === alert.id ? { ...a, lastTriggeredTime: Date.now() } : a
        ));
      }
    });
  }, [snapshots, alerts]);

  function fireAlert(alert, currentVal) {
    const text = `🚨 FluxTrade: ${alert.symbol} ${alert.metric.toUpperCase()} ${alert.condition} ${alert.value} (${currentVal.toFixed(2)})`;
    audioRef.current?.play().catch(() => {});
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FluxTrade İhbarı', { body: text });
    }
  }

  function addAlert() {
    setAlerts([...alerts, { ...newAlert, id: Date.now().toString(), lastTriggeredTime: null }]);
  }

  function removeAlert(id) {
    setAlerts(alerts.filter(a => a.id !== id));
  }

  // Format time ago
  const getTimeAgo = (ms) => {
    if (!ms) return 'Bekliyor...';
    const diff = Math.floor((Date.now() - ms) / 1000);
    if (diff < 60) return `Az önce (${diff}sn)`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}dk önce`;
    return `${Math.floor(mins / 60)}s önce`;
  };

  return (
    <div className="alerts-center-wrapper">
      <button 
        className={`premium-glass-btn alerts-trigger-btn ${alerts.length > 0 ? 'has-active-alerts' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Bildirim Merkezi"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {alerts.length > 0 && <span className="premium-badge">{alerts.length}</span>}
      </button>

      {isOpen && (
        <div className="notification-center animate-slide-down">
          <div className="nc-header">
            <h3>Bildirim Merkezi</h3>
            <button className="icon-btn-close" onClick={() => setIsOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div className="nc-body">
            <div className="add-rule-panel">
              <div className="panel-title">Yeni Kural Ekle</div>
              <div className="compact-rule-form">
                <select value={newAlert.symbol} onChange={e => setNewAlert({...newAlert, symbol: e.target.value})}>
                  <option value="BTCUSDT">BTC</option><option value="ETHUSDT">ETH</option><option value="SOLUSDT">SOL</option><option value="BNBUSDT">BNB</option><option value="XRPUSDT">XRP</option>
                </select>
                <select value={newAlert.metric} onChange={e => setNewAlert({...newAlert, metric: e.target.value})}>
                  <option value="obi">OBI</option><option value="buyRatio">Alım %</option><option value="cvd">CVD</option>
                </select>
                <select value={newAlert.condition} onChange={e => setNewAlert({...newAlert, condition: e.target.value})}>
                  <option value=">">&gt;</option><option value="<">&lt;</option>
                </select>
                <input type="number" step="0.01" value={newAlert.value} onChange={e => setNewAlert({...newAlert, value: e.target.value})} placeholder="Değer" className="val-input" />
                <button className="premium-btn-sm" onClick={addAlert}>Ekle</button>
              </div>
            </div>

            <div className="active-rules-list">
              <div className="panel-title">Aktif İzlenenler</div>
              
              {alerts.length === 0 ? (
                <div className="nc-empty-state">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
                  <span>Henüz cihazınıza kayıtlı bir kural yok.</span>
                </div>
              ) : (
                <div className="rules-scroll-area">
                  {alerts.map(a => {
                    const isRecentlyTriggered = a.lastTriggeredTime && (Date.now() - a.lastTriggeredTime < 60000);
                    return (
                      <div key={a.id} className={`rule-glass-card ${isRecentlyTriggered ? 'glow-active' : ''}`}>
                        <div className="rule-info">
                          <div className="rule-condition">
                            <span className="r-sym">{a.symbol.replace('USDT','')}</span>
                            <span className="r-met">{a.metric.toUpperCase()}</span>
                            <span className="r-con">{a.condition}</span>
                            <span className="r-val">{a.value}</span>
                          </div>
                          <div className="rule-status">
                            <span className={`status-dot ${a.lastTriggeredTime ? 'triggered' : 'waiting'}`}></span>
                            Durum: {getTimeAgo(a.lastTriggeredTime)}
                          </div>
                        </div>
                        <button className="rule-del-btn" onClick={() => removeAlert(a.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .alerts-center-wrapper { position: relative; }

        /* Reuse premium header btn style but add specific glow if active */
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
        
        .has-active-alerts {
          border-color: rgba(45, 212, 191, 0.4);
          color: #5eead4;
        }

        .premium-badge {
          background: #0f766e;
          color: #ccfbf1;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .notification-center {
          position: absolute;
          top: calc(100% + 12px); right: 0;
          width: 360px;
          background: var(--bg-card);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          overflow: hidden;
          z-index: 100;
        }
        
        .animate-slide-down { animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: top right; }
        @keyframes slideDown { 
          from { opacity: 0; transform: translateY(-10px) scale(0.95); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        .nc-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border-primary);
        }
        .nc-header h3 { font-size: 0.9rem; font-weight: 600; letter-spacing: 0.5px; }
        
        .icon-btn-close {
          background: none; border: none; color: var(--text-tertiary);
          cursor: pointer; padding: 4px; border-radius: 4px; transition: 0.2s;
        }
        .icon-btn-close:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }

        .nc-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 20px; }
        
        .panel-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-tertiary); margin-bottom: 10px; font-weight: 600; }

        .compact-rule-form {
          display: grid;
          grid-template-columns: minmax(70px, 1fr) minmax(60px, 1fr) 40px 1fr auto;
          gap: 6px;
        }
        
        .compact-rule-form select, .compact-rule-form input {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary);
          border-radius: 6px;
          padding: 6px;
          font-size: 0.75rem;
          outline: none;
        }
        .compact-rule-form select:focus, .compact-rule-form input:focus { border-color: rgba(45, 212, 191, 0.5); }
        .val-input { text-align: center; }

        .premium-btn-sm {
          background: rgba(45, 212, 191, 0.15);
          color: #5eead4;
          border: 1px solid rgba(45, 212, 191, 0.3);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.75rem; font-weight: 600;
          cursor: pointer; transition: 0.2s;
        }
        .premium-btn-sm:hover { background: rgba(45, 212, 191, 0.25); box-shadow: 0 0 10px rgba(45, 212, 191, 0.1); }

        .rules-scroll-area {
          max-height: 250px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 8px;
          padding-right: 4px;
        }
        .rules-scroll-area::-webkit-scrollbar { width: 4px; }
        .rules-scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        .nc-empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 30px 0; color: var(--text-tertiary); gap: 12px; text-align: center; font-size: 0.8rem;
        }

        .rule-glass-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 12px;
          display: flex; justify-content: space-between; align-items: center;
          transition: 0.3s;
        }
        .glow-active {
          border-color: rgba(45, 212, 191, 0.4);
          box-shadow: inset 0 0 15px rgba(45, 212, 191, 0.1);
          animation: rulePulse 2s infinite;
        }
        @keyframes rulePulse {
          0%, 100% { box-shadow: inset 0 0 0px rgba(45, 212, 191, 0); }
          50% { box-shadow: inset 0 0 15px rgba(45, 212, 191, 0.15); }
        }

        .rule-info { display: flex; flex-direction: column; gap: 6px; }
        .rule-condition { display: flex; gap: 6px; font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; }
        
        .r-sym { color: var(--text-primary); }
        .r-met { color: #5eead4; }
        .r-con { color: var(--text-secondary); }
        .r-val { color: var(--buy-secondary); }

        .rule-status { display: flex; align-items: center; gap: 6px; font-size: 0.65rem; color: var(--text-tertiary); }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .status-dot.triggered { background: #10b981; box-shadow: 0 0 5px #10b981; }
        .status-dot.waiting { background: #64748b; }

        .rule-del-btn {
          background: none; border: none; color: var(--text-tertiary);
          padding: 6px; border-radius: 4px; cursor: pointer; transition: 0.2s;
        }
        .rule-del-btn:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; }
      `}</style>
    </div>
  );
}
