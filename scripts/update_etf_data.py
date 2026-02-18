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
DEFILLAMA_DATE_RE = re.compile(r"\b([A-Za-z]+ \d{1,2}, \d{4})\b")


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


def parse_any_date(text: str) -> Optional[datetime]:
    candidates = [
        ("%d %b %Y", text),
        ("%b %d %Y", text),
        ("%B %d, %Y", text),
        ("%Y-%m-%d", text),
    ]
    for fmt, raw in candidates:
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
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


def latest_defillama_etf_flows() -> Tuple[Optional[str], Optional[float], Optional[float]]:
    """Fallback source. DefiLlama ETF daily stats (source: Farside)."""
    req = urllib.request.Request("https://defillama.com/etfs", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        html_body = resp.read().decode("utf-8", errors="ignore")

    text = clean_text(html_body)

    d_match = DEFILLAMA_DATE_RE.search(text)
    date_text = d_match.group(1) if d_match else None

    # Parse sequence near "Daily Stats": Bitcoin Flows..., Ethereum Flows...
    btc_flow = None
    eth_flow = None
    btc_m = re.search(r"Bitcoin\s+Flows\s*([+-]?\$?[\d,.]+)m", text, flags=re.IGNORECASE)
    eth_m = re.search(r"Ethereum\s+Flows\s*([+-]?\$?[\d,.]+)m", text, flags=re.IGNORECASE)
    if btc_m:
        btc_flow = parse_value(btc_m.group(1))
    if eth_m:
        eth_flow = parse_value(eth_m.group(1))

    return date_text, btc_flow, eth_flow


def pick_fresher(
    cur_date: Optional[str],
    cur_btc: Optional[float],
    cur_eth: Optional[float],
    prev_payload: dict,
) -> Tuple[str, Optional[float], Optional[float], str]:
    prev_date_text = str(prev_payload.get("date") or "")
    prev_btc = prev_payload.get("btc_us_spot_etf_net_inflow_usd_m")
    prev_eth = prev_payload.get("eth_us_spot_etf_net_inflow_usd_m")

    cur_dt = parse_any_date(cur_date) if cur_date else None
    prev_dt = parse_any_date(prev_date_text) if prev_date_text else None

    # If current parse is missing or older than existing file, keep existing.
    if not cur_dt and prev_dt:
        return prev_date_text, prev_btc, prev_eth, "previous"
    if cur_dt and prev_dt and cur_dt < prev_dt:
        return prev_date_text, prev_btc, prev_eth, "previous"

    return (cur_date or prev_date_text or "n/a"), cur_btc if cur_btc is not None else prev_btc, cur_eth if cur_eth is not None else prev_eth, "latest"


def main() -> int:
    prev_payload = {}
    if OUT.exists():
        try:
            prev_payload = json.loads(OUT.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            prev_payload = {}

    try:
        btc_date, btc_flow = latest_total_inflow("https://farside.co.uk/btc/")
    except Exception as e:
        print(f"warn: farside btc fetch failed ({e})")
        btc_date, btc_flow = None, None
    try:
        eth_date, eth_flow = latest_total_inflow("https://farside.co.uk/eth/")
    except Exception as e:
        print(f"warn: farside eth fetch failed ({e})")
        eth_date, eth_flow = None, None

    source = "farside.co.uk"
    ref_date = btc_date or eth_date
    if ref_date is None or btc_flow is None or eth_flow is None:
        try:
            d_date, d_btc, d_eth = latest_defillama_etf_flows()
            if d_date:
                ref_date = d_date
            if btc_flow is None:
                btc_flow = d_btc
            if eth_flow is None:
                eth_flow = d_eth
            source = "defillama.com (source: farside)"
        except Exception as e:
            print(f"warn: defillama fetch failed ({e})")

    ref_date, btc_flow, eth_flow, freshness = pick_fresher(ref_date, btc_flow, eth_flow, prev_payload)
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "date": ref_date,
        "btc_us_spot_etf_net_inflow_usd_m": btc_flow,
        "eth_us_spot_etf_net_inflow_usd_m": eth_flow,
        "source": source,
        "freshness": freshness,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
