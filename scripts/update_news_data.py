#!/usr/bin/env python3
"""Update dashboard/data/news.json from Google News RSS feeds."""

from __future__ import annotations

import json
import pathlib
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Dict, List

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "dashboard" / "data" / "news.json"
USER_AGENT = "project-mark-dashboard/1.0"


def fetch_rss(query: str, limit: int = 6, retries: int = 2) -> List[Dict[str, str]]:
    q = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=15) as resp:
                xml_bytes = resp.read()
            break
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    else:
        print(f"warn: news rss failed: {query} ({last_error})", file=sys.stderr)
        return []

    root = ET.fromstring(xml_bytes)
    out: List[Dict[str, str]] = []
    for item in root.findall(".//item")[:limit]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = (item.findtext("pubDate") or "").strip()
        if title and link:
            out.append({"title": title, "link": link, "pubDate": pub_date})
    return out


def fetch_news_group(queries: list[str], limit: int = 8) -> List[Dict[str, str]]:
    seen: set[str] = set()
    rows: List[Dict[str, str]] = []
    for query in queries:
        for item in fetch_rss(query, limit=limit):
            key = item.get("link") or item.get("title") or ""
            if not key or key in seen:
                continue
            seen.add(key)
            item["query"] = query
            rows.append(item)
            if len(rows) >= limit:
                return rows
    return rows


def main() -> int:
    macro = fetch_news_group(
        [
            "US stock market OR S&P 500 OR Nasdaq when:1d",
            "treasury yields OR federal reserve OR dollar index when:1d",
            "Apple Microsoft Nvidia Tesla stock market when:1d",
        ],
        limit=8,
    )
    crypto = fetch_news_group(
        [
            "bitcoin ETF OR ethereum ETF OR crypto ETF when:1d",
            "bitcoin ethereum crypto market SEC when:1d",
            "Coinbase MicroStrategy crypto stocks when:1d",
        ],
        limit=8,
    )

    if not macro and not crypto:
        raise RuntimeError("news update failed: no articles collected")

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "macro": macro,
        "crypto": crypto,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
