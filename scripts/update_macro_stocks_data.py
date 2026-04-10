#!/usr/bin/env python3
"""Update macro/stocks snapshot files for dashboard (30m cadence)."""

from __future__ import annotations

import csv
import json
import pathlib
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
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
    "vix": "^VIX",
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
    "repo": "RPTTLD",      # Billions USD
}


def read_json(path: pathlib.Path, default: dict) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def fetch_json(url: str, timeout: int = 20) -> Optional[dict]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"warn: fetch_json failed: {url} ({e})")
        return None


def fetch_yahoo_quotes(symbols: List[str]) -> Tuple[Dict[str, dict], bool]:
    joined = urllib.parse.quote(",".join(symbols), safe=",")
    url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={joined}"
    data = fetch_json(url)
    if not data:
        return {}, False
    results = data.get("quoteResponse", {}).get("result", [])
    return ({item.get("symbol"): item for item in results if item.get("symbol")}, True)


def to_num(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def fetch_fred_latest(series_id: str) -> Tuple[Optional[float], Optional[float], bool]:
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=20) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"warn: fetch_fred failed: {series_id} ({e})")
        return None, None, False

    rows: List[float] = []
    reader = csv.DictReader(text.splitlines())
    for row in reader:
        raw = (row.get(series_id) or row.get("VALUE") or "").strip()
        if not raw or raw == ".":
            continue
        try:
            rows.append(float(raw))
        except ValueError:
            continue

    if not rows:
        return None, None, False

    latest = rows[-1]
    prev = rows[-2] if len(rows) >= 2 else rows[-1]
    return latest, latest - prev, True


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


def fmt_3(value: Optional[float]) -> str:
    if value is None:
        return "—"
    return f"{value:.3f}"


def get_quote_fields(quotes: Dict[str, dict], symbol: str) -> Tuple[Optional[float], Optional[float]]:
    q = quotes.get(symbol, {})
    return to_num(q.get("regularMarketPrice")), to_num(q.get("regularMarketChangePercent"))


def read_prev_metric(prev_macro: dict, *path: str) -> Tuple[Optional[float], float, str, str, Optional[str]]:
    cur: Any = prev_macro
    for p in path:
        cur = cur.get(p, {}) if isinstance(cur, dict) else {}
    if not isinstance(cur, dict):
        return None, 0.0, "—", "missing", None
    val = to_num(cur.get("value"))
    delta = to_num(cur.get("delta"))
    display = cur.get("display")
    source = cur.get("source") if isinstance(cur.get("source"), str) else "unknown"
    source_as_of = cur.get("source_as_of") if isinstance(cur.get("source_as_of"), str) else None
    return val, pct_or_zero(delta), display if isinstance(display, str) else "—", source, source_as_of


def pick_value(
    live_val: Optional[float],
    live_delta: Optional[float],
    prev: Tuple[Optional[float], float, str, str, Optional[str]],
    display_fn,
    *,
    now_as_of: str,
    metric_key: str,
    carry_issues: List[str],
) -> Dict[str, Any]:
    if live_val is None:
        carry_issues.append(metric_key)
        return {
            "value": prev[0],
            "delta": prev[1],
            "display": prev[2],
            "source": "carry",
            "source_as_of": prev[4],
        }
    return {
        "value": live_val,
        "delta": pct_or_zero(live_delta),
        "display": display_fn(live_val),
        "source": "live",
        "source_as_of": now_as_of,
    }


def main() -> int:
    prev_macro = read_json(OUT_MACRO, {})
    prev_stocks = read_json(OUT_STOCKS, {"rows": []})

    symbols = sorted(set(YAHOO_SYMBOLS.values()) | {t for _, _, t in WATCHLIST})
    quotes, quotes_ok = fetch_yahoo_quotes(symbols)

    usdkrw_data = fetch_json("https://open.er-api.com/v6/latest/USD")
    usdkrw_live = to_num((usdkrw_data or {}).get("rates", {}).get("KRW"))

    fred_map: Dict[str, Tuple[Optional[float], Optional[float], bool]] = {
        key: fetch_fred_latest(series_id) for key, series_id in FRED_SERIES.items()
    }

    fetched_any = quotes_ok or usdkrw_live is not None or any(x[2] for x in fred_map.values())
    as_of = datetime.now(KST).strftime("%Y-%m-%d %H:%M KST") if fetched_any else prev_macro.get("as_of", datetime.now(KST).strftime("%Y-%m-%d %H:%M KST"))

    carry_issues: List[str] = []
    prev_us10y = read_prev_metric(prev_macro, "rates", "us10y")
    prev_us2y = read_prev_metric(prev_macro, "rates", "us2y")
    prev_sofr = read_prev_metric(prev_macro, "rates", "sofr")
    prev_iorb = read_prev_metric(prev_macro, "rates", "iorb")

    def fred_pick(key: str, prev: Tuple[Optional[float], float, str, str, Optional[str]], fn, metric_key: str):
        val, delta, ok = fred_map[key]
        if not ok or val is None:
            carry_issues.append(metric_key)
            return {
                "value": prev[0],
                "delta": prev[1],
                "display": prev[2],
                "source": "carry",
                "source_as_of": prev[4],
            }
        return {
            "value": val,
            "delta": pct_or_zero(delta),
            "display": fn(val),
            "source": "live",
            "source_as_of": as_of,
        }

    us10y = fred_pick("us10y", prev_us10y, fmt_2, "rates.us10y")
    us2y = fred_pick("us2y", prev_us2y, fmt_2, "rates.us2y")
    sofr = fred_pick("sofr", prev_sofr, fmt_2, "rates.sofr")
    iorb = fred_pick("iorb", prev_iorb, fmt_2, "rates.iorb")

    prev_dxy = read_prev_metric(prev_macro, "fx", "dxy")
    dxy_price, dxy_delta_live = get_quote_fields(quotes, YAHOO_SYMBOLS["dxy"])
    dxy = pick_value(dxy_price, dxy_delta_live, prev_dxy, fmt_2, now_as_of=as_of, metric_key="fx.dxy", carry_issues=carry_issues)

    prev_usdkrw = read_prev_metric(prev_macro, "fx", "usdkrw")
    usdkrw = pick_value(usdkrw_live, 0.0, prev_usdkrw, fmt_int, now_as_of=as_of, metric_key="fx.usdkrw", carry_issues=carry_issues)

    def y_pick(key: str, prev_path: Tuple[str, str], disp, metric_key: str):
        prev = read_prev_metric(prev_macro, *prev_path)
        p, d = get_quote_fields(quotes, YAHOO_SYMBOLS[key])
        return pick_value(p, d, prev, disp, now_as_of=as_of, metric_key=metric_key, carry_issues=carry_issues)

    nasdaq = y_pick("nasdaq", ("indices", "nasdaq"), fmt_int, "indices.nasdaq")
    dow = y_pick("dow", ("indices", "dow"), fmt_int, "indices.dow")
    sp500 = y_pick("sp500", ("indices", "sp500"), fmt_int, "indices.sp500")
    russell2000 = y_pick("russell2000", ("indices", "russell2000"), fmt_int, "indices.russell2000")
    vix = y_pick("vix", ("indices", "vix"), fmt_2, "indices.vix")
    kospi = y_pick("kospi", ("indices", "kospi"), fmt_int, "indices.kospi")
    kosdaq = y_pick("kosdaq", ("indices", "kosdaq"), fmt_int, "indices.kosdaq")

    gold = y_pick("gold", ("commodities", "gold"), lambda v: f"${fmt_int(v)}/oz", "commodities.gold")
    silver = y_pick("silver", ("commodities", "silver"), lambda v: f"${fmt_2(v)}/oz", "commodities.silver")
    wti = y_pick("wti", ("commodities", "wti"), lambda v: f"${fmt_2(v)}", "commodities.wti")
    copper = y_pick("copper", ("commodities", "copper"), lambda v: f"${fmt_2(v)}/lb", "commodities.copper")

    prev_tga = read_prev_metric(prev_macro, "liquidity", "tga")
    prev_rrp = read_prev_metric(prev_macro, "liquidity", "rrp")
    prev_repo = read_prev_metric(prev_macro, "liquidity", "repo")

    def liq_pick(key: str, prev: Tuple[Optional[float], float, str, str, Optional[str]], fn, metric_key: str):
        val, delta, ok = fred_map[key]
        if not ok or val is None:
            carry_issues.append(metric_key)
            return {
                "value": prev[0],
                "delta": prev[1],
                "display": prev[2],
                "source": "carry",
                "source_as_of": prev[4],
            }
        return {
            "value": val,
            "delta": pct_or_zero(delta),
            "display": fn(val),
            "source": "live",
            "source_as_of": as_of,
        }

    tga = liq_pick("tga", prev_tga, fmt_int, "liquidity.tga")
    rrp = liq_pick("rrp", prev_rrp, fmt_2, "liquidity.rrp")
    repo = liq_pick("repo", prev_repo, fmt_3, "liquidity.repo")

    critical_metrics = [
        metric for metric in carry_issues
        if metric in {
            "indices.vix",
            "fx.dxy",
            "commodities.gold",
            "commodities.silver",
            "commodities.wti",
            "commodities.copper",
        }
    ]

    macro = {
        "as_of": as_of,
        "rates": {
            "us10y": us10y,
            "us2y": us2y,
            "sofr": sofr,
            "iorb": iorb,
        },
        "fx": {
            "dxy": dxy,
            "usdkrw": usdkrw,
        },
        "indices": {
            "kospi": kospi,
            "kosdaq": kosdaq,
            "nasdaq": nasdaq,
            "dow": dow,
            "russell2000": russell2000,
            "sp500": sp500,
            "vix": vix,
        },
        "commodities": {
            "gold": gold,
            "silver": silver,
            "wti": wti,
            "copper": copper,
        },
        "liquidity": {
            "rrp": rrp,
            "tga": tga,
            "repo": repo,
            "qt_status": prev_macro.get("liquidity", {}).get("qt_status", "진행 중 (대차대조표 축소)"),
        },
        "_health": {
            "yahoo_quotes_ok": quotes_ok,
            "carried_metrics": sorted(set(carry_issues)),
            "critical_metrics": sorted(set(critical_metrics)),
            "issue_count": len(sorted(set(carry_issues))),
            "critical_issue_count": len(sorted(set(critical_metrics))),
        },
    }

    prev_stock_rows = {str(r.get("ticker", "")).upper(): r for r in prev_stocks.get("rows", []) if isinstance(r, dict)}
    stocks_rows = []
    for group, name, ticker in WATCHLIST:
        p_live, d_live = get_quote_fields(quotes, ticker)
        prev_row = prev_stock_rows.get(ticker, {})
        price = round(p_live, 2) if p_live is not None else prev_row.get("price")
        change = round(pct_or_zero(d_live), 2) if d_live is not None else pct_or_zero(to_num(prev_row.get("change")))
        stocks_rows.append({
            "group": group,
            "name": name,
            "ticker": ticker,
            "price": price,
            "change": change,
            "source": "live" if p_live is not None else "carry",
            "source_as_of": as_of if p_live is not None else None,
        })

    stocks_payload = {"as_of": as_of, "rows": stocks_rows}

    def metric_value(t: Dict[str, Any]) -> str:
        return t.get("display") if t.get("display") != "—" else "n/a"

    by_ticker = {r["ticker"]: r for r in stocks_rows}
    crypto_equities = [
        {"label": t, "value": "—" if by_ticker.get(t, {}).get("price") is None else f"{by_ticker[t]['price']:.2f}", "delta": by_ticker.get(t, {}).get("change", 0.0)}
        for t in ["COIN", "MSTR", "MARA", "RIOT", "HOOD"] if t in by_ticker
    ]

    snapshot_payload = {
        "asOf": as_of,
        "liquidity_checklist": [
            f"S&P500 {sp500['delta']:+.2f}% / NASDAQ {nasdaq['delta']:+.2f}%",
            f"US10Y {metric_value(us10y)} ({us10y['delta']:+,.2f}%) / US2Y {metric_value(us2y)} ({us2y['delta']:+,.2f}%)",
        ],
        "indices": [
            {"label": "S&P 500 🇺🇸", "value": sp500["display"], "delta": sp500["delta"]},
            {"label": "NASDAQ 🇺🇸", "value": nasdaq["display"], "delta": nasdaq["delta"]},
            {"label": "VIX 🇺🇸", "value": vix["display"], "delta": vix["delta"]},
            {"label": "KOSPI 🇰🇷", "value": kospi["display"], "delta": kospi["delta"]},
            {"label": "KOSDAQ 🇰🇷", "value": kosdaq["display"], "delta": kosdaq["delta"]},
        ],
        "crypto_equities": crypto_equities,
        "commodities": [
            {"label": "Gold 🥇", "value": gold["display"], "delta": gold["delta"]},
            {"label": "Silver 🥈", "value": silver["display"], "delta": silver["delta"]},
            {"label": "Copper 🟤", "value": copper["display"], "delta": copper["delta"]},
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


if __name__ == "__main__":
    raise SystemExit(main())
