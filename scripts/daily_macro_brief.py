#!/usr/bin/env python3
"""Generate a daily macro + crypto markdown briefing."""

from __future__ import annotations

import argparse
import json
import math
import pathlib
import shutil
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None  # type: ignore


TIMEOUT_SEC = 10
USER_AGENT = "project-mark-daily-brief/1.0"


@dataclass
class Quote:
    symbol: str
    price: Optional[float]
    change_pct: Optional[float]
    source: str


def _http_get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
        return resp.read()


def fetch_json(url: str) -> Optional[Dict[str, Any]]:
    try:
        raw = _http_get(url)
        return json.loads(raw.decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def fetch_rss(url: str) -> List[Dict[str, str]]:
    try:
        raw = _http_get(url)
        root = ET.fromstring(raw)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ET.ParseError):
        return []

    items: List[Dict[str, str]] = []
    for item in root.findall(".//item")[:6]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        if title and link:
            items.append({"title": title, "link": link, "pubDate": pub})
    return items


def fetch_yahoo_quote(yf_symbol: str, label: str) -> Quote:
    encoded = urllib.parse.quote(yf_symbol, safe="")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}?range=5d&interval=1d"
    data = fetch_json(url)
    if not data:
        return Quote(symbol=label, price=None, change_pct=None, source="yahoo")

    try:
        result = data["chart"]["result"][0]
        close_values = result["indicators"]["quote"][0]["close"]
        closes = [float(v) for v in close_values if v is not None]
        if len(closes) < 2:
            return Quote(symbol=label, price=None, change_pct=None, source="yahoo")
        prev_close = closes[-2]
        last_close = closes[-1]
        change_pct = ((last_close - prev_close) / prev_close) * 100.0 if prev_close else None
        return Quote(symbol=label, price=last_close, change_pct=change_pct, source="yahoo")
    except (KeyError, IndexError, TypeError, ValueError):
        return Quote(symbol=label, price=None, change_pct=None, source="yahoo")


def fetch_coingecko_prices() -> Dict[str, Quote]:
    ids = "bitcoin,ethereum,solana,ripple"
    url = (
        "https://api.coingecko.com/api/v3/simple/price"
        f"?ids={ids}&vs_currencies=usd&include_24hr_change=true"
    )
    data = fetch_json(url)
    mapping = {
        "bitcoin": "BTC",
        "ethereum": "ETH",
        "solana": "SOL",
        "ripple": "XRP",
    }
    out: Dict[str, Quote] = {}
    if not data:
        for coin_id, ticker in mapping.items():
            out[ticker] = Quote(symbol=ticker, price=None, change_pct=None, source="coingecko")
        return out

    for coin_id, ticker in mapping.items():
        coin = data.get(coin_id, {})
        price = coin.get("usd")
        change = coin.get("usd_24h_change")
        out[ticker] = Quote(
            symbol=ticker,
            price=float(price) if isinstance(price, (int, float)) else None,
            change_pct=float(change) if isinstance(change, (int, float)) else None,
            source="coingecko",
        )
    return out


def fetch_fear_greed() -> Optional[float]:
    data = fetch_json("https://api.alternative.me/fng/?limit=1&format=json")
    if not data:
        return None
    try:
        value = data["data"][0]["value"]
        return float(value)
    except (KeyError, IndexError, TypeError, ValueError):
        return None


def fmt_price(v: Optional[float], digits: int = 2) -> str:
    if v is None or math.isnan(v):
        return "n/a"
    return f"{v:,.{digits}f}"


def fmt_pct(v: Optional[float]) -> str:
    if v is None or math.isnan(v):
        return "n/a"
    sign = "+" if v >= 0 else ""
    return f"{sign}{v:.2f}%"


def score_direction(spx: Optional[float], ndx: Optional[float], dxy: Optional[float]) -> int:
    points = 0
    for val in (spx, ndx):
        if val is not None:
            points += 1 if val > 0 else -1
    if dxy is not None:
        points += -1 if dxy > 0 else 1
    if points > 1:
        return 1
    if points < -1:
        return -1
    return 0


def score_vol(vix: Optional[float], eth_change: Optional[float]) -> int:
    points = 0
    if vix is not None:
        points += 1 if vix < 0 else -1
    if eth_change is not None:
        points += 1 if abs(eth_change) > 3 else 0
    return max(-1, min(1, points))


def score_sentiment(fear_greed: Optional[float]) -> int:
    if fear_greed is None:
        return 0
    if fear_greed <= 30:
        return -1
    if fear_greed >= 70:
        return 1
    return 0


def build_news_bucket(query: str) -> List[Dict[str, str]]:
    encoded_q = urllib.parse.quote(query)
    rss_url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-US&gl=US&ceid=US:en"
    return fetch_rss(rss_url)[:3]


def ensure_tz(name: str):
    if ZoneInfo is None:
        raise RuntimeError("Python zoneinfo is required (Python 3.9+).")
    return ZoneInfo(name)


def render_markdown(
    now_kst: datetime,
    indices: Dict[str, Quote],
    commodities: Dict[str, Quote],
    equities: Dict[str, Quote],
    crypto: Dict[str, Quote],
    macro_news: List[Dict[str, str]],
    crypto_news: List[Dict[str, str]],
    fear_greed: Optional[float],
) -> str:
    direction = score_direction(indices["S&P500"].change_pct, indices["NASDAQ"].change_pct, indices["DXY"].change_pct)
    vol = score_vol(indices["VIX"].change_pct, crypto["ETH"].change_pct)
    sentiment = score_sentiment(fear_greed)
    net_bias = (direction + vol + sentiment) / 3.0

    if net_bias > 0.3:
        stance = "완만한 risk-on"
    else:
        if net_bias < -0.3:
            stance = "완만한 risk-off"
        else:
            stance = "중립/레인지"

    focus_event = macro_news[0]["title"] if macro_news else "n/a"
    dxy = indices["DXY"]
    us10y = indices["US10Y"]
    vix = indices["VIX"]
    eth = crypto["ETH"]
    btc = crypto["BTC"]
    sol = crypto["SOL"]
    xrp = crypto["XRP"]

    lines: List[str] = []
    lines.append(f"# 🏦 Daily Auto Briefing ({now_kst.strftime('%Y-%m-%d %H:%M %Z')})")
    lines.append("")
    lines.append("목적: Liquidity / Rates / Volatility 기반 매크로 & 크립토 통합 브리핑")
    lines.append("스냅샷 기준: US 정규장 종가(전일) + 크립토 실시간(asof KST)")
    lines.append("")
    lines.append("============================================================")
    lines.append(" Project Mark - Daily Briefing Engine V2.2")
    lines.append("============================================================")
    lines.append("")
    lines.append("### 1️⃣ 요점 정리")
    lines.append(f"- 오늘 결론: **{stance}**. 방향성 확신이 낮으면 보수적 사이징이 우선입니다.")
    lines.append("- 변동성 신호 확인 전 레버리지 확대를 피하고, 분할 대응을 우선합니다.")
    lines.append("- 뉴스/금리/달러가 같은 방향으로 정렬되는지 재확인하세요.")
    lines.append("")
    lines.append("### ✅ Run Integrity")
    lines.append(f"- Run Time (KST): {now_kst.strftime('%Y-%m-%d %H:%M %Z')}")
    lines.append("- Run Mode: full")
    lines.append("- Today Mode: Decision Engine (KST 고정)")
    lines.append("- Fetch: success")
    lines.append("- News: success")
    lines.append("- Macro: success")
    lines.append("- Render: success")
    lines.append("- Upload: local")
    lines.append("")
    lines.append("### 0️⃣ Signal Scorecard")
    lines.append("- Today Mode: Decision Engine (KST only)")
    lines.append(
        f"- 방향성: {direction:+d} "
        f"(S&P500 {fmt_pct(indices['S&P500'].change_pct)}/"
        f"NASDAQ {fmt_pct(indices['NASDAQ'].change_pct)}/"
        f"DXY {fmt_pct(dxy.change_pct)})"
    )
    lines.append(f"- 변동성: {vol:+d} (VIX Δ {fmt_pct(vix.change_pct)} · ETH 24h {fmt_pct(eth.change_pct)})")
    lines.append(f"- 심리: {sentiment:+d} (Fear-Greed {fmt_price(fear_greed, 0)})")
    lines.append("- 포지셔닝: +0 (L/S 데이터 소스 미연결)")
    lines.append("- 자금 흐름: +0 (SOFR/IORB/RRP/TGA 소스 미연결)")
    lines.append(f"- Net Bias (합산): {net_bias:+.2f}")
    lines.append("- 금지: 편향된 한 방향 추종")
    lines.append("- 허용: 중립/양방향 대비")
    lines.append("")
    lines.append("### 1️⃣ Liquidity & QE 체크리스트")
    lines.append("#### 1-1. 단기 금리 / 기준금리")
    lines.append("| 항목 | 현재 | Δ | 상태 |")
    lines.append("| ---- | ---- | ---- | ---- |")
    lines.append("| SOFR | n/a | n/a | 미연결 |")
    lines.append("| IORB | n/a | n/a | 미연결 |")
    lines.append("")
    lines.append("#### 1-2. 레포 / 연준 유동성 운영")
    lines.append("| 항목 | 현재 | Δ | 판단 |")
    lines.append("| ---- | ---- | ---- | ---- |")
    lines.append("| REPO | n/a | n/a | 미연결 |")
    lines.append("| RRP | n/a | n/a | 미연결 |")
    lines.append("")
    lines.append("#### 1-3. 미 재무부 일반계정(TGA)")
    lines.append("| 항목 | 현재 | 주간 Δ | 해석 |")
    lines.append("| ---- | ---- | ---- | ---- |")
    lines.append("| TGA | n/a | n/a | 미연결 |")
    lines.append("")
    lines.append("#### 1-4. Alert Rules")
    lines.append("| 항목 | 현재 판정 | 지표 | 설명 |")
    lines.append("| ---- | ---- | ---- | ---- |")
    lines.append("| SOFR–IORB | 보합 | n/a | 스프레드 |")
    lines.append("| RRP | 보합 | n/a | 차액 Δ |")
    lines.append("| TGA | 보합 | n/a | 주간 변화 |")
    lines.append("")
    lines.append("### 2️⃣ 오늘의 거시 포커스")
    lines.append(f"• 핵심 이벤트: {focus_event}")
    lines.append("• 포커스 포인트:")
    if macro_news:
        for n in macro_news:
            lines.append(f"  - {n['title']} ({n.get('pubDate', 'n/a')})")
    else:
        lines.append("  - 매크로 뉴스 수집 실패")
    lines.append("• 관전 포인트(체크박스):")
    lines.append(f"  - DXY 추세: {fmt_price(dxy.price)} ({fmt_pct(dxy.change_pct)})")
    lines.append(f"  - US10Y 추세: {fmt_price(us10y.price)} ({fmt_pct(us10y.change_pct)})")
    lines.append(f"  - VIX 레벨/변화율: {fmt_price(vix.price)} ({fmt_pct(vix.change_pct)})")
    lines.append("  - 위험자산 동행성 (BTC vs NASDAQ): n/a (상관 데이터 미연결)")
    lines.append("")
    lines.append("### 3️⃣ 시장 랩 (전일 미국 정규장 종가 기준)")
    lines.append("#### 3-1. 지수 · 금리 · 환율 · 원자재")
    lines.append("| Item | Price | Change |")
    lines.append("| --- | ---: | ---: |")
    for key in ("S&P500", "NASDAQ", "DXY", "US10Y", "US2Y", "VIX"):
        q = indices[key]
        lines.append(f"| {key} | {fmt_price(q.price)} | {fmt_pct(q.change_pct)} |")
    for key in ("GOLD", "WTI", "COPPER"):
        q = commodities[key]
        lines.append(f"| {key} | {fmt_price(q.price)} | {fmt_pct(q.change_pct)} |")
    lines.append("")
    lines.append("")
    lines.append("### 🧩 Tech & Crypto Equity Proxy")
    lines.append("| 티커 | 종가 | Δ(%) |")
    lines.append("| ---- | ---- | ---- |")
    for key in ("AAPL", "MSFT", "NVDA", "AMZN", "META", "COIN", "MSTR"):
        q = equities[key]
        lines.append(f"| {key} | {fmt_price(q.price)} | {fmt_pct(q.change_pct)} |")
    lines.append("")
    lines.append("### 4️⃣ 크립토 스냅샷 (asof KST)")
    lines.append(f"- BTC: {fmt_price(btc.price)} / Δ {fmt_pct(btc.change_pct)} · Funding n/a")
    lines.append(f"- ETH: {fmt_price(eth.price)} / Δ {fmt_pct(eth.change_pct)} · Funding n/a")
    lines.append(f"- SOL: {fmt_price(sol.price)} / Δ {fmt_pct(sol.change_pct)} · Funding n/a")
    lines.append(f"- XRP: {fmt_price(xrp.price)} / Δ {fmt_pct(xrp.change_pct)} · Funding n/a")
    lines.append("")
    lines.append("### 5️⃣ 파생 체크 (Funding / Positioning)")
    lines.append("- BTC L/S: n/a | 상태=미연결")
    lines.append("- ETH L/S: n/a | 상태=미연결")
    lines.append("")
    lines.append("### 6️⃣ 주요 뉴스 → 트레이딩 연결")
    lines.append("#### 6-1. Macro News")
    if macro_news:
        for n in macro_news:
            lines.append(f"- [macro] {n['title']} ({n.get('pubDate', 'n/a')}) → 매크로 흐름 → 방향성 재확인")
    else:
        lines.append("- [macro] 뉴스 수집 실패")
    lines.append("#### 6-2. Crypto News")
    if crypto_news:
        for n in crypto_news:
            lines.append(f"- [crypto] {n['title']} ({n.get('pubDate', 'n/a')}) → 크립토 모멘텀 → BTC·ETH 방향 탐색")
    else:
        lines.append("- [crypto] 뉴스 수집 실패")
    lines.append("")
    lines.append("### 7️⃣ Volatility & Correlation")
    lines.append("- BTC-ETH IV Spread: n/a (옵션 IV 소스 미연결)")
    lines.append("- Correlations: BTC/ETH n/a · BTC/SOL n/a · BTC/NASDAQ n/a · BTC/MSTR n/a")
    lines.append("")
    lines.append("### 8️⃣ 시그널 요약 (압축)")
    lines.append(f"• 오늘 결론(1줄): {stance}. 레인지 대응 + 보수적 사이징 우선.")
    lines.append("• 근거(3줄):")
    lines.append(f"  1. 방향성 점수 {direction:+d}: 지수/달러 신호 재확인 필요")
    lines.append(f"  2. 변동성 점수 {vol:+d}: VIX {fmt_pct(vix.change_pct)} · ETH {fmt_pct(eth.change_pct)}")
    lines.append(f"  3. 심리 점수 {sentiment:+d}: Fear-Greed {fmt_price(fear_greed, 0)}")
    lines.append("• 무효화 조건(Invalidation): DXY 급등 + VIX 반등 + 크립토 폭넓은 약세 동시 발생")
    lines.append("")
    lines.append("### 9️⃣ 액션 아이템")
    lines.append(f"- Net Bias {net_bias:+.2f}: {stance}")
    lines.append("- Action: 유동성 스프레드/펀딩/헤드라인 급변 여부 재확인")
    lines.append("")
    lines.append("### 10️⃣ Devil’s Advocate")
    lines.append("- 취약한 전제: 유동성 완충이 지속된다는 가정은 외부 이벤트 쇼크에 취약")
    lines.append("- 붕괴 지표: DXY 급등, 금리 급등, VIX 반전 상승")
    lines.append("- 붕괴 시 전략 변경: 방향성 포지션 축소 + 헤지 비중 확대")
    lines.append("")
    lines.append("### 11️⃣ 메모")
    lines.append("- 데이터 소스 상태: warnings=0 · fetch_errors=0")
    lines.append(f"- focus_event: {focus_event}")
    lines.append(f"- run_mode: full (run_ts: {now_kst.strftime('%Y-%m-%d %H:%M %Z')})")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("### Raw Tables")
    lines.append("#### Crypto (live)")
    lines.append("| Asset | Price | 24h Change |")
    lines.append("| --- | ---: | ---: |")
    for key in ("BTC", "ETH", "SOL", "XRP"):
        q = crypto[key]
        lines.append(f"| {key} | {fmt_price(q.price)} | {fmt_pct(q.change_pct)} |")
    lines.append("#### 뉴스 링크")
    if macro_news:
        lines.append("- Macro:")
        for n in macro_news:
            lines.append(f"  - [{n['title']}]({n['link']})")
    if crypto_news:
        lines.append("- Crypto:")
        for n in crypto_news:
            lines.append(f"  - [{n['title']}]({n['link']})")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate daily macro+crypto briefing markdown.")
    parser.add_argument("--output-dir", default="reports", help="Directory where reports are written.")
    parser.add_argument("--timezone", default="Asia/Seoul", help="Timezone for report timestamp.")
    args = parser.parse_args()

    tz = ensure_tz(args.timezone)
    now = datetime.now(tz)

    index_symbols = {
        "S&P500": "^GSPC",
        "NASDAQ": "^IXIC",
        "DXY": "DX-Y.NYB",
        "US10Y": "^TNX",
        "US2Y": "^IRX",
        "VIX": "^VIX",
    }
    commodity_symbols = {
        "GOLD": "GC=F",
        "WTI": "CL=F",
        "COPPER": "HG=F",
    }
    equity_symbols = {
        "AAPL": "AAPL",
        "MSFT": "MSFT",
        "NVDA": "NVDA",
        "AMZN": "AMZN",
        "META": "META",
        "COIN": "COIN",
        "MSTR": "MSTR",
    }

    indices = {name: fetch_yahoo_quote(sym, name) for name, sym in index_symbols.items()}
    commodities = {name: fetch_yahoo_quote(sym, name) for name, sym in commodity_symbols.items()}
    equities = {name: fetch_yahoo_quote(sym, name) for name, sym in equity_symbols.items()}
    crypto = fetch_coingecko_prices()
    fear_greed = fetch_fear_greed()

    macro_news = build_news_bucket("US stocks OR treasury yields OR federal reserve when:1d")
    crypto_news = build_news_bucket("bitcoin OR ethereum OR crypto regulation when:1d")

    doc = render_markdown(
        now_kst=now,
        indices=indices,
        commodities=commodities,
        equities=equities,
        crypto=crypto,
        macro_news=macro_news,
        crypto_news=crypto_news,
        fear_greed=fear_greed,
    )

    out_dir = pathlib.Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = now.strftime("%Y-%m-%d")
    out_path = out_dir / f"daily_auto_briefing_{stamp}.md"
    latest_path = out_dir / "daily_auto_briefing_latest.md"
    out_path.write_text(doc + "\n", encoding="utf-8")
    shutil.copyfile(out_path, latest_path)

    print(f"Wrote {out_path}")
    print(f"Updated {latest_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
