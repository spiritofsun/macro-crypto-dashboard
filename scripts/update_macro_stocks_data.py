#!/usr/bin/env python3
"""Update macro/stocks snapshot files for dashboard (30m cadence)."""

from __future__ import annotations

import csv
import json
import pathlib
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dashboard" / "data"
API_DIR = ROOT / "dashboard" / "api" / "macro"

OUT_MACRO = DATA_DIR / "macro_snapshot.json"
OUT_MACRO_API = API_DIR / "snapshot.json"
OUT_STOCKS = DATA_DIR / "stocks_watchlist.json"
OUT_SNAPSHOT = DATA_DIR / "snapshot.json"

USER_AGENT = "project-mark-dashboard/1.0"
KST = ZoneInfo("Asia/Seoul")

YAHOO_SYMBOLS = {
    "nasdaq": "^IXIC",
    "dow": "^DJI",
    "sp500": "^GSPC",
    "russell2000": "^RUT",
    "kospi": "^KS11",
    "kosdaq": "^KQ11",
    "dxy": "DX-Y.NYB",
    "gold": "GC=F",
    "silver": "SI=F",
    "wti": "CL=F",
    "copper": "HG=F",
}

WATCHLIST = [
    ("Big Tech", "Apple", "AAPL"),
    ("Big Tech", "Microsoft", "MSFT"),
    ("Big Tech", "NVIDIA", "NVDA"),
    ("Big Tech", "Amazon", "AMZN"),
    ("Big Tech", "Alphabet", "GOOGL"),
    ("Big Tech", "Meta", "META"),
    ("Big Tech", "Tesla", "TSLA"),
    ("Crypto Related", "Robinhood", "HOOD"),
    ("Crypto Related", "Coinbase", "COIN"),
    ("Crypto Related", "MicroStrategy/Strategy", "MSTR"),
    ("Crypto Related", "Marathon Digital", "MARA"),
    ("Crypto Related", "Riot Platforms", "RIOT"),
    ("Crypto Related", "Block", "SQ"),
    ("Crypto Related", "PayPal", "PYPL"),
    ("Crypto Related", "CME Group", "CME"),
]

FRED_SERIES = {
    "us10y": "DGS10",
    "us2y": "DGS2",
    "sofr": "SOFR",
    "iorb": "IORB",
    "tga": "WTREGEN",      # Millions USD
    "rrp": "RRPONTSYD",    # Billions USD
    "repo": "RPTTLD",      # Billions USD (Temporary OMOs total)
}


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_yahoo_quotes(symbols: List[str]) -> Dict[str, dict]:
    joined = urllib.parse.quote(",".join(symbols), safe=",")
    url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={joined}"
    data = fetch_json(url)
    results = data.get("quoteResponse", {}).get("result", [])
    return {item.get("symbol"): item for item in results if item.get("symbol")}


def to_num(value) -> Optional[float]:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def fetch_fred_latest(series_id: str) -> Tuple[Optional[float], Optional[float]]:
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        text = resp.read().decode("utf-8", errors="ignore")

    rows: List[float] = []
    reader = csv.DictReader(text.splitlines())
    value_key = series_id
    for row in reader:
        raw = (row.get(value_key) or row.get("VALUE") or "").strip()
        if not raw or raw == ".":
            continue
        try:
            rows.append(float(raw))
        except ValueError:
            continue

    if not rows:
        return None, None
    latest = rows[-1]
    prev = rows[-2] if len(rows) >= 2 else rows[-1]
    return latest, latest - prev


def pct_or_zero(value: Optional[float]) -> float:
    return float(value) if isinstance(value, (int, float)) else 0.0


def fmt_int(value: Optional[float]) -> str:
    if value is None:
        return "—"
    return f"{int(round(value)):,}"


def fmt_2(value: Optional[float]) -> str:
    if value is None:
        return "—"
    return f"{value:.2f}"


def get_quote_fields(quotes: Dict[str, dict], symbol: str) -> Tuple[Optional[float], float]:
    q = quotes.get(symbol, {})
    price = to_num(q.get("regularMarketPrice"))
    change_pct = to_num(q.get("regularMarketChangePercent"))
    return price, pct_or_zero(change_pct)


def main() -> int:
    symbols = set(YAHOO_SYMBOLS.values())
    symbols.update(t for _, _, t in WATCHLIST)
    quotes = fetch_yahoo_quotes(sorted(symbols))

    usdkrw_data = fetch_json("https://open.er-api.com/v6/latest/USD")
    usdkrw = to_num((usdkrw_data.get("rates") or {}).get("KRW"))

    us10y, us10y_delta = fetch_fred_latest(FRED_SERIES["us10y"])
    us2y, us2y_delta = fetch_fred_latest(FRED_SERIES["us2y"])
    sofr, sofr_delta = fetch_fred_latest(FRED_SERIES["sofr"])
    iorb, iorb_delta = fetch_fred_latest(FRED_SERIES["iorb"])
    tga, tga_delta = fetch_fred_latest(FRED_SERIES["tga"])
    rrp, rrp_delta = fetch_fred_latest(FRED_SERIES["rrp"])
    repo, repo_delta = fetch_fred_latest(FRED_SERIES["repo"])

    if repo is None:
        repo = 0.0
        repo_delta = 0.0

    nasdaq, nasdaq_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["nasdaq"])
    dow, dow_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["dow"])
    sp500, sp500_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["sp500"])
    russell2000, russell2000_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["russell2000"])
    kospi, kospi_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["kospi"])
    kosdaq, kosdaq_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["kosdaq"])

    dxy, dxy_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["dxy"])
    gold, gold_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["gold"])
    silver, silver_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["silver"])
    wti, wti_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["wti"])
    copper, copper_delta = get_quote_fields(quotes, YAHOO_SYMBOLS["copper"])

    now_kst = datetime.now(KST)
    as_of = now_kst.strftime("%Y-%m-%d %H:%M KST")

    macro = {
        "as_of": as_of,
        "rates": {
            "us10y": {"value": us10y, "delta": pct_or_zero(us10y_delta), "display": fmt_2(us10y)},
            "us2y": {"value": us2y, "delta": pct_or_zero(us2y_delta), "display": fmt_2(us2y)},
            "sofr": {"value": sofr, "delta": pct_or_zero(sofr_delta), "display": fmt_2(sofr)},
            "iorb": {"value": iorb, "delta": pct_or_zero(iorb_delta), "display": fmt_2(iorb)},
        },
        "fx": {
            "dxy": {"value": dxy, "delta": dxy_delta, "display": fmt_2(dxy)},
            "usdkrw": {
                "value": usdkrw,
                "delta": 0.0,
                "display": fmt_int(usdkrw),
            },
        },
        "indices": {
            "kospi": {"value": kospi, "delta": kospi_delta, "display": fmt_int(kospi)},
            "kosdaq": {"value": kosdaq, "delta": kosdaq_delta, "display": fmt_int(kosdaq)},
            "nasdaq": {"value": nasdaq, "delta": nasdaq_delta, "display": fmt_int(nasdaq)},
            "dow": {"value": dow, "delta": dow_delta, "display": fmt_int(dow)},
            "russell2000": {"value": russell2000, "delta": russell2000_delta, "display": fmt_int(russell2000)},
            "sp500": {"value": sp500, "delta": sp500_delta, "display": fmt_int(sp500)},
        },
        "commodities": {
            "gold": {"value": gold, "delta": gold_delta, "display": f"${fmt_int(gold)}/oz" if gold is not None else "—"},
            "silver": {"value": silver, "delta": silver_delta, "display": f"${fmt_2(silver)}/oz" if silver is not None else "—"},
            "wti": {"value": wti, "delta": wti_delta, "display": f"${fmt_2(wti)}" if wti is not None else "—"},
            "copper": {"value": copper, "delta": copper_delta, "display": f"${fmt_2(copper)}/lb" if copper is not None else "—"},
        },
        "liquidity": {
            "rrp": {"value": rrp, "delta": pct_or_zero(rrp_delta), "display": fmt_2(rrp) if rrp is not None else "—"},
            "tga": {"value": tga, "delta": pct_or_zero(tga_delta), "display": fmt_int(tga)},
            "repo": {"value": repo, "delta": pct_or_zero(repo_delta), "display": fmt_3(repo) if repo is not None else "—"},
            "qt_status": "진행 중 (대차대조표 축소)",
        },
    }

    stocks_rows = []
    for group, name, ticker in WATCHLIST:
        price, change = get_quote_fields(quotes, ticker)
        stocks_rows.append({
            "group": group,
            "name": name,
            "ticker": ticker,
            "price": round(price, 2) if price is not None else None,
            "change": round(change, 2),
        })

    stocks_payload = {"as_of": as_of, "rows": stocks_rows}

    crypto_equities = []
    for ticker in ["COIN", "MSTR", "MARA", "RIOT", "HOOD"]:
        row = next((r for r in stocks_rows if r["ticker"] == ticker), None)
        if row:
            crypto_equities.append({
                "label": ticker,
                "value": "—" if row["price"] is None else f"{row['price']:.2f}",
                "delta": row["change"],
            })

    snapshot_payload = {
        "asOf": as_of,
        "liquidity_checklist": [
            f"S&P500 {sp500_delta:+.2f}% / NASDAQ {nasdaq_delta:+.2f}%",
            f"US10Y {fmt_2(us10y)} ({pct_or_zero(us10y_delta):+,.2f}%) / US2Y {fmt_2(us2y)} ({pct_or_zero(us2y_delta):+,.2f}%)",
        ],
        "indices": [
            {"label": "S&P 500 🇺🇸", "value": fmt_int(sp500), "delta": sp500_delta},
            {"label": "NASDAQ 🇺🇸", "value": fmt_int(nasdaq), "delta": nasdaq_delta},
            {"label": "KOSPI 🇰🇷", "value": fmt_int(kospi), "delta": kospi_delta},
            {"label": "KOSDAQ 🇰🇷", "value": fmt_int(kosdaq), "delta": kosdaq_delta},
        ],
        "crypto_equities": crypto_equities,
        "commodities": [
            {"label": "Gold 🥇", "value": f"${fmt_int(gold)}/oz" if gold is not None else "—", "delta": gold_delta},
            {"label": "Silver 🥈", "value": f"${fmt_2(silver)}/oz" if silver is not None else "—", "delta": silver_delta},
            {"label": "Copper 🟤", "value": f"${fmt_2(copper)}/lb" if copper is not None else "—", "delta": copper_delta},
        ],
    }

    OUT_MACRO.write_text(json.dumps(macro, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_MACRO_API.write_text(json.dumps(macro, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_STOCKS.write_text(json.dumps(stocks_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_SNAPSHOT.write_text(json.dumps(snapshot_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"updated {OUT_MACRO}")
    print(f"updated {OUT_STOCKS}")
    print(f"updated {OUT_SNAPSHOT}")
    return 0


def fmt_3(value: Optional[float]) -> str:
    if value is None:
        return "—"
    return f"{value:.3f}"


if __name__ == "__main__":
    raise SystemExit(main())
