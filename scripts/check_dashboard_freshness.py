#!/usr/bin/env python3
"""Fail CI when key dashboard datasets are stale."""

from __future__ import annotations

import json
import pathlib
import sys
from datetime import datetime, timezone
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dashboard" / "data"


def load_json(path: pathlib.Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_dt(raw: str) -> datetime | None:
    if not raw or not isinstance(raw, str):
        return None

    normalized = raw.strip()
    if normalized.endswith(" KST"):
        normalized = normalized.replace(" KST", ":00+09:00").replace(" ", "T")

    try:
        dt = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def assert_fresh(label: str, raw: str, max_age_hours: float) -> None:
    dt = parse_dt(raw)
    if dt is None:
        raise RuntimeError(f"{label}: invalid timestamp {raw!r}")

    age_hours = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
    if age_hours > max_age_hours:
        raise RuntimeError(f"{label}: stale by {age_hours:.1f}h (timestamp {raw})")


def main() -> int:
    macro = load_json(DATA_DIR / "macro_snapshot.json")
    stocks = load_json(DATA_DIR / "stocks_watchlist.json")
    snapshot = load_json(DATA_DIR / "snapshot.json")
    news = load_json(DATA_DIR / "news.json")
    etf = load_json(DATA_DIR / "etf.json")
    crypto_market = load_json(DATA_DIR / "crypto_market.json")
    crypto_custom = load_json(DATA_DIR / "crypto_custom_universe.json")
    crypto_top20 = load_json(DATA_DIR / "crypto_top20.json")

    errors: list[str] = []
    checks = [
        ("macro_snapshot.as_of", macro.get("as_of"), 6),
        ("stocks_watchlist.as_of", stocks.get("as_of"), 6),
        ("snapshot.asOf", snapshot.get("asOf"), 6),
        ("news.updated_at", news.get("updated_at"), 12),
        ("etf.updated_at", etf.get("updated_at"), 36),
        ("crypto_market.as_of", crypto_market.get("as_of"), 2),
        ("crypto_custom_universe.as_of", crypto_custom.get("as_of"), 3),
        ("crypto_top20.as_of", crypto_top20.get("as_of"), 3),
    ]

    for label, raw, max_age_hours in checks:
        try:
            assert_fresh(label, raw, max_age_hours)
        except RuntimeError as exc:
            errors.append(str(exc))

    macro_health = macro.get("_health")
    if isinstance(macro_health, dict):
        critical = macro_health.get("critical_metrics") or []
        if critical:
            errors.append(f"macro_snapshot._health.critical_metrics: {', '.join(str(x) for x in critical)}")

    if not isinstance(etf.get("btc_history_7d_usd_m"), list) or len(etf.get("btc_history_7d_usd_m") or []) < 3:
        errors.append("etf.btc_history_7d_usd_m: insufficient history")
    if not isinstance(etf.get("eth_history_7d_usd_m"), list) or len(etf.get("eth_history_7d_usd_m") or []) < 3:
        errors.append("etf.eth_history_7d_usd_m: insufficient history")

    crypto_assets = crypto_custom.get("assets") if isinstance(crypto_custom.get("assets"), list) else []
    if len(crypto_assets) < 200:
        errors.append(f"crypto_custom_universe.assets: expected >=200, got {len(crypto_assets)}")
    blank_tickers = [str(row.get("rank_in_custom") or "?") for row in crypto_assets if isinstance(row, dict) and not row.get("ticker")]
    if blank_tickers:
        errors.append(f"crypto_custom_universe.assets: blank ticker ranks {', '.join(blank_tickers[:10])}")
    health = crypto_custom.get("_health") if isinstance(crypto_custom.get("_health"), dict) else {}
    if health.get("status") == "fallback" and len(crypto_assets) < 200:
        errors.append("crypto_custom_universe._health: fallback without complete top-200 universe")

    if errors:
        print("dashboard freshness check failed:", file=sys.stderr)
        for err in errors:
            print(f"- {err}", file=sys.stderr)
        return 1

    print("dashboard freshness check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
