const TTL_SEC = 60;
const UA = "project-mark-worker/1.0";

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "user-agent": UA },
    cf: { cacheTtl: TTL_SEC, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pctFromBybit(v) {
  const n = toNum(v);
  if (n === null) return null;
  // Bybit price24hPcnt is decimal ratio (0.01 = 1%)
  return n * 100;
}

function pctFromOhlc(last, open) {
  const l = toNum(last);
  const o = toNum(open);
  if (l === null || o === null || o === 0) return null;
  return ((l - o) / o) * 100;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${TTL_SEC}, s-maxage=${TTL_SEC}, stale-while-revalidate=30`,
      "access-control-allow-origin": "*",
    },
  });
}

function normalizeTicker(raw) {
  if (!raw) return null;
  const t = String(raw).trim().toUpperCase();
  if (!/^[A-Z0-9]+$/.test(t)) return null;
  return t;
}

async function fetchBinanceMap(tickers) {
  const symbols = tickers.map((t) => `${t}USDT`);
  if (symbols.length === 0) return new Map();
  const encoded = encodeURIComponent(JSON.stringify(symbols));
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encoded}`;
  const rows = await fetchJson(url);
  const map = new Map();

  if (!Array.isArray(rows)) return map;
  for (const row of rows) {
    const symbol = String(row?.symbol || "");
    const base = symbol.endsWith("USDT") ? symbol.slice(0, -4) : null;
    if (!base) continue;
    map.set(base, {
      price: toNum(row?.lastPrice),
      change_24h: toNum(row?.priceChangePercent),
      source: "binance",
      pair: symbol,
    });
  }
  return map;
}

async function fetchBybitMap() {
  const url = "https://api.bybit.com/v5/market/tickers?category=spot";
  const data = await fetchJson(url);
  const list = data?.result?.list;
  const map = new Map();
  if (!Array.isArray(list)) return map;

  for (const row of list) {
    const symbol = String(row?.symbol || "");
    const base = symbol.endsWith("USDT") ? symbol.slice(0, -4) : null;
    if (!base) continue;
    map.set(base, {
      price: toNum(row?.lastPrice),
      change_24h: pctFromBybit(row?.price24hPcnt),
      source: "bybit",
      pair: symbol,
    });
  }

  return map;
}

async function fetchOkxMap() {
  const url = "https://www.okx.com/api/v5/market/tickers?instType=SPOT";
  const data = await fetchJson(url);
  const list = data?.data;
  const map = new Map();
  if (!Array.isArray(list)) return map;

  for (const row of list) {
    const instId = String(row?.instId || "");
    if (!instId.endsWith("-USDT")) continue;
    const base = instId.replace("-USDT", "");
    map.set(base, {
      price: toNum(row?.last),
      change_24h: pctFromOhlc(row?.last, row?.open24h),
      source: "okx",
      pair: instId,
    });
  }

  return map;
}

async function handleLive() {
  const ids = "bitcoin,ethereum,solana";
  const binance24h =
    "https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D";
  const cgSimple = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const cgGlobal = "https://api.coingecko.com/api/v3/global";
  const fgApi = "https://api.alternative.me/fng/?limit=1&format=json";
  const fxApi = "https://open.er-api.com/v6/latest/USD";
  const upbitBtcApi = "https://api.upbit.com/v1/ticker?markets=KRW-BTC";
  const coinbaseBtcApi = "https://api.coinbase.com/v2/prices/BTC-USD/spot";

  const [binanceR, simpleR, globalR, fgR, fxR, upbitR, coinbaseR] = await Promise.allSettled([
    fetchJson(binance24h),
    fetchJson(cgSimple),
    fetchJson(cgGlobal),
    fetchJson(fgApi),
    fetchJson(fxApi),
    fetchJson(upbitBtcApi),
    fetchJson(coinbaseBtcApi),
  ]);

  const binance = binanceR.status === "fulfilled" && Array.isArray(binanceR.value) ? binanceR.value : [];
  const ticker = Object.fromEntries(binance.map((row) => [row?.symbol, row]));

  const simple = simpleR.status === "fulfilled" ? simpleR.value : null;
  const globalData = globalR.status === "fulfilled" ? globalR.value : null;
  const fg = fgR.status === "fulfilled" ? fgR.value : null;
  const fx = fxR.status === "fulfilled" ? fxR.value : null;
  const upbit = upbitR.status === "fulfilled" ? upbitR.value : null;
  const coinbase = coinbaseR.status === "fulfilled" ? coinbaseR.value : null;

  const btcBinancePrice = toNum(ticker?.BTCUSDT?.lastPrice);
  const btcBinancePct = toNum(ticker?.BTCUSDT?.priceChangePercent);
  const ethBinancePrice = toNum(ticker?.ETHUSDT?.lastPrice);
  const ethBinancePct = toNum(ticker?.ETHUSDT?.priceChangePercent);
  const solBinancePrice = toNum(ticker?.SOLUSDT?.lastPrice);
  const solBinancePct = toNum(ticker?.SOLUSDT?.priceChangePercent);

  const btcCgPrice = toNum(simple?.bitcoin?.usd);
  const btcCgPct = toNum(simple?.bitcoin?.usd_24h_change);
  const ethCgPrice = toNum(simple?.ethereum?.usd);
  const ethCgPct = toNum(simple?.ethereum?.usd_24h_change);
  const solCgPrice = toNum(simple?.solana?.usd);
  const solCgPct = toNum(simple?.solana?.usd_24h_change);
  const coinbaseBtcSpot = toNum(coinbase?.data?.amount);
  const coinbasePremiumPct =
    coinbaseBtcSpot !== null && btcBinancePrice !== null && btcBinancePrice !== 0
      ? ((coinbaseBtcSpot - btcBinancePrice) / btcBinancePrice) * 100
      : null;

  return json({
    as_of: new Date().toISOString(),
    btc: {
      price_usd: btcBinancePrice ?? btcCgPrice,
      change_24h_pct: btcBinancePct ?? btcCgPct,
      upbit_krw: Array.isArray(upbit) ? upbit[0]?.trade_price ?? null : null,
      source: btcBinancePrice !== null ? "binance" : "coingecko",
    },
    eth: {
      price_usd: ethBinancePrice ?? ethCgPrice,
      change_24h_pct: ethBinancePct ?? ethCgPct,
      source: ethBinancePrice !== null ? "binance" : "coingecko",
    },
    sol: {
      price_usd: solBinancePrice ?? solCgPrice,
      change_24h_pct: solBinancePct ?? solCgPct,
      source: solBinancePrice !== null ? "binance" : "coingecko",
    },
    dominance: {
      btc: globalData?.data?.market_cap_percentage?.btc ?? null,
      eth: globalData?.data?.market_cap_percentage?.eth ?? null,
      source: "coingecko",
    },
    fear_greed: Number(fg?.data?.[0]?.value) || null,
    fx: {
      usdkrw: fx?.rates?.KRW ?? null,
    },
    coinbase: {
      btc_usd: coinbaseBtcSpot,
      premium_pct: coinbasePremiumPct,
      source: coinbaseBtcSpot !== null ? "coinbase+binance" : null,
    },
  });
}

async function handleCryptoPrices(url) {
  const raw = (url.searchParams.get("tickers") || "").split(",");
  const tickers = [...new Set(raw.map(normalizeTicker).filter(Boolean))];
  if (tickers.length === 0) {
    return json({ as_of: new Date().toISOString(), prices: {}, sources: ["binance", "bybit", "okx"] });
  }

  const [binanceR, bybitR, okxR] = await Promise.allSettled([
    fetchBinanceMap(tickers),
    fetchBybitMap(),
    fetchOkxMap(),
  ]);

  const binance = binanceR.status === "fulfilled" ? binanceR.value : new Map();
  const bybit = bybitR.status === "fulfilled" ? bybitR.value : new Map();
  const okx = okxR.status === "fulfilled" ? okxR.value : new Map();

  const prices = {};
  for (const t of tickers) {
    const v = binance.get(t) || bybit.get(t) || okx.get(t) || null;
    prices[t] = v
      ? {
          price: v.price,
          change_24h: v.change_24h,
          source: v.source,
          pair: v.pair,
        }
      : {
          price: null,
          change_24h: null,
          source: null,
          pair: null,
        };
  }

  return json({
    as_of: new Date().toISOString(),
    prices,
    sources: ["binance", "bybit", "okx"],
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
    }

    if (url.pathname === "/api/live") {
      try {
        return await handleLive();
      } catch (error) {
        return json({ error: String(error) }, 502);
      }
    }

    if (url.pathname === "/api/crypto-prices") {
      try {
        return await handleCryptoPrices(url);
      } catch (error) {
        return json({ error: String(error) }, 502);
      }
    }

    if (url.pathname === "/health") {
      return json({ ok: true, ts: new Date().toISOString() });
    }

    return json({ error: "not found" }, 404);
  },
};
