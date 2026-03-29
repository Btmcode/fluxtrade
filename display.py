"""
FluxTrade - Konsol Arayüzü
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Rich kütüphanesi ile canlı güncellenen premium konsol dashboard.
"""

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.layout import Layout
from rich.text import Text
from rich.live import Live
from rich import box

from models import SymbolPressure
import config


console = Console()


def _format_usd(value: float) -> str:
    """USD miktarını okunabilir formata çevir."""
    if abs(value) >= 1_000_000:
        return f"${value / 1_000_000:>8.2f}M"
    elif abs(value) >= 1_000:
        return f"${value / 1_000:>8.2f}K"
    else:
        return f"${value:>8.2f}"


def _pressure_bar(ratio: float, width: int = 20) -> Text:
    """Alım/satım baskısını görsel çubuk olarak render et."""
    filled = int(ratio * width)
    empty = width - filled
    
    bar = Text()
    
    # Renk belirleme
    if ratio >= 0.6:
        fill_color = "bright_green"
    elif ratio >= 0.5:
        fill_color = "green"
    elif ratio >= 0.4:
        fill_color = "yellow"
    else:
        fill_color = "bright_red"
    
    bar.append("█" * filled, style=fill_color)
    bar.append("░" * empty, style="dim")
    bar.append(f" {ratio * 100:5.1f}%", style="bold")
    
    return bar


def build_dashboard(pressures: dict[str, SymbolPressure]) -> Table:
    """Tüm semboller için canlı dashboard tablosu oluştur."""
    
    table = Table(
        title="⚡ FLUXTRADE — Canlı Piyasa Baskısı",
        box=box.DOUBLE_EDGE,
        border_style="bright_cyan",
        title_style="bold bright_white on dark_blue",
        header_style="bold bright_yellow",
        padding=(0, 1),
        expand=True,
    )

    table.add_column("Sembol", style="bold bright_white", width=12, justify="center")
    table.add_column("Fiyat", style="bright_white", width=14, justify="right")
    table.add_column(f"Alım ({config.PRESSURE_WINDOW_SECONDS}s)", style="green", width=14, justify="right")
    table.add_column(f"Satım ({config.PRESSURE_WINDOW_SECONDS}s)", style="red", width=14, justify="right")
    table.add_column("Baskı", width=30, justify="left")
    table.add_column(f"CVD ({config.CVD_WINDOW_SECONDS}s)", width=14, justify="right")
    table.add_column("Sinyal", style="bold", width=16, justify="center")
    table.add_column("İşlem #", style="dim", width=10, justify="right")

    for symbol in config.SYMBOLS:
        sym_upper = symbol.upper()
        p = pressures.get(sym_upper)
        
        if p is None or p.total_trade_count == 0:
            table.add_row(
                sym_upper, "—", "—", "—", Text("Bağlanıyor...", style="dim italic"),
                "—", "—", "0"
            )
            continue
        
        # Fiyat
        price_str = f"${p.last_price:,.2f}" if p.last_price >= 1 else f"${p.last_price:.6f}"
        
        # Penceredeki hacimler
        buy_vol = _format_usd(p.window_buy_volume)
        sell_vol = _format_usd(p.window_sell_volume)
        
        # Baskı çubuğu
        bar = _pressure_bar(p.buy_ratio)
        
        # CVD
        cvd = p.window_cvd
        if cvd >= 0:
            cvd_str = Text(f"+{_format_usd(cvd)}", style="bright_green")
        else:
            cvd_str = Text(f"-{_format_usd(abs(cvd))}", style="bright_red")
        
        # Sinyal
        signal = p.pressure_label
        
        table.add_row(
            sym_upper,
            price_str,
            buy_vol,
            sell_vol,
            bar,
            cvd_str,
            signal,
            str(p.total_trade_count),
        )

    return table


def build_header() -> Panel:
    """Üst bilgi paneli."""
    header_text = Text()
    header_text.append("╔══════════════════════════════════════════════════════╗\n", style="bright_cyan")
    header_text.append("║  ", style="bright_cyan")
    header_text.append("F L U X T R A D E", style="bold bright_white")
    header_text.append("  —  ", style="dim")
    header_text.append("Canlı Piyasa İstihbarat Terminali", style="bright_yellow")
    header_text.append("  ║\n", style="bright_cyan")
    header_text.append("╚══════════════════════════════════════════════════════╝", style="bright_cyan")
    
    return Panel(
        header_text,
        border_style="bright_blue",
        padding=(0, 2),
    )


def build_footer_stats(pressures: dict[str, SymbolPressure]) -> Panel:
    """Alt istatistik paneli."""
    total_trades = sum(p.total_trade_count for p in pressures.values())
    total_buy = sum(p.total_buy_volume for p in pressures.values())
    total_sell = sum(p.total_sell_volume for p in pressures.values())
    net_flow = total_buy - total_sell
    
    stats = Text()
    stats.append("📊 Toplam İşlem: ", style="dim")
    stats.append(f"{total_trades:,}", style="bold bright_white")
    stats.append("  │  ", style="dim")
    stats.append("💰 Net Akış: ", style="dim")
    
    if net_flow >= 0:
        stats.append(f"+{_format_usd(net_flow)}", style="bold bright_green")
    else:
        stats.append(f"-{_format_usd(abs(net_flow))}", style="bold bright_red")
    
    stats.append("  │  ", style="dim")
    stats.append("📡 Kaynak: Binance aggTrade", style="dim italic")
    stats.append("  │  ", style="dim")
    stats.append("Çıkmak için Ctrl+C", style="dim italic")

    return Panel(stats, border_style="dim blue", padding=(0, 1))
