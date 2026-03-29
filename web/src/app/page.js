'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
  loading: () => (
    <div className="app-wrapper">
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">FluxTrade yükleniyor...</div>
      </div>
    </div>
  ),
});

const WelcomeSplash = dynamic(() => import('@/components/WelcomeSplash'), {
  ssr: false,
});

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <WelcomeSplash onComplete={() => setShowSplash(false)} />}
      <Dashboard />
    </>
  );
}
