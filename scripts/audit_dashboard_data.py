#!/usr/bin/env python3
"""Audit dashboard data freshness, compatibility, and live-source drift."""

from __future__ import annotations

import json
import pathlib
import sys
import urllib.request
from datetime import datetime, timezone
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dashboard" / "data"
USER_AGENT = "project-mark-dashboard-audit/1.0"


def load_json(path: pathlib.Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"_load_error": str(exc)}


def fetch_json(url: str, timeout: int = 20) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def to_num(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_dt(raw: Any) -> datetime | None:
    if not isinstance(raw, str) or not raw.strip():
        return None
    text = raw.strip()
    if text.endswith(" KST"):
        text = text.replace(" KST", ":00+09:00").replace(" ", "T")
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def age_hours(raw: Any) -> float | None:
    dt = parse_dt(raw)
    if dt is None:
        return None
    return round((datetime.now(timezone.utc) - dt).total_seconds() / 3600, 2)


def pct_diff(a: float | None, b: float | None) -> float | None:
    if a is None or b is None or b == 0:
        return None
    return abs(a - b) / abs(b) * 100


def add(rows: list[dict[str, str]], level: str, area: str, item: str, detail: str) -> None:
    rows.append({"level": level, "area": area, "item": item, "detail": detail})


def audit_static(rows: list[dict[str, str]], data: dict[str, dict[str, Any]]) -> None:
    thresholds = {
        "macro_snapshot.json": (data["macro"].get("as_of"), 6),
        "snapshot.json": (data["snapshot"].get("asOf"), 6),
        "stocks_watchlist.json": (data["stocks"].get("as_of"), 6),
        "news.json": (data["news"].get("updated_at"), 12),
        "etf.json": (data["etf"].get("updated_at"), 36),
        "crypto_market.json": (data["crypto_market"].get("as_of"), 2),
    }
    for name, (raw, max_h) in thresholds.items():
        age = age_hours(raw)
        if age is None:
            add(rows, "FAIL", "freshness", name, f"timestamp invalid: {raw!r}")
        elif age > max_h:
            add(rows, "WARN", "freshness", name, f"age {age}h > {max_h}h")
        else:
            add(rows, "OK", "freshness", name, f"age {age}h")

    for name in ("crypto_custom_universe.json", "crypto_top20.json"):
        key = "custom" if "custom" in name else "top20"
        age = age_hours(data[key].get("as_of"))
        if age is None or age > 24:
            add(rows, "WARN", "freshness", name, f"not part of update workflow; age {age}h")


def audit_macro(rows: list[dict[str, str]], macro: dict[str, Any], snapshot: dict[str, Any]) -> None:
    health = macro.get("_health") if isinstance(macro.get("_health"), dict) else {}
    critical = health.get("critical_metrics") or []
    if critical:
        add(rows, "FAIL", "macro", "critical carry metrics", ", ".join(str(x) for x in critical))
    else:
        add(rows, "OK", "macro", "critical carry metrics", "none")

    for path in [("indices", "vix"), ("commodities", "wti")]:
        metric = macro
        for part in path:
            metric = metric.get(part, {}) if isinstance(metric, dict) else {}
        label = ".".join(path)
        source = metric.get("source")
        display = metric.get("display")
        value = metric.get("value")
        if source == "carry" or display in (None, "—") or value is None:
            add(rows, "FAIL", "macro", label, f"source={source}, display={display}, value={value}")

    snap_vix = next((x for x in snapshot.get("indices", []) if "VIX" in str(x.get("label"))), None)
    if snap_vix and snap_vix.get("value") == "—":
        add(rows, "FAIL", "snapshot", "VIX", "snapshot value is blank")


def audit_crypto_live(rows: list[dict[str, str]], crypto_market: dict[str, Any]) -> None:
    try:
        cg = fetch_json("https://api.coingecko.com/api/v3/global")
        fng = fetch_json("https://api.alternative.me/fng/?limit=1&format=json")
        stables = fetch_json("https://stablecoins.llama.fi/stablecoins?includePrices=true")
    except Exception as exc:
        add(rows, "WARN", "live", "external APIs", f"fetch failed: {exc}")
        return

    cg_data = cg.get("data") or {}
    live_btc_d = to_num((cg_data.get("market_cap_percentage") or {}).get("btc"))
    file_btc_d = to_num((crypto_market.get("global") or {}).get("btc_dominance"))
    diff = pct_diff(file_btc_d, live_btc_d)
    if diff is not None and diff > 0.5:
        add(rows, "FAIL", "crypto", "BTC dominance", f"file={file_btc_d:.4f}, live={live_btc_d:.4f}, drift={diff:.2f}%")
    else:
        add(rows, "OK", "crypto", "BTC dominance", f"file={file_btc_d}, live={live_btc_d}")

    fg_live = to_num(((fng.get("data") or [{}])[0] or {}).get("value"))
    fg_file = to_num((crypto_market.get("fear_greed") or {}).get("value"))
    if fg_file != fg_live:
        add(rows, "WARN", "crypto", "Fear & Greed", f"file={fg_file}, live={fg_live}")
    else:
        add(rows, "OK", "crypto", "Fear & Greed", f"value={fg_file}")

    assets = stables.get("peggedAssets") if isinstance(stables.get("peggedAssets"), list) else []
    stable_live = sum(to_num((a.get("circulating") or {}).get("peggedUSD")) or 0 for a in assets if isinstance(a, dict))
    stable_file = to_num((crypto_market.get("stablecoins") or {}).get("total_market_cap_usd"))
    diff = pct_diff(stable_file, stable_live)
    if diff is not None and diff > 0.5:
        add(rows, "FAIL", "crypto", "stablecoin market cap", f"file={stable_file:.0f}, live={stable_live:.0f}, drift={diff:.2f}%")
    else:
        add(rows, "OK", "crypto", "stablecoin market cap", f"file={stable_file:.0f}, live={stable_live:.0f}")


def main() -> int:
    data = {
        "macro": load_json(DATA_DIR / "macro_snapshot.json"),
        "snapshot": load_json(DATA_DIR / "snapshot.json"),
        "stocks": load_json(DATA_DIR / "stocks_watchlist.json"),
        "news": load_json(DATA_DIR / "news.json"),
        "etf": load_json(DATA_DIR / "etf.json"),
        "crypto_market": load_json(DATA_DIR / "crypto_market.json"),
        "custom": load_json(DATA_DIR / "crypto_custom_universe.json"),
        "top20": load_json(DATA_DIR / "crypto_top20.json"),
    }
    rows: list[dict[str, str]] = []
    audit_static(rows, data)
    audit_macro(rows, data["macro"], data["snapshot"])
    audit_crypto_live(rows, data["crypto_market"])

    print("# Dashboard Data Audit")
    print(f"generated_at: {datetime.now(timezone.utc).isoformat()}")
    print()
    print("| Level | Area | Item | Detail |")
    print("|---|---|---|---|")
    for row in rows:
        print(f"| {row['level']} | {row['area']} | {row['item']} | {row['detail']} |")

    failures = [r for r in rows if r["level"] == "FAIL"]
    warnings = [r for r in rows if r["level"] == "WARN"]
    print()
    print(f"summary: {len(failures)} fail, {len(warnings)} warn, {len(rows) - len(failures) - len(warnings)} ok")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
