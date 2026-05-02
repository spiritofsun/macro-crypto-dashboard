#!/usr/bin/env python3
"""Build a JS data bundle so dashboard pages also work from file:// URLs."""

from __future__ import annotations

import json
import pathlib
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dashboard" / "data"
OUT = DATA_DIR / "dashboard-data.js"

DATASETS = {
    "snapshot": "snapshot.json",
    "news": "news.json",
    "etf": "etf.json",
    "status": "status.json",
    "macro_snapshot": "macro_snapshot.json",
    "crypto_custom_universe": "crypto_custom_universe.json",
    "stocks_watchlist": "stocks_watchlist.json",
    "crypto_market": "crypto_market.json",
}


def load_json(filename: str) -> Any:
    path = DATA_DIR / filename
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def main() -> int:
    payload = {key: load_json(filename) for key, filename in DATASETS.items()}
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(
        "window.__DASHBOARD_DATA__ = Object.freeze("
        + body
        + ");\n",
        encoding="utf-8",
    )
    print(f"updated {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
