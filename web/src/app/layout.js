import './globals.css';

export const metadata = {
  title: 'FluxTrade — Canlı Piyasa İstihbarat Terminali',
  description: 'Binance WebSocket ile canlı alım/satım baskısı, CVD (Cumulative Volume Delta) ve yön sinyalleri izleyin. BTC, ETH, SOL, BNB, XRP anlık analiz.',
  keywords: 'crypto, trading, CVD, volume delta, Binance, WebSocket, market pressure, trading signals',
  openGraph: {
    title: 'FluxTrade — Canlı Piyasa İstihbarat Terminali',
    description: 'Canlı kripto piyasa baskısı ve CVD analizi',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0e17" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
