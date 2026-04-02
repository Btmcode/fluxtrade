/**
 * FluxTrade — AI Oracle (Heuristics Engine)
 * Analyzes raw market data and synthesizes natural language AI reports.
 */

export function generateOracleAnalysis(symbol, snap) {
  if (!snap) return { score: 50, text: 'Heterojen piyasa. Geçerli sinyal yok.', bias: 'nötr' };

  let score = 50; // Base score (0-100, 0 = Max Short, 100 = Max Long)
  let thoughts = [];
  let bias = 'nötr';

  const { obi, windowCvd, buyRatio } = snap;
  
  // OBI Logic
  if (obi > 0.65) {
    score += 15;
    thoughts.push(`Emir defterindeki alım duvarları ciddi seviyede (OBI %${(obi*100).toFixed(0)}). Emir tahtası kalınlaşıyor.`);
  } else if (obi < 0.35) {
    score -= 15;
    thoughts.push(`Emir defterindeki alım tarafında zayıflık var (OBI %${(obi*100).toFixed(0)}), pazar satıcılara teslim olabilir.`);
  }

  // --- SENIOR PATTERN: Stealth Accumulation (Divergence) ---
  if (obi > 0.60 && windowCvd < -200000) {
    score += 10;
    thoughts.push(`⚠️ Pozitif Uyumsuzluk Saptandı: Fiyat baskılanırken emir defteri alıcılarla doluyor. 'Stealth Accumulation' (Gizli Birikim) emaresi.`);
  }

  // --- SENIOR PATTERN: Trend Exhaustion ---
  if (buyRatio > 0.85 && windowCvd < 100000) {
    score -= 10;
    thoughts.push(`🔍 Trend Yorulması: Alım hızı çok yüksek ancak net para girişi (CVD) bu hızı desteklemiyor. Sahte breakout (fake-out) riski yüksek.`);
  }

  // CVD Logic (Upgraded)
  if (windowCvd > 500000) { 
    score += 20;
    thoughts.push(`🚀 Kurumsal Alım Kanıtı: Son 60s'de +$${(windowCvd/1000).toFixed(0)}K net akış. Balinalar agresif şekilde kademeleri süpürüyor.`);
  } else if (windowCvd < -500000) {
    score -= 20;
    thoughts.push(`📉 Likidite Boşalması: -$${Math.abs(windowCvd/1000).toFixed(0)}K net çıkış. Büyük oyuncular kar realizasyonu veya panik satışı yapıyor.`);
  }

  // Buy Ratio (Velocity) Logic
  if (buyRatio > 0.70) {
    score += 15;
    thoughts.push(`⚡ Momentum Artışı: Alım hızı %${(buyRatio*100).toFixed(0)} seviyesinde. Kısa vadeli alıcılar piyasayı FOMO'ya sürüklüyor.`);
  } else if (buyRatio < 0.30) {
    score -= 15;
    thoughts.push(`🩸 Satış Baskısı: Satıcılar kontrolü tamamen ele aldı (Satış oranı %${(100 - buyRatio*100).toFixed(0)}).`);
  }

  // Cap Score
  if (score > 98) score = 98;
  if (score < 2) score = 2;

  // Bias conclusion
  if (score >= 70) bias = 'long';
  else if (score <= 30) bias = 'short';
  else bias = 'nötr';

  // Construct Final Narrative
  let narrative = '';
  const prefix = `🛡️ Oracle: `;
  
  if (thoughts.length === 0) {
    narrative = `${prefix} Makro bazda dengeli konsolidasyon.`;
  } else {
    narrative = `${prefix} ${thoughts[0]}`; // Keep it concise for UI
  }

  return {
    score,
    text: narrative,
    bias
  };
}

/**
 * Generates a high-level cross-market narrative.
 */
export function generateMarketNarrative(snapshots) {
  if (!snapshots || Object.keys(snapshots).length === 0) return "Global piyasa verileri senkronize ediliyor...";

  const snaps = Object.values(snapshots);
  const avgBuyRatio = snaps.reduce((acc, s) => acc + s.buyRatio, 0) / snaps.length;
  const totalCvd = snaps.reduce((acc, s) => acc + s.windowCvd, 0);
  
  const btcSnap = snapshots["BTCUSDT"];
  const alts = Object.entries(snapshots).filter(([s]) => s !== "BTCUSDT").map(([_, v]) => v);
  const altAvgBuyRatio = alts.reduce((acc, s) => acc + s.buyRatio, 0) / alts.length;

  // Narrative Heuristics
  if (btcSnap && btcSnap.buyRatio > 0.6 && altAvgBuyRatio < 0.45) {
    return "MARKET STORY: Bitcoin leading the charge, institutions focusing on the major. Altcoins lagging - rotation expected.";
  }
  
  if (totalCvd > 1000000) {
    return "MARKET STORY: Aggressive global accumulation detected. Whales are sweeping liquidity across all monitored exchanges.";
  }

  if (totalCvd < -1000000) {
    return "MARKET STORY: Significant capital flight. Large players are offloading spot positions globally. Risk-off environment.";
  }

  if (avgBuyRatio > 0.55) {
    return "MARKET STORY: Bullish momentum building. Traders are aggressively hitting the ask side. High velocity across BTC and major ALTs.";
  }

  if (avgBuyRatio < 0.45) {
    return "MARKET STORY: Bearish distribution phase. Sellers are dominating the order flow. Caution advised on spot entries.";
  }

  return "MARKET STORY: Sideways consolidation. Liquidity is balanced as the market awaits the next institutional move.";
}
