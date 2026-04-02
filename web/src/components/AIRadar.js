/**
 * FluxTrade — AIRadar Component (Agentic v4.0)
 * 
 * A high-intelligence sidebar that synthesizes a global market narrative 
 * from across all monitored exchanges.
 */
'use client';

import { generateOracleAnalysis, generateMarketNarrative } from '@/lib/aiOracleEngine';
import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Radar as RadarIcon, 
  Activity, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Cpu
} from 'lucide-react';

export default function AIRadar({ snapshots }) {
  const [narrative, setNarrative] = useState('');
  
  const marketNarrative = useMemo(() => generateMarketNarrative(snapshots), [snapshots]);
  
  // Typewriter effect for Narrative
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setNarrative(marketNarrative.slice(0, i));
      i++;
      if (i > marketNarrative.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [marketNarrative]);

  const topSignals = useMemo(() => {
    if (!snapshots) return [];
    
    return Object.entries(snapshots)
      .map(([symbol, snap]) => {
        const analysis = generateOracleAnalysis(symbol, snap);
        return { symbol, ...analysis };
      })
      .filter(a => a.bias !== 'nötr')
      .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
      .slice(0, 6);
  }, [snapshots]);

  return (
    <aside className="w-[380px] h-full bg-[#080808]/40 backdrop-blur-2xl border-l border-white/5 flex flex-col overflow-hidden relative">
      {/* Absolute Radar Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-64 h-64 border border-blue-500 rounded-full animate-ping duration-10000" />
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-32 h-32 border border-blue-400/50 rounded-full animate-pulse" />
      </div>

      <div className="relative z-10 p-6 border-b border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Cpu size={20} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-[0.3em] text-white uppercase group-hover:text-blue-400 transition-colors">
              Agentic Intelligence
            </h3>
            <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mt-0.5">
              Cross-Exchange Narrative
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 min-h-[80px] relative overflow-hidden group">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            className="absolute left-0 top-0 w-0.5 bg-blue-500/50 group-hover:bg-blue-400 transition-colors" 
          />
          <p className="text-xs font-black leading-relaxed tracking-wider text-blue-100/80 italic">
            {narrative}<span className="animate-pulse">|</span>
          </p>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Active Anomalies</span>
          <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
            <Activity size={10} /> {topSignals.length} DETECTED
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {topSignals.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-4"
            >
              <RadarIcon size={48} className="mx-auto opacity-10 animate-pulse text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Scanning Global Pools...</p>
            </motion.div>
          ) : (
            topSignals.map((sig, idx) => (
              <motion.div
                key={sig.symbol}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer ${
                  sig.bias === 'long' ? 'hover:border-emerald-500/20' : 'hover:border-rose-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black tracking-tighter text-white">{sig.symbol.replace('USDT', '')}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${
                      sig.bias === 'long' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {sig.bias}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-white/40">{sig.score} pps</span>
                    {sig.bias === 'long' ? <TrendingUp size={12} className="text-emerald-400" /> : <TrendingDown size={12} className="text-rose-400" />}
                  </div>
                </div>

                <p className="text-[11px] font-semibold text-white/50 group-hover:text-white/80 transition-colors leading-relaxed">
                  {sig.text.replace('🛡️ Oracle: ', '')}
                </p>

                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={14} className="text-white/20" />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer System Stats */}
      <div className="relative z-10 p-4 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest opacity-20">Oracle Sync: Live</span>
        </div>
        <div className="text-[8px] font-mono opacity-20">
          PROT_V4.0
        </div>
      </div>
    </aside>
  );
}
