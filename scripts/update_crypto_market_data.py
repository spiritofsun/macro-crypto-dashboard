#!/usr/bin/env python3
"""Update crypto global market metrics for the dashboard.

This script is intentionally non-blocking: if one provider is rate-limited,
it preserves the previous value and records the source error in _health.
"""

from __future__ import annotations

import json
import pathlib
import subprocess
import time
import urllib.request
from datetime import datetime, timezone
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "dashboard" / "data" / "crypto_market.json"
USER_AGENT = "project-mark-dashboard/1.0 (+https://spiritofsun.github.io/macro-crypto-dashboard/)"


def read_existing() -> dict[str, Any]:
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        return {}


def fetch_text(url: str, timeout: int = 20, attempts: int = 2) -> str:
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
                time.sleep(1.5 * attempt)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")
    except Exception as exc:
        raise RuntimeError(f"fetch failed: {url}: {exc}") from last_error


def fetch_json(url: str, timeout: int = 20, attempts: int = 2) -> Any:
    return json.loads(fetch_text(url, timeout=timeout, attempts=attempts))


def safe_fetch(name: str, url: str, errors: list[str], timeout: int = 20, attempts: int = 2) -> dict[str, Any] | None:
    try:
        payload = fetch_json(url, timeout=timeout, attempts=attempts)
        return payload if isinstance(payload, dict) else None
    except Exception as exc:
        errors.append(f"{name}: {exc}")
        return None


def safe_fetch_any(name: str, url: str, errors: list[str], timeout: int = 20, attempts: int = 2) -> Any | None:
    try:
        return fetch_json(url, timeout=timeout, attempts=attempts)
    except Exception as exc:
        errors.append(f"{name}: {exc}")
        return None


def to_num(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def first_num(*values: Any) -> float | None:
    for value in values:
        num = to_num(value)
        if num is not None:
            return num
    return None


def extract_upbit_btc_krw(payload: Any) -> float | None:
    if not isinstance(payload, list) or not payload:
        return None
    row = payload[0]
    return to_num(row.get("trade_price")) if isinstance(row, dict) else None


def extract_bithumb_btc_krw(payload: Any) -> float | None:
    data = payload.get("data") if isinstance(payload, dict) else None
    return to_num(data.get("closing_price")) if isinstance(data, dict) else None


def build_defillama_chains(payload: Any, previous: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, list):
        return previous or {}

    chains: list[dict[str, Any]] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        tvl = to_num(row.get("tvl"))
        if tvl is None or tvl <= 0:
            continue
        chains.append({
            "name": row.get("name") or row.get("chain"),
            "tvl_usd": tvl,
            "change_1d": to_num(row.get("change_1d")),
            "change_7d": to_num(row.get("change_7d")),
        })

    chains.sort(key=lambda item: item["tvl_usd"], reverse=True)
    return {
        "source": "DefiLlama chains",
        "chain_count": len(chains),
        "total_tvl_usd": sum(item["tvl_usd"] for item in chains),
        "top_chains": chains[:10],
    }


def main() -> int:
    existing = read_existing()
    errors: list[str] = []

    cg = safe_fetch("coingecko_global", "https://api.coingecko.com/api/v3/global", errors, attempts=3)
    cp_global = safe_fetch("coinpaprika_global", "https://api.coinpaprika.com/v1/global", errors, attempts=2)
    btc_simple = safe_fetch("coingecko_btc", "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", errors, attempts=2)
    cp_btc = safe_fetch("coinpaprika_btc", "https://api.coinpaprika.com/v1/tickers/btc-bitcoin", errors, attempts=2)
    coinbase_btc = safe_fetch("coinbase_btc", "https://api.coinbase.com/v2/prices/BTC-USD/spot", errors, attempts=2)
    fng = safe_fetch("fear_greed", "https://api.alternative.me/fng/?limit=1&format=json", errors, attempts=2)
    stables = safe_fetch("defillama_stablecoins", "https://stablecoins.llama.fi/stablecoins?includePrices=true", errors, timeout=25, attempts=2)
    chains_payload = safe_fetch_any("defillama_chains", "https://api.llama.fi/v2/chains", errors, timeout=25, attempts=2)
    fx = safe_fetch("open_er_usdkrw", "https://open.er-api.com/v6/latest/USD", errors, attempts=2)
    upbit_btc = safe_fetch_any("upbit_btc_krw", "https://api.upbit.com/v1/ticker?markets=KRW-BTC", errors, attempts=2)
    bithumb_btc = safe_fetch("bithumb_btc_krw", "https://api.bithumb.com/public/ticker/BTC_KRW", errors, attempts=2)

    prev_global = existing.get("global") if isinstance(existing.get("global"), dict) else {}
    prev_fng = existing.get("fear_greed") if isinstance(existing.get("fear_greed"), dict) else {}
    prev_premium = existing.get("coinbase_premium") if isinstance(existing.get("coinbase_premium"), dict) else {}
    prev_stables = existing.get("stablecoins") if isinstance(existing.get("stablecoins"), dict) else {}
    prev_krw = existing.get("krw_market") if isinstance(existing.get("krw_market"), dict) else {}
    prev_chains = existing.get("defillama_chains") if isinstance(existing.get("defillama_chains"), dict) else {}

    cg_data = cg.get("data") if isinstance(cg, dict) and isinstance(cg.get("data"), dict) else {}
    cp_data = cp_global if isinstance(cp_global, dict) else {}
    percentages = cg_data.get("market_cap_percentage") if isinstance(cg_data.get("market_cap_percentage"), dict) else {}
    market_caps = cg_data.get("total_market_cap") if isinstance(cg_data.get("total_market_cap"), dict) else {}

    stable_assets = stables.get("peggedAssets") if isinstance(stables, dict) and isinstance(stables.get("peggedAssets"), list) else []
    stable_total = sum(to_num((asset.get("circulating") or {}).get("peggedUSD")) or 0 for asset in stable_assets if isinstance(asset, dict)) if stable_assets else None
    usdt = next((asset for asset in stable_assets if str(asset.get("symbol") or "").upper() == "USDT"), {})
    usdc = next((asset for asset in stable_assets if str(asset.get("symbol") or "").upper() == "USDC"), {})
    usdt_market_cap = to_num((usdt.get("circulating") or {}).get("peggedUSD")) if usdt else None
    usdc_market_cap = to_num((usdc.get("circulating") or {}).get("peggedUSD")) if usdc else None

    fg_row = (fng.get("data") or [{}])[0] if isinstance(fng, dict) and isinstance(fng.get("data"), list) else {}
    cg_btc_price = to_num(((btc_simple or {}).get("bitcoin") or {}).get("usd"))
    cp_btc_price = to_num(((cp_btc or {}).get("quotes") or {}).get("USD", {}).get("price")) if isinstance(cp_btc, dict) else None
    global_btc_price = first_num(cg_btc_price, cp_btc_price, prev_premium.get("coingecko_btc_usd"), prev_krw.get("global_btc_usd"))
    coinbase_btc_price = to_num(((coinbase_btc or {}).get("data") or {}).get("amount"))
    coinbase_premium = (
        ((coinbase_btc_price - global_btc_price) / global_btc_price * 100)
        if coinbase_btc_price is not None and global_btc_price not in (None, 0)
        else None
    )
    usdkrw = to_num(((fx or {}).get("rates") or {}).get("KRW")) if isinstance(fx, dict) else None
    upbit_btc_krw = extract_upbit_btc_krw(upbit_btc)
    bithumb_btc_krw = extract_bithumb_btc_krw(bithumb_btc)
    krw_btc_price = first_num(upbit_btc_krw, bithumb_btc_krw)
    kimchi_premium = (
        ((krw_btc_price / usdkrw - global_btc_price) / global_btc_price * 100)
        if krw_btc_price is not None and usdkrw not in (None, 0) and global_btc_price not in (None, 0)
        else None
    )
    total_market_cap = first_num(market_caps.get("usd"), cp_data.get("market_cap_usd"), prev_global.get("total_market_cap_usd"))
    btc_dominance = first_num(percentages.get("btc"), cp_data.get("bitcoin_dominance_percentage"), prev_global.get("btc_dominance"))
    global_source = "CoinGecko global" if cg else "CoinPaprika global" if cp_global else prev_global.get("source", "previous")
    defi_chains = build_defillama_chains(chains_payload, prev_chains)

    payload = {
        "as_of": datetime.now(timezone.utc).isoformat(),
        "global": {
            "source": global_source,
            "total_market_cap_usd": total_market_cap,
            "btc_dominance": btc_dominance,
            "eth_dominance": first_num(percentages.get("eth"), prev_global.get("eth_dominance")),
            "usdt_dominance_market": first_num(percentages.get("usdt"), prev_global.get("usdt_dominance_market")),
        },
        "fear_greed": {
            "source": "alternative.me" if fng else prev_fng.get("source", "previous"),
            "value": to_num(fg_row.get("value")) if fng else prev_fng.get("value"),
            "classification": fg_row.get("value_classification") if fng else prev_fng.get("classification"),
            "timestamp": fg_row.get("timestamp") if fng else prev_fng.get("timestamp"),
        },
        "coinbase_premium": {
            "source": "Coinbase BTC spot vs global BTC reference" if coinbase_premium is not None else prev_premium.get("source", "previous"),
            "pct": coinbase_premium if coinbase_premium is not None else prev_premium.get("pct"),
            "coinbase_btc_usd": coinbase_btc_price if coinbase_btc_price is not None else prev_premium.get("coinbase_btc_usd"),
            "coingecko_btc_usd": cg_btc_price if cg_btc_price is not None else prev_premium.get("coingecko_btc_usd"),
            "reference_btc_usd": global_btc_price,
        },
        "krw_market": {
            "source": "Upbit/Bithumb public + open.er-api" if kimchi_premium is not None else prev_krw.get("source", "previous"),
            "kimchi_premium_pct": kimchi_premium if kimchi_premium is not None else prev_krw.get("kimchi_premium_pct"),
            "upbit_btc_krw": upbit_btc_krw if upbit_btc_krw is not None else prev_krw.get("upbit_btc_krw"),
            "bithumb_btc_krw": bithumb_btc_krw if bithumb_btc_krw is not None else prev_krw.get("bithumb_btc_krw"),
            "usdkrw": usdkrw if usdkrw is not None else prev_krw.get("usdkrw"),
            "global_btc_usd": global_btc_price if global_btc_price is not None else prev_krw.get("global_btc_usd"),
        },
        "stablecoins": {
            "source": "DefiLlama stablecoins" if stable_total is not None else prev_stables.get("source", "previous"),
            "total_market_cap_usd": stable_total if stable_total is not None else prev_stables.get("total_market_cap_usd"),
            "usdt_market_cap_usd": usdt_market_cap if usdt_market_cap is not None else prev_stables.get("usdt_market_cap_usd"),
            "usdc_market_cap_usd": usdc_market_cap if usdc_market_cap is not None else prev_stables.get("usdc_market_cap_usd"),
            "usdt_dominance": (usdt_market_cap / stable_total * 100) if stable_total and usdt_market_cap is not None else prev_stables.get("usdt_dominance"),
            "usdc_dominance": (usdc_market_cap / stable_total * 100) if stable_total and usdc_market_cap is not None else prev_stables.get("usdc_dominance"),
        },
        "defillama_chains": defi_chains,
        "_health": {
            "status": "ok" if not errors else "warn",
            "errors": errors,
            "free_sources": [
                "CoinGecko",
                "CoinPaprika",
                "Coinbase",
                "alternative.me",
                "DefiLlama",
                "Upbit",
                "Bithumb",
                "open.er-api",
            ],
        },
    }

    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated {OUT} status={payload['_health']['status']}")
    if errors:
        print("warnings:")
        for error in errors:
            print(f"- {error}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
