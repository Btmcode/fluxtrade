"""
FluxTrade — Canlı Piyasa İstihbarat Terminali
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Binance WebSocket aggTrade stream'ine asyncio ile bağlanarak
birden fazla sembolün anlık alım/satım baskısını ve CVD'sini
canlı olarak izler.

Kullanım:
    python main.py

Mimari:
    ┌──────────────────────────────────────────────────┐
    │  Binance WebSocket (Combined Stream)             │
    │  wss://stream.binance.com:9443/stream?streams=   │
    │    btcusdt@aggTrade / ethusdt@aggTrade / ...      │
    └───────────────────┬──────────────────────────────┘
                        │ JSON mesajları
                        ▼
    ┌──────────────────────────────────────────────────┐
    │  WebSocket Listener (asyncio coroutine)          │
    │  • JSON ayrıştırma                               │
    │  • AggTrade modeline dönüştürme                  │
    │  • SymbolPressure güncelleme                     │
    └───────────────────┬──────────────────────────────┘
                        │ her saniye
                        ▼
    ┌──────────────────────────────────────────────────┐
    │  Rich Live Display                               │
    │  • Baskı çubukları + CVD + Sinyal tablosu        │
    └──────────────────────────────────────────────────┘
"""

import asyncio
import json
import signal
import sys
from typing import Dict

try:
    import websockets
    from websockets.exceptions import ConnectionClosed
except ImportError:
    print("❌  'websockets' kütüphanesi bulunamadı.")
    print("    Kurulum:  pip install websockets")
    sys.exit(1)

try:
    from rich.live import Live
    from rich.console import Console
    from rich.table import Table
    from rich.text import Text
    from rich.panel import Panel
    from rich.columns import Columns
except ImportError:
    print("❌  'rich' kütüphanesi bulunamadı.")
    print("    Kurulum:  pip install rich")
    sys.exit(1)

import config
from models import AggTrade, SymbolPressure
from display import (
    build_dashboard,
    build_header,
    build_footer_stats,
    console,
)


# ──────────────────────────────────────────────────────────
# Global Durum
# ──────────────────────────────────────────────────────────
pressures: Dict[str, SymbolPressure] = {}
_shutdown_event = asyncio.Event()


def _init_pressures() -> None:
    """Her sembol için boş bir SymbolPressure nesnesi oluştur."""
    for sym in config.SYMBOLS:
        key = sym.upper()
        pressures[key] = SymbolPressure(symbol=key)


# ──────────────────────────────────────────────────────────
# WebSocket Bağlantısı
# ──────────────────────────────────────────────────────────
def _build_stream_url() -> str:
    """
    Binance combined stream URL'si oluştur.
    Örnek: wss://stream.binance.com:9443/stream?streams=btcusdt@aggTrade/ethusdt@aggTrade
    """
    streams = "/".join(
        f"{sym}@{ch}" for sym in config.SYMBOLS for ch in config.CHANNELS
    )
    return f"{config.BINANCE_WS_COMBINED}{streams}"


async def _listen_trades() -> None:
    """
    Binance combined stream'e bağlan ve gelen mesajları işle.
    Bağlantı koparsa otomatik olarak yeniden bağlanır.
    """
    url = _build_stream_url()
    attempt = 0

    while not _shutdown_event.is_set() and attempt < config.MAX_RECONNECT_ATTEMPTS:
        try:
            console.print(
                f"\n[bright_cyan]📡 Bağlanılıyor:[/] {url[:80]}...", highlight=False
            )

            async with websockets.connect(
                url,
                ping_interval=config.PING_INTERVAL,
                ping_timeout=config.PING_TIMEOUT,
                close_timeout=5,
            ) as ws:
                attempt = 0  # Başarılı bağlantı → sayacı sıfırla
                console.print("[bright_green]✅ WebSocket bağlantısı kuruldu![/]\n")

                async for raw_msg in ws:
                    if _shutdown_event.is_set():
                        break

                    try:
                        msg = json.loads(raw_msg)
                        # Combined stream formatı: {"stream": "...", "data": {...}}
                        data = msg.get("data", msg)
                        
                        # aggTrade mesajı mı?
                        if data.get("e") == "aggTrade":
                            trade = AggTrade.from_ws_message(data)
                            sym_key = trade.symbol
                            if sym_key in pressures:
                                pressures[sym_key].record(trade)
                    except (json.JSONDecodeError, KeyError, ValueError) as e:
                        # Bozuk mesajları sessizce atla
                        pass

        except ConnectionClosed as e:
            attempt += 1
            console.print(
                f"[yellow]⚠️  Bağlantı kapandı (code={e.code}). "
                f"Yeniden bağlanılıyor... ({attempt}/{config.MAX_RECONNECT_ATTEMPTS})[/]"
            )
            await asyncio.sleep(config.RECONNECT_DELAY_SECONDS)

        except (OSError, Exception) as e:
            attempt += 1
            console.print(
                f"[red]❌ Bağlantı hatası: {type(e).__name__}: {e}[/]\n"
                f"[yellow]   Yeniden deneniyor... ({attempt}/{config.MAX_RECONNECT_ATTEMPTS})[/]"
            )
            await asyncio.sleep(config.RECONNECT_DELAY_SECONDS)

    if attempt >= config.MAX_RECONNECT_ATTEMPTS:
        console.print("[bold red]💥 Maksimum yeniden bağlanma denemesi aşıldı. Çıkılıyor.[/]")


# ──────────────────────────────────────────────────────────
# Canlı Dashboard Güncelleme
# ──────────────────────────────────────────────────────────
async def _update_display(live: Live) -> None:
    """Dashboard'u belirli aralıklarla güncelle."""
    while not _shutdown_event.is_set():
        try:
            from rich.console import Group
            dashboard = build_dashboard(pressures)
            footer = build_footer_stats(pressures)
            
            live.update(Group(dashboard, footer))
        except Exception:
            pass
        
        await asyncio.sleep(config.DISPLAY_REFRESH_INTERVAL)


# ──────────────────────────────────────────────────────────
# Ana Giriş Noktası
# ──────────────────────────────────────────────────────────
async def main() -> None:
    """FluxTrade ana event loop."""
    _init_pressures()

    # Başlık göster
    header = build_header()
    console.print(header)
    console.print(
        "[dim]İzlenen semboller:[/] "
        + " ".join(f"[bold bright_white]{s.upper()}[/]" for s in config.SYMBOLS)
    )
    console.print(
        f"[dim]CVD penceresi: {config.CVD_WINDOW_SECONDS}s | "
        f"Baskı penceresi: {config.PRESSURE_WINDOW_SECONDS}s | "
        f"Güncelleme: {config.DISPLAY_REFRESH_INTERVAL}s[/]\n"
    )

    with Live(
        build_dashboard(pressures),
        console=console,
        refresh_per_second=2,
        transient=False,
    ) as live:
        # WebSocket dinleyici ve ekran güncelleyiciyi paralel çalıştır
        listener_task = asyncio.create_task(_listen_trades())
        display_task = asyncio.create_task(_update_display(live))

        try:
            await asyncio.gather(listener_task, display_task)
        except asyncio.CancelledError:
            pass


def _handle_shutdown(sig, frame):
    """Ctrl+C sinyalini yakala ve temiz kapatma başlat."""
    console.print("\n[bright_yellow]🛑 Kapatılıyor...[/]")
    _shutdown_event.set()


if __name__ == "__main__":
    # Ctrl+C handler
    signal.signal(signal.SIGINT, _handle_shutdown)

    console.print(
        Panel(
            "[bold bright_cyan]F L U X T R A D E[/]\n"
            "[dim]Canlı Piyasa İstihbarat Terminali v0.1[/]",
            border_style="bright_blue",
            padding=(1, 4),
        )
    )

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[bright_yellow]👋 FluxTrade kapatıldı.[/]")
    except Exception as e:
        console.print(f"\n[bold red]💥 Kritik hata: {e}[/]")
        sys.exit(1)
