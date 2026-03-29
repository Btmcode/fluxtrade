"""
FluxTrade - Konfigürasyon Dosyası
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Binance WebSocket bağlantı parametreleri ve izleme ayarları.
"""

# ──────────────────────────────────────────────────────────
# Binance WebSocket Endpoints
# ──────────────────────────────────────────────────────────
BINANCE_WS_BASE = "wss://stream.binance.com:9443/ws"
BINANCE_WS_COMBINED = "wss://stream.binance.com:9443/stream?streams="

# ──────────────────────────────────────────────────────────
# İzlenecek Semboller (küçük harf, Binance formatı)
# ──────────────────────────────────────────────────────────
SYMBOLS = [
    "btcusdt",
    "ethusdt",
    "solusdt",
    "bnbusdt",
    "xrpusdt",
]

# ──────────────────────────────────────────────────────────
# Abone Olunacak Kanallar
# ──────────────────────────────────────────────────────────
# @aggTrade  → Anlık birleştirilmiş işlemler (taker buy/sell tespiti)
# @depth20   → Emir defteri anlık görüntüsü (top 20 seviye)
# @markPrice → Fonlama oranı ve gösterge fiyat
CHANNELS = ["aggTrade"]   # Başlangıç için sadece aggTrade

# ──────────────────────────────────────────────────────────
# CVD & Analiz Parametreleri
# ──────────────────────────────────────────────────────────
CVD_WINDOW_SECONDS = 60          # CVD hesaplama penceresi (saniye)
PRESSURE_WINDOW_SECONDS = 10     # Anlık baskı hesaplama penceresi
DISPLAY_REFRESH_INTERVAL = 1.0   # Konsol güncelleme aralığı (saniye)

# ──────────────────────────────────────────────────────────
# Bağlantı Dayanıklılığı
# ──────────────────────────────────────────────────────────
RECONNECT_DELAY_SECONDS = 3      # Bağlantı koptuğunda bekleme süresi
MAX_RECONNECT_ATTEMPTS = 10      # Maksimum yeniden bağlanma denemesi
PING_INTERVAL = 20               # WebSocket ping aralığı (saniye)
PING_TIMEOUT = 10                # Ping zaman aşımı (saniye)
