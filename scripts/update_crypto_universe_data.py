#!/usr/bin/env python3
"""Update crypto top-20 and custom universe dashboard datasets."""

from __future__ import annotations

import json
import pathlib
import subprocess
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dashboard" / "data"
CUSTOM_OUT = DATA_DIR / "crypto_custom_universe.json"
TOP20_OUT = DATA_DIR / "crypto_top20.json"
USER_AGENT = "project-mark-dashboard/1.0"
KST = ZoneInfo("Asia/Seoul")

COINGECKO_ID_BY_SYMBOL = {
    "AAVE": "aave",
    "ADA": "cardano",
    "AERO": "aerodrome-finance",
    "APT": "aptos",
    "ARB": "arbitrum",
    "AVAX": "avalanche-2",
    "BCH": "bitcoin-cash",
    "BEAM": "beam-2",
    "BERA": "berachain-bera",
    "BNB": "binancecoin",
    "BTC": "bitcoin",
    "CC": "canto",
    "CRV": "curve-dao-token",
    "DOGE": "dogecoin",
    "EIGEN": "eigenlayer",
    "ENA": "ethena",
    "ETH": "ethereum",
    "FIL": "filecoin",
    "FRAX": "frax",
    "GRT": "the-graph",
    "HYPE": "hyperliquid",
    "ICP": "internet-computer",
    "IP": "story-2",
    "LINK": "chainlink",
    "LDO": "lido-dao",
    "LINEA": "linea",
    "LTC": "litecoin",
    "MNT": "mantle",
    "MORPHO": "morpho",
    "NEAR": "near",
    "OKB": "okb",
    "ONDO": "ondo-finance",
    "OP": "optimism",
    "PENDLE": "pendle",
    "POL": "polygon-ecosystem-token",
    "PYTH": "pyth-network",
    "SAND": "the-sandbox",
    "SHIB": "shiba-inu",
    "SKY": "sky",
    "SOL": "solana",
    "STRK": "starknet",
    "SUI": "sui",
    "SYRUP": "maple-finance",
    "TON": "the-open-network",
    "TRX": "tron",
    "UNI": "uniswap",
    "USDC": "usd-coin",
    "USDT": "tether",
    "WLD": "worldcoin-wld",
    "XLM": "stellar",
    "XMR": "monero",
    "XRP": "ripple",
    "ZK": "zksync",
    "ZRO": "layerzero",
}


def fetch_text(url: str, timeout: int = 25) -> str:
    try:
        result = subprocess.run(
            ["curl", "-sS", "--http1.1", "--max-time", str(timeout), "-A", USER_AGENT, url],
            check=True,
            capture_output=True,
            text=True,
            timeout=timeout + 2,
        )
        return result.stdout
    except Exception:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")


def fetch_json(url: str, timeout: int = 25) -> Any:
    return json.loads(fetch_text(url, timeout))


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


def fetch_markets_by_id(ids: list[str]) -> dict[str, dict[str, Any]]:
    markets: dict[str, dict[str, Any]] = {}
    unique_ids = sorted({coin_id for coin_id in ids if coin_id})
    for i in range(0, len(unique_ids), 200):
        chunk = unique_ids[i : i + 200]
        query = urllib.parse.urlencode(
            {
                "vs_currency": "usd",
                "ids": ",".join(chunk),
                "order": "market_cap_desc",
                "per_page": len(chunk),
                "page": 1,
                "sparkline": "false",
                "price_change_percentage": "24h,7d",
            },
            safe=",",
        )
        rows = fetch_json(f"https://api.coingecko.com/api/v3/coins/markets?{query}")
        if isinstance(rows, list):
            for row in rows:
                coin_id = str(row.get("id") or "")
                if coin_id:
                    markets[coin_id] = row
    return markets


def fetch_top20_markets() -> list[dict[str, Any]]:
    query = urllib.parse.urlencode(
        {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": 20,
            "page": 1,
            "sparkline": "false",
            "price_change_percentage": "24h,7d",
        },
        safe=",",
    )
    rows = fetch_json(f"https://api.coingecko.com/api/v3/coins/markets?{query}")
    return rows if isinstance(rows, list) else []


def fetch_binance_funding() -> dict[str, float]:
    try:
        rows = fetch_json("https://fapi.binance.com/fapi/v1/premiumIndex", timeout=20)
    except Exception:
        return {}
    if not isinstance(rows, list):
        return {}
    out: dict[str, float] = {}
    for row in rows:
        symbol = str(row.get("symbol") or "").upper()
        funding = to_num(row.get("lastFundingRate"))
        if symbol.endswith("USDT") and funding is not None:
            out[symbol.removesuffix("USDT")] = funding
    return out


def fetch_stablecoin_total() -> float | None:
    try:
        payload = fetch_json("https://stablecoins.llama.fi/stablecoins?includePrices=true", timeout=25)
    except Exception:
        return None
    assets = payload.get("peggedAssets") if isinstance(payload, dict) else None
    if not isinstance(assets, list):
        return None
    return sum(to_num((asset.get("circulating") or {}).get("peggedUSD")) or 0 for asset in assets if isinstance(asset, dict))


def top20_tags(symbol: str) -> list[str]:
    if symbol in {"USDT", "USDC", "DAI", "USDE", "FDUSD"}:
        return ["stablecoin"]
    if symbol in {"BTC", "ETH"}:
        return [symbol.lower(), "dominance"]
    if symbol in {"DOGE", "SHIB", "PEPE"}:
        return ["meme"]
    return []


def build_top20(markets: list[dict[str, Any]], funding: dict[str, float], as_of: str) -> dict[str, Any]:
    assets = []
    for idx, row in enumerate(markets, start=1):
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
                "tags": top20_tags(symbol),
            }
        )
    return {"as_of": as_of, "assets": assets}


def build_custom(existing: dict[str, Any], markets: dict[str, dict[str, Any]], funding: dict[str, float], stable_total: float | None, as_of: str) -> dict[str, Any]:
    assets = []
    for item in existing.get("assets") or []:
        if not isinstance(item, dict):
            continue
        symbol = str(item.get("ticker") or "").upper()
        coin_id = str(item.get("coingecko_id") or COINGECKO_ID_BY_SYMBOL.get(symbol) or "")
        market = markets.get(coin_id)
        updated = dict(item)
        if coin_id:
            updated["coingecko_id"] = coin_id
        if market:
            updated["name"] = market.get("name") or updated.get("name")
            updated["price"] = round_num(market.get("current_price"))
            updated["change_24h"] = round_num(market.get("price_change_percentage_24h"), 4)
            updated["market_cap"] = round_num(market.get("market_cap"), 2)
            updated["volume_24h"] = round_num(market.get("total_volume"), 2)
            updated["market_source"] = "coingecko"
        if symbol in funding:
            updated["funding"] = funding[symbol]
        assets.append(updated)

    payload = {"as_of": as_of, "assets": assets}
    payload["stablecoin_market_cap"] = stable_total if stable_total is not None else existing.get("stablecoin_market_cap")
    return payload


def main() -> int:
    existing_custom = json.loads(CUSTOM_OUT.read_text(encoding="utf-8"))
    ids = [COINGECKO_ID_BY_SYMBOL.get(str(item.get("ticker") or "").upper(), "") for item in existing_custom.get("assets") or [] if isinstance(item, dict)]
    ids += [str(item.get("coingecko_id") or "") for item in existing_custom.get("assets") or [] if isinstance(item, dict)]

    as_of = datetime.now(KST).isoformat(timespec="minutes")
    funding = fetch_binance_funding()
    markets_by_id = fetch_markets_by_id(ids)
    top20_markets = fetch_top20_markets()
    stable_total = fetch_stablecoin_total()

    CUSTOM_OUT.write_text(
        json.dumps(build_custom(existing_custom, markets_by_id, funding, stable_total, as_of), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    TOP20_OUT.write_text(json.dumps(build_top20(top20_markets, funding, as_of), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {CUSTOM_OUT}")
    print(f"updated {TOP20_OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
