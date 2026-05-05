#!/usr/bin/env python3
"""Static UI contract checks for the dashboard master layout.

This is intentionally dependency-free so it can run in GitHub Actions and locally.
It catches regressions that previously caused mixed dark/light UI, duplicated AI
sentiment blocks, missing ETF explanations, or stale cache versions.
"""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "dashboard"
CACHE_VERSION = "20260505c"

FAILURES: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        FAILURES.append(message)


def read(path: str) -> str:
    return (DASHBOARD / path).read_text(encoding="utf-8")


html_files = [
    DASHBOARD / name
    for name in (
        "index.html",
        "crypto.html",
        "stock-market.html",
        "etf.html",
        "news.html",
        "long-short.html",
        "funding.html",
        "exchanges.html",
        "ai-gpt-brief.html",
    )
]
for html in html_files:
    text = html.read_text(encoding="utf-8")
    require(CACHE_VERSION in text, f"{html.name}: cache version is not {CACHE_VERSION}")
    require("StraWeb Lab" not in text, f"{html.name}: legacy brand text remains")

ai_html = read("ai-gpt-brief.html")
etf_html = read("etf.html")
app_js = read("app.js")
styles = read("styles.css")

require('id="aiSummaryHub"' in ai_html, "ai-gpt-brief.html: missing AI summary hub")
require('id="aiScenarioGrid"' in ai_html, "ai-gpt-brief.html: missing AI scenario grid")
require('id="aiActionChecklist"' in ai_html, "ai-gpt-brief.html: missing AI checklist")
require('id="aiSentimentGauge"' not in ai_html, "ai-gpt-brief.html: duplicated large sentiment gauge host remains")
require("Crypto Sentiment" not in ai_html, "ai-gpt-brief.html: old large sentiment section remains")

require('id="etfFlowNote"' in etf_html, "etf.html: missing ETF flow explanation note")
require("flow-row-v2" in app_js, "app.js: ETF diverging flow rows are missing")
require("ETF Flow 읽는 법" in app_js, "app.js: ETF flow explanation copy is missing")
require("ai-scenario-card" in app_js, "app.js: AI scenario renderer is missing")
require("ai-action-checklist" in styles, "styles.css: AI checklist styles are missing")
require("--master-card-bg" in styles, "styles.css: shared master component tokens are missing")

# Guard against obvious old dark card patterns being reintroduced after the master override.
last_master = styles.rfind("v20260505c master system")
require(last_master >= 0, "styles.css: master system override block missing")
if last_master >= 0:
    after_master = styles[last_master:]
    require("#0a0e13" not in after_master, "styles.css: dark card color found after master override")
    require("rgba(12, 17, 23" not in after_master, "styles.css: old dark gradient found after master override")

if FAILURES:
    print("Dashboard UI contract check failed:")
    for item in FAILURES:
        print(f"- {item}")
    sys.exit(1)

print(f"dashboard UI contract check passed ({len(html_files)} pages, cache {CACHE_VERSION})")
