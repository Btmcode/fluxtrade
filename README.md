# ⚡ FluxTrade — Canlı Piyasa İstihbarat Terminali

Binance WebSocket aggTrade stream'ine asyncio ile bağlanarak birden fazla sembolün
anlık **alım/satım baskısını** ve **CVD (Cumulative Volume Delta)** metriğini
canlı olarak izleyen Python terminali.

## 🏗️ Mimari

```
Binance WebSocket (Combined Stream)
        │
        ▼
  WebSocket Listener (asyncio)
  • JSON ayrıştırma
  • AggTrade modeline dönüşüm
  • SymbolPressure güncelleme
        │
        ▼
  Rich Live Dashboard
  • Baskı çubukları + CVD + Sinyal
```

## 📦 Kurulum

```bash
pip install -r requirements.txt
```

## 🚀 Çalıştırma

```bash
python main.py
```

## 📊 Hesaplanan Metrikler

| Metrik | Açıklama |
|--------|----------|
| **CVD** | Σ(Hacim_Alım − Hacim_Satım) — kümülatif hacim deltası |
| **Baskı Oranı** | Penceredeki alım hacmi / toplam hacim |
| **Sinyal** | 🟢 GÜÇLÜ ALIŞ / 🟡 HAFİF ALIŞ / ⚪ NÖTR / 🟠 HAFİF SATIŞ / 🔴 GÜÇLÜ SATIŞ |

## ⚙️ Konfigürasyon

`config.py` dosyasından ayarlanabilir:

- **SYMBOLS** — İzlenecek semboller
- **CVD_WINDOW_SECONDS** — CVD hesaplama penceresi
- **PRESSURE_WINDOW_SECONDS** — Anlık baskı penceresi
- **DISPLAY_REFRESH_INTERVAL** — Dashboard güncelleme aralığı

## 📁 Dosya Yapısı

```
FluxTrade/
├── main.py            # Ana giriş noktası, asyncio event loop
├── config.py          # Tüm konfigürasyon parametreleri
├── models.py          # AggTrade + SymbolPressure veri sınıfları
├── display.py         # Rich dashboard render mantığı
├── requirements.txt   # Python bağımlılıkları
└── README.md
```
