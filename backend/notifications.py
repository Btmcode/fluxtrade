import asyncio
import json
import logging
import time
import requests
import os
from typing import Optional

logger = logging.getLogger("Notifications")

class NotificationManager:
    def __init__(self):
        self.whale_threshold = 100000.0  # $100k USD
        self.telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.last_alerts = {} # To prevent spam

    async def evaluate_trade(self, trade, broadcast_func):
        """
        Evaluates a single trade for whale activity.
        """
        usd_value = trade.price * trade.quantity
        
        if usd_value >= self.whale_threshold:
            alert = {
                "type": "WHALE_ALERT",
                "symbol": trade.symbol,
                "exchange": trade.exchange,
                "side": trade.side,
                "value": usd_value,
                "price": trade.price,
                "timestamp": trade.timestamp
            }
            await self.dispatch_alert(alert, broadcast_func)

    async def evaluate_momentum(self, symbol, current_score, broadcast_func):
        """
        Evaluates symbol momentum for potential breakouts.
        """
        # Throttling to once every 60 seconds per symbol
        now = time.time()
        if symbol in self.last_alerts and now - self.last_alerts[symbol] < 60:
            return

        if current_score > 250000: # High heat threshold
            alert = {
                "type": "MOMENTUM_PULSE",
                "symbol": symbol,
                "score": current_score,
                "label": "🔥 HYPER MOMENTUM",
                "timestamp": now
            }
            self.last_alerts[symbol] = now
            await self.dispatch_alert(alert, broadcast_func)

    async def dispatch_alert(self, alert, broadcast_func):
        """
        Sends alert to WebSocket and Telegram.
        """
        logger.info(f"Signal Detected: {alert['type']} on {alert.get('symbol')}")
        
        # 1. Local Broadcast (Dashboard)
        await broadcast_func(json.dumps({
            "type": "SIGNAL_ALERT",
            "data": alert
        }))

        # 2. Telegram (Optional)
        if self.telegram_token and self.telegram_chat_id:
            try:
                msg = self._format_telegram_msg(alert)
                # Run in background to not block
                asyncio.create_task(self._send_telegram(msg))
            except Exception as e:
                logger.error(f"Telegram Dispatch Error: {e}")

    def _format_telegram_msg(self, alert):
        if alert['type'] == "WHALE_ALERT":
            emoji = "🐋" if alert['side'] == "BUY" else "🚨"
            return f"{emoji} <b>WHALE {alert['side']} ALERT</b>\n\n" \
                   f"Symbol: #{alert['symbol']}\n" \
                   f"Value: ${alert['value']:,.0f}\n" \
                   f"Price: {alert['price']}\n" \
                   f"Exchange: {alert['exchange']}"
        else:
            return f"🔥 <b>MOMENTUM PULSE</b>\n\n" \
                   f"Symbol: #{alert['symbol']}\n" \
                   f"Heat Score: {alert['score']:,.0f}\n" \
                   f"Status: {alert['label']}"

    async def _send_telegram(self, message):
        url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
        data = {
            "chat_id": self.telegram_chat_id,
            "text": message,
            "parse_mode": "HTML"
        }
        requests.post(url, data=data, timeout=5)

notification_manager = NotificationManager()
