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

    errors: list[str] = []
    checks = [
        ("macro_snapshot.as_of", macro.get("as_of"), 6),
        ("stocks_watchlist.as_of", stocks.get("as_of"), 6),
        ("snapshot.asOf", snapshot.get("asOf"), 6),
    ]

    for label, raw, max_age_hours in checks:
        try:
            assert_fresh(label, raw, max_age_hours)
        except RuntimeError as exc:
            errors.append(str(exc))

    if errors:
        print("dashboard freshness check failed:", file=sys.stderr)
        for err in errors:
            print(f"- {err}", file=sys.stderr)
        return 1

    print("dashboard freshness check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
