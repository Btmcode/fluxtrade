'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  BarChart3, 
  ShieldAlert, 
  Share2,
  Activity,
  Globe
} from 'lucide-react';
import { formatUsd, formatPrice, getSymbolMeta, formatNumber } from '@/lib/utils';

export default function SymbolDetailModal({ symbol, data, onClose, whaleTrades }) {
  const meta = getSymbolMeta(symbol);
  const chartContainer = useRef();
  
  // Filter and process whales
  const symbolWhales = whaleTrades.filter(t => t.s.toLowerCase() === symbol.toLowerCase()).slice(0, 15);
  
  // Calculate Volume Profile (Conceptual)
  const tradeDistribution = [
    { label: 'Retail (<$1k)', value: 15, color: 'bg-slate-500' },
    { label: 'Professional ($1k-$10k)', value: 35, color: 'bg-blue-500' },
    { label: 'Institutional ($10k-$100k)', value: 30, color: 'bg-indigo-500' },
    { label: 'Whale (>$100k)', value: 20, color: 'bg-purple-600' }
  ];

  useEffect(() => {
    if (!symbol) return;
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": `BINANCE:${symbol.toUpperCase()}`,
      "interval": "1",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "backgroundColor": "rgba(0, 0, 0, 1)",
      "gridColor": "rgba(255, 255, 255, 0.05)",
      "container_id": "tv_chart_container"
    });
    
    if (chartContainer.current) {
      chartContainer.current.innerHTML = '';
      chartContainer.current.appendChild(script);
    }
  }, [symbol]);

  if (!symbol || !data) return null;

  const isBullish = data.buyRatio >= 0.5;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[1400px] h-full max-h-[900px] bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col"
      >
        {/* Header Bar */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-2xl font-black shadow-inner`}>
              {symbol[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black tracking-tighter text-white">{symbol.toUpperCase()}</h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                  <Globe size={10} /> Global Stream
                </div>
              </div>
              <p className="text-sm font-semibold opacity-40 uppercase tracking-widest mt-1">Intelligence Deep-Dive — Real-time Analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-3xl font-black font-mono text-white leading-none mb-1">
                {formatPrice(data.lastPrice)}
              </div>
              <div className={`text-xs font-black flex items-center justify-end gap-1 ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isBullish ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                {(data.buyRatio * 100).toFixed(1)}% PRESSURE
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-white/50 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
          {/* Main Chart Area */}
          <div className="flex-1 bg-black p-4 relative">
            <div id="tv_chart_container" ref={chartContainer} className="w-full h-full rounded-xl overflow-hidden" />
          </div>

          {/* Intelligence Sidebar */}
          <div className="w-full xl:w-[450px] bg-white/[0.02] border-l border-white/5 p-8 overflow-y-auto space-y-10">
            
            {/* Liquidity Profile */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-2">
                <Activity size={14} className="text-blue-500" /> Liquidity Engine
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold opacity-40 uppercase block mb-1">CVD (60s Delta)</span>
                  <div className={`text-xl font-black ${data.windowCvd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.windowCvd > 0 ? '+' : ''}{formatUsd(data.windowCvd)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold opacity-40 uppercase block mb-1">Book Imbalance</span>
                  <div className="text-xl font-black text-white">
                    %{(data.obi * 100).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Distribution */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-2">
                <BarChart3 size={14} className="text-purple-500" /> Participant Distribution
              </h3>
              <div className="space-y-4">
                {tradeDistribution.map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="opacity-50">{item.label}</span>
                      <span className="text-white">{item.value}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        className={`h-full ${item.color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Institutional Whale Stream */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-2">
                <ShieldAlert size={14} className="text-amber-500" /> Institutional Feed
              </h3>
              <div className="space-y-2">
                {symbolWhales.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold opacity-20 border border-dashed border-white/10 rounded-2xl">
                    No significant whale flows detected in window.
                  </div>
                ) : (
                  symbolWhales.map((t, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl flex items-center justify-between ${t.m ? 'bg-rose-500/5 text-rose-400' : 'bg-emerald-500/5 text-emerald-400'} border border-current/10`}
                    >
                      <div className="flex items-center gap-3">
                        <Zap size={14} />
                        <span className="text-xs font-black">{t.m ? 'SELL' : 'BUY'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white">{formatUsd(t.usdVol)}</div>
                        <div className="text-[8px] opacity-40 font-mono">{(t.q).toFixed(3)} {symbol.replace('USDT','')}</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`FluxTrade Institutional Report: ${symbol} Buy Pressure at ${(data.buyRatio*100).toFixed(1)}%. CVD: ${formatUsd(data.windowCvd)}.`);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest"
              >
                <Share2 size={16} /> Link Report
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
