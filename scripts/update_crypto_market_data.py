#!/usr/bin/env python3
"""Update crypto global market metrics for the dashboard."""

from __future__ import annotations

import json
import pathlib
import urllib.request
from datetime import datetime, timezone
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "dashboard" / "data" / "crypto_market.json"
USER_AGENT = "project-mark-dashboard/1.0"


def fetch_json(url: str, timeout: int = 20) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def to_num(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def main() -> int:
    cg = fetch_json("https://api.coingecko.com/api/v3/global")
    fng = fetch_json("https://api.alternative.me/fng/?limit=1&format=json")
    stables = fetch_json("https://stablecoins.llama.fi/stablecoins?includePrices=true")

    cg_data = cg.get("data") if isinstance(cg.get("data"), dict) else {}
    percentages = cg_data.get("market_cap_percentage") if isinstance(cg_data.get("market_cap_percentage"), dict) else {}
    market_caps = cg_data.get("total_market_cap") if isinstance(cg_data.get("total_market_cap"), dict) else {}

    stable_assets = stables.get("peggedAssets") if isinstance(stables.get("peggedAssets"), list) else []
    stable_total = sum(to_num((asset.get("circulating") or {}).get("peggedUSD")) or 0 for asset in stable_assets if isinstance(asset, dict))
    usdt = next((asset for asset in stable_assets if str(asset.get("symbol") or "").upper() == "USDT"), {})
    usdc = next((asset for asset in stable_assets if str(asset.get("symbol") or "").upper() == "USDC"), {})
    usdt_market_cap = to_num((usdt.get("circulating") or {}).get("peggedUSD"))
    usdc_market_cap = to_num((usdc.get("circulating") or {}).get("peggedUSD"))

    fg_row = (fng.get("data") or [{}])[0] if isinstance(fng.get("data"), list) else {}

    payload = {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "global": {
            "source": "CoinGecko global",
            "total_market_cap_usd": to_num(market_caps.get("usd")),
            "btc_dominance": to_num(percentages.get("btc")),
            "eth_dominance": to_num(percentages.get("eth")),
            "usdt_dominance_market": to_num(percentages.get("usdt")),
        },
        "fear_greed": {
            "source": "alternative.me",
            "value": to_num(fg_row.get("value")),
            "classification": fg_row.get("value_classification"),
            "timestamp": fg_row.get("timestamp"),
        },
        "stablecoins": {
            "source": "DefiLlama stablecoins",
            "total_market_cap_usd": stable_total,
            "usdt_market_cap_usd": usdt_market_cap,
            "usdc_market_cap_usd": usdc_market_cap,
            "usdt_dominance": (usdt_market_cap / stable_total * 100) if stable_total and usdt_market_cap is not None else None,
            "usdc_dominance": (usdc_market_cap / stable_total * 100) if stable_total and usdc_market_cap is not None else None,
        },
    }

    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
