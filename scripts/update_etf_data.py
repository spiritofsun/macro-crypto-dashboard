#!/usr/bin/env python3
"""Update dashboard/data/etf.json from public ETF flow pages."""

from __future__ import annotations

import html
import json
import pathlib
import re
import urllib.request
from datetime import datetime, timezone
from typing import Optional, Tuple

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "dashboard" / "data" / "etf.json"
USER_AGENT = "project-mark-dashboard/1.0"

DATE_RE = re.compile(r"\b\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\b")
NUM_RE = re.compile(r"[-+]?\$?[\d,]+(?:\.\d+)?")


def clean_text(raw: str) -> str:
    text = re.sub(r"<[^>]+>", " ", raw)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse_value(text: str) -> Optional[float]:
    m = NUM_RE.search(text.replace("(", "-").replace(")", ""))
    if not m:
        return None
    s = m.group(0).replace("$", "").replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def parse_human_date(text: str) -> Optional[datetime]:
    try:
        return datetime.strptime(text, "%d %b %Y")
    except ValueError:
        return None


def latest_total_inflow(url: str) -> Tuple[Optional[str], Optional[float]]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        html_body = resp.read().decode("utf-8", errors="ignore")

    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", html_body, flags=re.IGNORECASE | re.DOTALL)
    best_date_text: Optional[str] = None
    best_date_obj: Optional[datetime] = None
    best_value: Optional[float] = None

    for row in rows:
        cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, flags=re.IGNORECASE | re.DOTALL)
        if len(cells) < 2:
            continue

        first = clean_text(cells[0])
        date_match = DATE_RE.search(first)
        if not date_match:
            continue

        date_text = date_match.group(0)
        date_obj = parse_human_date(date_text)
        if not date_obj:
            continue

        # Farside tables have TOTAL in the last/near-last column.
        # We scan from right to left and use the first parseable number.
        value: Optional[float] = None
        for c in reversed(cells):
            t = clean_text(c)
            v = parse_value(t)
            if v is not None:
                value = v
                break

        if best_date_obj is None or date_obj > best_date_obj:
            best_date_text = date_text
            best_date_obj = date_obj
            best_value = value

    return best_date_text, best_value


def main() -> int:
    btc_date, btc_flow = latest_total_inflow("https://farside.co.uk/btc/")
    eth_date, eth_flow = latest_total_inflow("https://farside.co.uk/eth/")

    ref_date = btc_date or eth_date or "n/a"
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "date": ref_date,
        "btc_us_spot_etf_net_inflow_usd_m": btc_flow,
        "eth_us_spot_etf_net_inflow_usd_m": eth_flow,
        "source": "farside.co.uk",
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
