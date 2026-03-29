/**
 * FluxTrade — USD Formatter Utility
 */

export function formatUsd(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatPrice(price) {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
}

export function formatNumber(num) {
  return num.toLocaleString('en-US');
}

export function getSymbolMeta(symbol) {
  const map = {
    BTCUSDT: { name: 'Bitcoin', short: 'BTC', icon: 'btc', color: '#f7931a' },
    ETHUSDT: { name: 'Ethereum', short: 'ETH', icon: 'eth', color: '#627eea' },
    SOLUSDT: { name: 'Solana', short: 'SOL', icon: 'sol', color: '#9945ff' },
    BNBUSDT: { name: 'BNB', short: 'BNB', icon: 'bnb', color: '#f0b90b' },
    XRPUSDT: { name: 'XRP', short: 'XRP', icon: 'xrp', color: '#ffffff' },
  };
  return map[symbol] || { name: symbol, short: symbol.slice(0, 3), icon: 'btc', color: '#38bdf8' };
}
