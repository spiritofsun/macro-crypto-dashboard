#!/usr/bin/env python3
"""Update crypto top-20 and top-200 universe dashboard datasets.

Design goals:
- Generate the dashboard universe from CoinGecko market-cap top 200.
- Keep the job non-blocking when a secondary source fails.
- Preserve previous data if the primary top-200 fetch is temporarily rate-limited.
"""

from __future__ import annotations

import json
import pathlib
import subprocess
import time
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dashboard" / "data"
CUSTOM_OUT = DATA_DIR / "crypto_custom_universe.json"
TOP20_OUT = DATA_DIR / "crypto_top20.json"
USER_AGENT = "project-mark-dashboard/1.0 (+https://spiritofsun.github.io/macro-crypto-dashboard/)"
KST = ZoneInfo("Asia/Seoul")
TOP_UNIVERSE_SIZE = 200
TOP20_SIZE = 20
STABLE_SYMBOLS = {"USDT", "USDC", "DAI", "USDE", "FDUSD", "TUSD", "USDD", "PYUSD", "USD1", "USDS", "FRAX"}

SECTOR_TAGS: dict[str, list[str]] = {
    "BTC": ["major", "store-of-value"],
    "ETH": ["major", "layer1", "smart-contract"],
    "SOL": ["layer1", "high-beta"],
    "BNB": ["exchange", "layer1"],
    "XRP": ["payments"],
    "DOGE": ["meme"],
    "ADA": ["layer1"],
    "TRX": ["layer1", "stablecoin-rail"],
    "AVAX": ["layer1"],
    "LINK": ["oracle"],
    "TON": ["layer1"],
    "SUI": ["layer1"],
    "HYPE": ["dex", "perp"],
    "UNI": ["dex", "defi"],
    "AAVE": ["lending", "defi"],
    "ONDO": ["rwa"],
    "ENA": ["stablecoin", "defi"],
    "LDO": ["staking", "defi"],
    "PENDLE": ["yield", "defi"],
    "ARB": ["layer2"],
    "OP": ["layer2"],
    "MNT": ["layer2"],
    "POL": ["layer2"],
    "NEAR": ["layer1", "ai"],
    "ICP": ["layer1"],
    "FET": ["ai"],
    "TAO": ["ai"],
    "WLD": ["ai"],
    "PEPE": ["meme"],
    "SHIB": ["meme"],
}


def now_kst() -> str:
    return datetime.now(KST).isoformat(timespec="minutes")


def read_json(path: pathlib.Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path: pathlib.Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fetch_text(url: str, timeout: int = 25, attempts: int = 3, pause: float = 2.0) -> str:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            result = subprocess.run(
                ["curl", "-sS", "--http1.1", "--fail", "--max-time", str(timeout), "-A", USER_AGENT, url],
                check=True,
                capture_output=True,
                text=True,
                timeout=timeout + 3,
            )
            return result.stdout
        except Exception as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(pause * attempt)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")
    except Exception as exc:
        raise RuntimeError(f"fetch failed: {url}: {exc}") from last_error


def fetch_json(url: str, timeout: int = 25, attempts: int = 3) -> Any:
    return json.loads(fetch_text(url, timeout=timeout, attempts=attempts))


def to_num(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def round_num(value: Any, digits: int = 8) -> float | None:
    num = to_num(value)
    if num is None:
        return None
    return round(num, digits)


def fetch_top_markets_coingecko(limit: int = TOP_UNIVERSE_SIZE) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    per_page = 100
    pages = (limit + per_page - 1) // per_page
    for page in range(1, pages + 1):
        query = urllib.parse.urlencode(
            {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": per_page,
                "page": page,
                "sparkline": "false",
                "price_change_percentage": "24h,7d",
            },
            safe=",",
        )
        chunk = fetch_json(f"https://api.coingecko.com/api/v3/coins/markets?{query}", timeout=30, attempts=3)
        if isinstance(chunk, list):
            rows.extend(chunk)
        time.sleep(1.2)
    return rows[:limit]


def fetch_top_markets_coinpaprika(limit: int = TOP_UNIVERSE_SIZE) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode({"limit": limit})
    rows = fetch_json(f"https://api.coinpaprika.com/v1/tickers?{query}", timeout=30, attempts=3)
    if not isinstance(rows, list):
        return []
    normalized: list[dict[str, Any]] = []
    for row in rows[:limit]:
        quote = (row.get("quotes") or {}).get("USD") if isinstance(row, dict) else {}
        if not isinstance(quote, dict):
            quote = {}
        normalized.append(
            {
                "id": row.get("id"),
                "symbol": row.get("symbol"),
                "name": row.get("name"),
                "current_price": quote.get("price"),
                "price_change_percentage_24h": quote.get("percent_change_24h"),
                "price_change_percentage_7d_in_currency": quote.get("percent_change_7d"),
                "market_cap": quote.get("market_cap"),
                "total_volume": quote.get("volume_24h"),
                "circulating_supply": row.get("circulating_supply") or row.get("total_supply"),
                "_market_source": "coinpaprika_top200",
            }
        )
    return normalized


def fetch_top_markets(limit: int = TOP_UNIVERSE_SIZE) -> tuple[list[dict[str, Any]], str, list[str]]:
    errors: list[str] = []
    try:
        rows = fetch_top_markets_coingecko(limit)
        if len(rows) >= min(50, limit):
            return rows, "coingecko_top200", errors
        errors.append(f"coingecko_top200: returned {len(rows)} rows")
    except Exception as exc:
        errors.append(f"coingecko_top200: {exc}")

    try:
        rows = fetch_top_markets_coinpaprika(limit)
        if len(rows) >= min(50, limit):
            return rows, "coinpaprika_top200", errors
        errors.append(f"coinpaprika_top200: returned {len(rows)} rows")
    except Exception as exc:
        errors.append(f"coinpaprika_top200: {exc}")

    return [], "previous_file", errors


def fetch_binance_funding() -> tuple[dict[str, float], str | None]:
    try:
        rows = fetch_json("https://fapi.binance.com/fapi/v1/premiumIndex", timeout=20, attempts=2)
    except Exception as exc:
        return {}, str(exc)
    if not isinstance(rows, list):
        return {}, "unexpected funding payload"
    out: dict[str, float] = {}
    for row in rows:
        symbol = str(row.get("symbol") or "").upper()
        funding = to_num(row.get("lastFundingRate"))
        if symbol.endswith("USDT") and funding is not None:
            out[symbol.removesuffix("USDT")] = funding
    return out, None


def fetch_stablecoin_total() -> tuple[float | None, str | None]:
    try:
        payload = fetch_json("https://stablecoins.llama.fi/stablecoins?includePrices=true", timeout=25, attempts=2)
    except Exception as exc:
        return None, str(exc)
    assets = payload.get("peggedAssets") if isinstance(payload, dict) else None
    if not isinstance(assets, list):
        return None, "unexpected stablecoin payload"
    return sum(to_num((asset.get("circulating") or {}).get("peggedUSD")) or 0 for asset in assets if isinstance(asset, dict)), None


def tags_for(symbol: str, previous_tags: list[str] | None = None) -> list[str]:
    tags = []
    if previous_tags:
        tags.extend(str(tag) for tag in previous_tags if tag)
    if symbol in STABLE_SYMBOLS:
        tags.append("stablecoin")
    tags.extend(SECTOR_TAGS.get(symbol, []))
    return sorted(set(tags))


def normalize_market(row: dict[str, Any], rank: int, funding: dict[str, float], source: str, previous: dict[str, Any] | None = None) -> dict[str, Any]:
    previous_ticker = previous.get("ticker") if isinstance(previous, dict) else ""
    symbol = str(row.get("symbol") or previous_ticker or "").upper()
    previous_tags = previous.get("tags") if isinstance(previous, dict) and isinstance(previous.get("tags"), list) else None
    return {
        "rank_in_custom": rank,
        "ticker": symbol,
        "name": row.get("name") or (previous or {}).get("name"),
        "price": round_num(row.get("current_price")),
        "change_24h": round_num(row.get("price_change_percentage_24h"), 4),
        "change_7d": round_num(row.get("price_change_percentage_7d_in_currency"), 4),
        "market_cap": round_num(row.get("market_cap"), 2),
        "volume_24h": round_num(row.get("total_volume"), 2),
        "circulating_supply": round_num(row.get("circulating_supply"), 4),
        "tags": tags_for(symbol, previous_tags),
        "coingecko_id": row.get("id") or (previous or {}).get("coingecko_id"),
        "market_source": source,
        "funding": funding.get(symbol, (previous or {}).get("funding")),
    }


def build_top_payload(markets: list[dict[str, Any]], funding: dict[str, float], as_of: str, source: str) -> dict[str, Any]:
    assets = []
    for idx, row in enumerate(markets[:TOP20_SIZE], start=1):
        symbol = str(row.get("symbol") or "").upper()
        assets.append(
            {
                "rank": idx,
                "symbol": symbol,
                "name": row.get("name"),
                "coingecko_id": row.get("id"),
                "price_usd": round_num(row.get("current_price")),
                "pct_24h": round_num(row.get("price_change_percentage_24h"), 4),
                "pct_7d": round_num(row.get("price_change_percentage_7d_in_currency"), 4),
                "market_cap_usd": round_num(row.get("market_cap"), 2),
                "volume_24h_usd": round_num(row.get("total_volume"), 2),
                "circulating_supply": round_num(row.get("circulating_supply"), 4),
                "funding": funding.get(symbol),
                "tags": tags_for(symbol),
            }
        )
    return {"as_of": as_of, "assets": assets, "_health": {"status": "ok", "source": source.replace("top200", "top20")}}


def build_custom_payload(markets: list[dict[str, Any]], funding: dict[str, float], stable_total: float | None, as_of: str, existing: dict[str, Any], source: str, source_errors: list[str]) -> dict[str, Any]:
    previous_by_symbol = {str(x.get("ticker") or "").upper(): x for x in existing.get("assets") or [] if isinstance(x, dict)}
    assets = [normalize_market(row, idx, funding, source, previous_by_symbol.get(str(row.get("symbol") or "").upper())) for idx, row in enumerate(markets, start=1)]
    return {
        "as_of": as_of,
        "universe": "market_cap_top_200",
        "universe_size": len(assets),
        "target_universe_size": TOP_UNIVERSE_SIZE,
        "assets": assets,
        "stablecoin_market_cap": stable_total if stable_total is not None else existing.get("stablecoin_market_cap"),
        "_health": {
            "status": "ok" if len(assets) >= TOP_UNIVERSE_SIZE else "warn",
            "source": source,
            "asset_count": len(assets),
            "errors": source_errors,
        },
    }


def fallback_payload(existing: dict[str, Any], as_of: str, error: str) -> dict[str, Any]:
    payload = dict(existing)
    payload["as_of"] = as_of
    payload.setdefault("assets", [])
    payload["universe"] = payload.get("universe") or "fallback_previous_universe"
    payload["universe_size"] = len(payload.get("assets") or [])
    payload["target_universe_size"] = TOP_UNIVERSE_SIZE
    payload["_health"] = {
        "status": "fallback",
        "source": "previous_file",
        "asset_count": len(payload.get("assets") or []),
        "errors": [error],
    }
    return payload


def main() -> int:
    existing_custom = read_json(CUSTOM_OUT, {"assets": []})
    existing_top20 = read_json(TOP20_OUT, {"assets": []})
    as_of = now_kst()
    errors: list[str] = []

    funding, funding_error = fetch_binance_funding()
    if funding_error:
        errors.append(f"funding: {funding_error}")

    stable_total, stable_error = fetch_stablecoin_total()
    if stable_error:
        errors.append(f"stablecoins: {stable_error}")

    top_markets, market_source, market_errors = fetch_top_markets(TOP_UNIVERSE_SIZE)
    errors.extend(market_errors)

    if len(top_markets) >= 50:
        custom_payload = build_custom_payload(top_markets, funding, stable_total, as_of, existing_custom, market_source, errors)
        top_payload = build_top_payload(top_markets, funding, as_of, market_source)
        if errors:
            custom_payload["_health"]["status"] = "warn"
            top_payload["_health"] = {"status": "warn", "source": market_source.replace("top200", "top20"), "errors": errors}
    else:
        custom_payload = fallback_payload(existing_custom, as_of, "; ".join(errors) or "top200 fetch returned too few rows")
        top_payload = dict(existing_top20)
        top_payload["as_of"] = as_of
        top_payload["_health"] = {"status": "fallback", "source": "previous_file", "errors": custom_payload["_health"]["errors"]}

    write_json(CUSTOM_OUT, custom_payload)
    write_json(TOP20_OUT, top_payload)
    print(f"updated {CUSTOM_OUT} assets={len(custom_payload.get('assets') or [])} status={custom_payload.get('_health', {}).get('status')}")
    print(f"updated {TOP20_OUT} assets={len(top_payload.get('assets') or [])} status={top_payload.get('_health', {}).get('status')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
