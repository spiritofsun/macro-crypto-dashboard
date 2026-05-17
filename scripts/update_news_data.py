#!/usr/bin/env python3
"""Update dashboard/data/news.json from free news feeds.

Google News RSS remains the primary source. GDELT is used as a free
supplement/fallback so the dashboard does not go empty when RSS results are
thin or delayed.
"""

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
            out.append({"title": title, "link": link, "pubDate": pub_date, "source": "Google News"})
    return out


def fetch_gdelt(query: str, limit: int = 4, retries: int = 1) -> List[Dict[str, str]]:
    params = urllib.parse.urlencode({
        "query": query.replace(" when:1d", ""),
        "mode": "artlist",
        "format": "json",
        "maxrecords": str(limit),
        "sort": "datedesc",
    })
    url = f"https://api.gdeltproject.org/api/v2/doc/doc?{params}"
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=18) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            break
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    else:
        print(f"warn: gdelt failed: {query} ({last_error})", file=sys.stderr)
        return []

    articles = payload.get("articles") if isinstance(payload, dict) else []
    out: List[Dict[str, str]] = []
    for item in articles[:limit]:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        link = str(item.get("url") or "").strip()
        pub_date = str(item.get("seendate") or "").strip()
        source = str(item.get("sourceCommonName") or item.get("domain") or "GDELT").strip()
        if title and link:
            out.append({"title": title, "link": link, "pubDate": pub_date, "source": source or "GDELT"})
    return out


def fetch_news_group(queries: list[str], limit: int = 8) -> List[Dict[str, str]]:
    seen: set[str] = set()
    rows: List[Dict[str, str]] = []
    for provider in (fetch_rss, fetch_gdelt):
        for query in queries:
            provider_limit = limit if provider is fetch_rss else max(3, limit // 2)
            for item in provider(query, limit=provider_limit):
                key = item.get("link") or item.get("title") or ""
                if not key or key in seen:
                    continue
                seen.add(key)
                item["query"] = query
                rows.append(item)
                if len(rows) >= limit:
                    return rows
    return rows


def count_source(rows: List[Dict[str, str]], source: str) -> int:
    needle = source.lower()
    return sum(1 for item in rows if needle in str(item.get("source") or "").lower())


def provider_counts(rows: List[Dict[str, str]]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for item in rows:
        source = str(item.get("source") or "unknown").strip() or "unknown"
        key = "Google News" if source == "Google News" else "GDELT/Publisher"
        counts[key] = counts.get(key, 0) + 1
    return counts


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
        "_health": {
            "status": "ok",
            "free_sources": ["Google News RSS", "GDELT 2.1 DOC API"],
            "source_counts": {
                "macro": provider_counts(macro),
                "crypto": provider_counts(crypto),
                "gdelt_total": count_source(macro + crypto, "gdelt"),
            },
        },
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
