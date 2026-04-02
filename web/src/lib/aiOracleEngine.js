/**
 * FluxTrade — AI Oracle (Heuristics Engine)
 * Analyzes raw market data and synthesizes natural language AI reports.
 */

export function generateOracleAnalysis(symbol, snap) {
  if (!snap) return { score: 50, text: 'Heterojen piyasa. Geçerli sinyal yok.', bias: 'nötr' };

  let score = 50; // Base score (0-100, 0 = Max Short, 100 = Max Long)
  let thoughts = [];
  let bias = 'nötr';

  const { obi, currentBuyVolume, currentSellVolume, windowCvd, buyRatio } = snap;
  
  // OBI Logic
  if (obi > 0.65) {
    score += 15;
    thoughts.push(`Emir defterindeki alım duvarları ciddi seviyede (OBI %${(obi*100).toFixed(0)}). Emir tahtası kalınlaşıyor.`);
  } else if (obi < 0.35) {
    score -= 15;
    thoughts.push(`Emir defterindeki alım tarafında zayıflık var (OBI %${(obi*100).toFixed(0)}), pazar satıcılara teslim olabilir.`);
  }

  // CVD Logic
  if (windowCvd > 500000) { // +$500K
    score += 20;
    thoughts.push(`Son 60 saniyede net akış parabolik şekilde arttı (+$${(windowCvd/1000).toFixed(0)}K CVD). Smart Money yönünü yukarı çevirdi.`);
  } else if (windowCvd < -500000) {
    score -= 20;
    thoughts.push(`Ağır market satışları tetiklendi. (Net Akış: -$${Math.abs(windowCvd/1000).toFixed(0)}K). Dağıtım (distribution) evresi olabilir.`);
  }

  // Buy Ratio (Velocity) Logic
  if (buyRatio > 0.70) {
    score += 15;
    thoughts.push(`Anlık alım hızı çok agresif (Alış dominansı %${(buyRatio*100).toFixed(0)}). Fiyatı süpürerek yükseltiyorlar.`);
  } else if (buyRatio < 0.30) {
    score -= 15;
    thoughts.push(`Yüksek satım hızı mevcut (Satış dominansı %${(100 - buyRatio*100).toFixed(0)}). Panik satışları emilemiyor.`);
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
  const prefix = `🤖 FluxAI Analizi (${symbol.replace('USDT','')}): `;
  
  if (thoughts.length === 0) {
    narrative = `${prefix} Makro bazda stabil konsolidasyon gözleniyor. Alıcı ve satıcı grupları dengede.`;
  } else {
    narrative = `${prefix} ${thoughts.join(' ')}`;
    if (bias === 'long') narrative += ` Sonuç: Önümüzdeki süreçte momentumun YUKARI (Long avantajı) olması kuvvetle muhtemel.`;
    if (bias === 'short') narrative += ` Sonuç: İvme zayıflıyor, önümüzdeki 15-45 dakika için yön AŞAĞI (Short avantajı) ağırlıklı.`;
  }

  return {
    score,
    text: narrative,
    bias
  };
}
