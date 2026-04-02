import os
import asyncio
import time
from typing import Dict, List, Optional
import aiohttp
from dataclasses import dataclass

@dataclass
class AssetBalance:
    asset: str
    free: float
    locked: float
    usd_value: float = 0.0
    exchange: str = "Total"

class PortfolioManager:
    """
    Manages multi-exchange portfolio balances and real-time valuation.
    Integrates with Aggregator for live pricing.
    """
    def __init__(self, aggregator=None):
        self.aggregator = aggregator
        self.balances: Dict[str, AssetBalance] = {}
        self.is_demo_mode = True # Default to demo mode for high-end presentation
        
        # Institutional Placeholder Portfolio
        self.mock_holdings = {
            "BTC": {"qty": 45.5, "exchange": "Binance Institutional"},
            "ETH": {"qty": 850.2, "exchange": "Bybit Enterprise"},
            "SOL": {"qty": 12500.0, "exchange": "OKX Prime"},
            "USDT": {"qty": 1250000.0, "exchange": "Binance Institutional"},
            "AVAX": {"qty": 5400.0, "exchange": "Bybit Enterprise"}
        }

    async def get_consolidated_balances(self) -> Dict:
        """
        Fetches and Calculates real-time portfolio worth.
        """
        # In a real scenario, we would trigger exchange API calls here
        # For the High-Intelligence Terminal Demo, we use the Mock Holdings
        
        results = []
        total_usd = 0.0
        
        for asset, data in self.mock_holdings.items():
            qty = data["qty"]
            price = 1.0
            
            # Get real-time price from aggregator if available
            if self.aggregator:
                symbol = f"{asset}USDT"
                if asset != "USDT":
                    stats = self.aggregator.get_symbol_stats(symbol)
                    if stats:
                        price = stats.last_price
                    else:
                        # Fallback prices if aggregator hasn't seen the symbol yet
                        fallbacks = {"BTC": 68500, "ETH": 3450, "SOL": 145, "AVAX": 38}
                        price = fallbacks.get(asset, 1.0)
            
            usd_val = qty * price
            total_usd += usd_val
            
            results.append({
                "asset": asset,
                "qty": qty,
                "usd_value": usd_val,
                "price": price,
                "exchange": data["exchange"],
                "allocation": 0.0 # Will calculate below
            })
            
        # Sort by value and calculate allocation
        results.sort(key=lambda x: x["usd_value"], reverse=True)
        for item in results:
            item["allocation"] = (item["usd_value"] / total_usd) * 100 if total_usd > 0 else 0
            
        return {
            "total_usd": total_usd,
            "assets": results,
            "timestamp": time.time(),
            "demo_mode": self.is_demo_mode,
            "exchange_status": {
                "Binance": "Protected",
                "Bybit": "Protected",
                "OKX": "Protected"
            }
        }

# Global Instance
port_manager = None

def get_portfolio_manager(aggregator=None):
    global port_manager
    if port_manager is None:
        port_manager = PortfolioManager(aggregator)
    return port_manager
