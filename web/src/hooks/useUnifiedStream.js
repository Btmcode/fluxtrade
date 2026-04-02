import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useUnifiedStream - Phase 18
 * Connects to the FluxTrade Python Aggregator (FastAPI)
 * Aggregates Binance, Bybit, and OKX data into a single stream.
 */
export function useUnifiedStream(url = process.env.NEXT_PUBLIC_AGGREGATOR_URL || 'ws://localhost:8000/ws') {
    const [marketData, setMarketData] = useState({});
    const [lastAlert, setLastAlert] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);

    const connect = useCallback(() => {
        if (ws.current) ws.current.close();

        const socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('🔗 Connected to FluxTrade Aggregator');
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'MARKET_UPDATE') {
                    setMarketData(message.data);
                } else if (message.type === 'SIGNAL_ALERT') {
                    setLastAlert(message.data);
                    // Clear alert after 5 seconds
                    setTimeout(() => setLastAlert(null), 5000);
                }
            } catch (err) {
                console.error('❌ Aggregator Stream Error:', err);
            }
        };

        socket.onclose = () => {
            setIsConnected(false);
            console.log('📡 Aggregator Disconnected. Retrying...');
            setTimeout(connect, 3000);
        };

        ws.current = socket;
    }, [url]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) ws.current.close();
        };
    }, [connect]);

    return { marketData, lastAlert, isConnected };
}
