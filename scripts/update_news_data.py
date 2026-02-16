#!/usr/bin/env python3
"""Update dashboard/data/news.json from Google News RSS feeds."""

from __future__ import annotations

import json
import pathlib
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Dict, List

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "dashboard" / "data" / "news.json"
USER_AGENT = "project-mark-dashboard/1.0"


def fetch_rss(query: str, limit: int = 6) -> List[Dict[str, str]]:
    q = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as resp:
        xml_bytes = resp.read()

    root = ET.fromstring(xml_bytes)
    out: List[Dict[str, str]] = []
    for item in root.findall(".//item")[:limit]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = (item.findtext("pubDate") or "").strip()
        if title and link:
            out.append({"title": title, "link": link, "pubDate": pub_date})
    return out


def main() -> int:
    macro = fetch_rss("US stock market OR treasury yields OR federal reserve when:1d", limit=8)
    crypto = fetch_rss("bitcoin OR ethereum OR crypto ETF OR SEC crypto when:1d", limit=8)

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
