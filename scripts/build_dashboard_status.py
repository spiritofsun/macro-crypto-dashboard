#!/usr/bin/env python3
"""Build a compact dashboard data-status manifest for the frontend."""

from __future__ import annotations

import json
import pathlib
from datetime import datetime, timezone
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dashboard" / "data"
OUT = DATA_DIR / "status.json"


def load_json(path: pathlib.Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


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


def level_for(age: float | None, warn_h: float, fail_h: float) -> str:
    if age is None:
        return "missing"
    if age >= fail_h:
        return "danger"
    if age >= warn_h:
        return "warn"
    return "ok"


def build_entry(label: str, raw_ts: Any, warn_h: float, fail_h: float, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    age = age_hours(raw_ts)
    payload = {
        "label": label,
        "timestamp": raw_ts if isinstance(raw_ts, str) else None,
        "age_hours": age,
        "level": level_for(age, warn_h, fail_h),
    }
    if extra:
        payload.update(extra)
    return payload


def main() -> int:
    macro = load_json(DATA_DIR / "macro_snapshot.json")
    stocks = load_json(DATA_DIR / "stocks_watchlist.json")
    snapshot = load_json(DATA_DIR / "snapshot.json")
    news = load_json(DATA_DIR / "news.json")
    etf = load_json(DATA_DIR / "etf.json")
    crypto_market = load_json(DATA_DIR / "crypto_market.json")
    crypto_custom = load_json(DATA_DIR / "crypto_custom_universe.json")

    macro_health = macro.get("_health") if isinstance(macro.get("_health"), dict) else {}
    macro_entry = build_entry("매크로", macro.get("as_of"), warn_h=4, fail_h=12, extra={
        "issue_count": int(macro_health.get("issue_count") or 0),
        "critical_issue_count": int(macro_health.get("critical_issue_count") or 0),
        "carried_metrics": macro_health.get("carried_metrics") or [],
        "critical_metrics": macro_health.get("critical_metrics") or [],
    })
    if macro_entry["critical_issue_count"]:
        macro_entry["level"] = "danger"
    elif macro_entry["issue_count"] and macro_entry["level"] == "ok":
        macro_entry["level"] = "warn"

    datasets = {
      "macro": macro_entry,
      "stocks": build_entry("주식 워치", stocks.get("as_of"), warn_h=4, fail_h=12),
      "snapshot": build_entry("스냅샷", snapshot.get("asOf"), warn_h=4, fail_h=12),
      "news": build_entry("뉴스", news.get("updated_at"), warn_h=6, fail_h=18, extra={
          "macro_count": len(news.get("macro") or []),
          "crypto_count": len(news.get("crypto") or []),
      }),
      "etf": build_entry("ETF", etf.get("updated_at"), warn_h=18, fail_h=48, extra={
          "market_date": etf.get("date"),
          "freshness": etf.get("freshness"),
          "has_history": bool(etf.get("btc_history_7d_usd_m")) and bool(etf.get("eth_history_7d_usd_m")),
      }),
      "crypto_market": build_entry("크립토 마켓", crypto_market.get("as_of"), warn_h=2, fail_h=6, extra={
          "btc_dominance": ((crypto_market.get("global") or {}).get("btc_dominance")),
          "stablecoin_market_cap": ((crypto_market.get("stablecoins") or {}).get("total_market_cap_usd")),
      }),
      "crypto_universe": build_entry("크립토 유니버스", crypto_custom.get("as_of"), warn_h=2, fail_h=6, extra={
          "universe": crypto_custom.get("universe"),
          "asset_count": len(crypto_custom.get("assets") or []),
          "target_asset_count": crypto_custom.get("target_universe_size") or 200,
          "source": ((crypto_custom.get("_health") or {}).get("source") if isinstance(crypto_custom.get("_health"), dict) else None),
          "health": ((crypto_custom.get("_health") or {}).get("status") if isinstance(crypto_custom.get("_health"), dict) else None),
      }),
    }

    universe_entry = datasets["crypto_universe"]
    if universe_entry.get("asset_count", 0) < universe_entry.get("target_asset_count", 200):
        universe_entry["level"] = "danger"
    elif universe_entry.get("health") in {"warn", "fallback"} and universe_entry["level"] == "ok":
        universe_entry["level"] = "warn"

    levels = [entry["level"] for entry in datasets.values()]
    overall = "danger" if "danger" in levels or "missing" in levels else "warn" if "warn" in levels else "ok"

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "overall": overall,
        "datasets": datasets,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
