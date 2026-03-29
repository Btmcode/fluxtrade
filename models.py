"""
FluxTrade - Veri Modelleri
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Canlı piyasa verileri için veri sınıfları.
"""

from dataclasses import dataclass, field
from collections import deque
from time import time
from typing import Deque, Tuple

import config


@dataclass
class AggTrade:
    """Binance aggTrade mesajından ayrıştırılan tek bir işlem."""
    symbol: str
    price: float
    quantity: float
    timestamp_ms: int
    is_buyer_maker: bool   # True → satıcı (taker sell), False → alıcı (taker buy)

    @property
    def side(self) -> str:
        return "SELL" if self.is_buyer_maker else "BUY"

    @property
    def volume_usd(self) -> float:
        return self.price * self.quantity

    @classmethod
    def from_ws_message(cls, data: dict) -> "AggTrade":
        """Binance WebSocket aggTrade JSON'ından AggTrade nesnesi oluşturur."""
        return cls(
            symbol=data["s"],
            price=float(data["p"]),
            quantity=float(data["q"]),
            timestamp_ms=data["T"],
            is_buyer_maker=data["m"],
        )


@dataclass
class SymbolPressure:
    """
    Bir sembol için anlık alım/satım baskısı ve CVD hesaplayıcısı.
    
    Sliding window yaklaşımı: Eski işlemler pencereden dışarı itilir,
    böylece bellek sabit kalır ve hesaplama O(1) amortize edilir.
    """
    symbol: str
    # (timestamp_secs, volume_usd, is_buy) kayıtları
    _trades: Deque[Tuple[float, float, bool]] = field(default_factory=deque)
    
    # Toplam istatistikler (program başlangıcından beri)
    total_buy_volume: float = 0.0
    total_sell_volume: float = 0.0
    total_trade_count: int = 0
    last_price: float = 0.0
    
    # CVD (tüm süre boyunca kümülatif)
    cvd: float = 0.0

    def record(self, trade: AggTrade) -> None:
        """Yeni bir işlemi kaydet ve metrikleri güncelle."""
        now = time()
        vol = trade.volume_usd
        is_buy = trade.side == "BUY"

        self._trades.append((now, vol, is_buy))
        self.last_price = trade.price
        self.total_trade_count += 1

        if is_buy:
            self.total_buy_volume += vol
            self.cvd += vol
        else:
            self.total_sell_volume += vol
            self.cvd -= vol

        # Pencere dışına çıkan eski verileri temizle
        self._prune(now)

    def _prune(self, now: float) -> None:
        """CVD penceresinden eski verileri temizle."""
        cutoff = now - config.CVD_WINDOW_SECONDS
        while self._trades and self._trades[0][0] < cutoff:
            self._trades.popleft()

    @property
    def window_buy_volume(self) -> float:
        """Mevcut penceredeki toplam alım hacmi (USD)."""
        now = time()
        cutoff = now - config.PRESSURE_WINDOW_SECONDS
        return sum(vol for ts, vol, is_buy in self._trades if is_buy and ts >= cutoff)

    @property
    def window_sell_volume(self) -> float:
        """Mevcut penceredeki toplam satım hacmi (USD)."""
        now = time()
        cutoff = now - config.PRESSURE_WINDOW_SECONDS
        return sum(vol for ts, vol, is_buy in self._trades if not is_buy and ts >= cutoff)

    @property
    def window_cvd(self) -> float:
        """Son CVD_WINDOW_SECONDS saniyelik penceredeki kümülatif hacim deltası."""
        return sum(
            vol if is_buy else -vol
            for _, vol, is_buy in self._trades
        )

    @property
    def buy_ratio(self) -> float:
        """Penceredeki alım oranı (0.0 – 1.0)."""
        buy = self.window_buy_volume
        sell = self.window_sell_volume
        total = buy + sell
        return buy / total if total > 0 else 0.5

    @property
    def pressure_label(self) -> str:
        """İnsan okunabilir baskı etiketi."""
        ratio = self.buy_ratio
        if ratio >= 0.65:
            return "🟢 GÜÇLÜ ALIŞ"
        elif ratio >= 0.55:
            return "🟡 HAFİF ALIŞ"
        elif ratio <= 0.35:
            return "🔴 GÜÇLÜ SATIŞ"
        elif ratio <= 0.45:
            return "🟠 HAFİF SATIŞ"
        else:
            return "⚪ NÖTR"
