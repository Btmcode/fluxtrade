'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart as PieIcon, 
  ArrowLeft, 
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { formatUsd, formatNumber } from '@/lib/utils';

export default function PortfolioPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGGREGATOR_URL || 'http://localhost:8000'}/api/portfolio`);
      if (!res.ok) throw new Error('API Bağlantı Hatası');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 10000); // 10s update
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="text-blue-500"
      >
        <RefreshCw size={48} />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Premium Gradient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 backdrop-blur-md sticky top-0 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
            <span className="font-bold tracking-tighter">Terminal</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-xl font-black italic tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            INSTITUTIONAL PORTFOLIO
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Secure Access</span>
          </div>
          <button 
            onClick={fetchPortfolio}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1400px] mx-auto p-8 space-y-12">
        {/* Top Summary Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-2 p-8 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={120} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-4 block">Total Portfolio Net Worth</span>
            <div className="flex items-baseline gap-4">
              <h2 className="text-6xl font-black tracking-tighter">
                {formatUsd(data?.total_usd || 0)}
              </h2>
              <div className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                <TrendingUp size={14} />
                <span>+4.2%</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20"
          >
            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-4 block">Active Exchanges</span>
            <div className="space-y-4">
              {Object.entries(data?.exchange_status || {}).map(([name, status]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="font-bold opacity-80">{name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 border border-white/10 opacity-60 uppercase">{status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Assets & Allocation */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-6">
            <h3 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
              <Wallet className="text-blue-500" /> HOLDINGS
            </h3>
            <div className="rounded-3xl border border-white/5 bg-white/[0.01] overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-40">Asset</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-40">Exchange</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Price</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Quantity</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Value USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {data?.assets.map((asset, idx) => (
                      <motion.tr 
                        key={asset.asset}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs">
                              {asset.asset[0]}
                            </span>
                            <div>
                              <div className="font-black text-lg">{asset.asset}</div>
                              <div className="text-[10px] font-mono opacity-30 mt-0.5">{(asset.allocation).toFixed(1)}% Weight</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-bold px-2 py-1 rounded-md bg-white/5 border border-white/10 opacity-60">
                            {asset.exchange}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-mono font-bold text-white/50 group-hover:text-white transition-colors">
                          {formatUsd(asset.price)}
                        </td>
                        <td className="px-6 py-5 text-right font-mono font-bold">
                          {formatNumber(asset.qty)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="font-black text-white">{formatUsd(asset.usd_value)}</div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
              <PieIcon className="text-purple-500" /> ALLOCATION
            </h3>
            <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] space-y-6">
              {data?.assets.slice(0, 5).map(asset => (
                <div key={asset.asset} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="opacity-60">{asset.asset}</span>
                    <span>{asset.allocation.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${asset.allocation}%` }}
                      className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-white/5">
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">
                  Advanced Analytics <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer-simple relative z-10 px-8 py-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
        <div>© 2026 FluxTrade Intelligence Gate</div>
        <div>Security Protocol: AES-256-V2</div>
      </footer>
    </div>
  );
}
