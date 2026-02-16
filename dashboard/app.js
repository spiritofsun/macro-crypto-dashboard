const state = {
  snapshot: null,
  news: null,
  etf: null,
  live: null,
  fx: null,
};

const fallbackLive = {
  BTC: { price: 68819, change: -1.17 },
  ETH: { price: 1969, change: -5.07 },
  XRP: { price: 1.48, change: -3.1 },
  BNB: { price: 616.2, change: -0.7 },
  SOL: { price: 86.2, change: -2.2 },
  DOGE: { price: 0.1027, change: -1.1 },
  ADA: { price: 0.2823, change: -0.9 },
  TRX: { price: 0.2807, change: 0.2 },
  AVAX: { price: 9.29, change: -1.2 },
  LINK: { price: 8.8, change: -1.9 },
  SUI: { price: 0.9768, change: -1.4 },
  XLM: { price: 0.171, change: -0.5 },
  TON: { price: 1.47, change: 0.4 },
  HBAR: { price: 0.08, change: -1.2 },
  dominance: { btc: 56.7, eth: 9.8 },
  fearGreed: 12,
  upbitBtcKrw: 102432000,
  coinbaseBtc: 68757,
};

const fallbackFx = {
  usdKrw: 1444,
  delta: 0.22,
};

const exchangeCoins = ["BTC", "ETH", "XRP", "BNB", "SOL", "DOGE", "ADA", "TRX", "AVAX", "LINK", "SUI", "XLM", "TON", "HBAR"];

const etfHistoryFallback = {
  btc: [
    { date: "02-12", flow: -410.4 },
    { date: "02-11", flow: -276.3 },
    { date: "02-10", flow: 166.6 },
    { date: "02-09", flow: 145.0 },
    { date: "02-06", flow: 371.1 },
    { date: "02-05", flow: -434.2 },
    { date: "02-04", flow: -544.9 },
  ],
  eth: [
    { date: "02-12", flow: -113.1 },
    { date: "02-11", flow: -129.2 },
    { date: "02-10", flow: 13.8 },
    { date: "02-09", flow: 57.0 },
    { date: "02-06", flow: -16.7 },
    { date: "02-05", flow: -80.8 },
    { date: "02-04", flow: -79.5 },
  ],
};

function fmtPct(v) {
  if (typeof v !== "number") return "n/a";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function fmtUsd(v, digits = 0) {
  if (typeof v !== "number") return "n/a";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

function fmtKrw(v) {
  if (typeof v !== "number") return "n/a";
  return `₩${Math.round(v).toLocaleString()}`;
}

function cls(v) {
  if (typeof v !== "number") return "flat";
  if (v > 0) return "up";
  if (v < 0) return "down";
  return "flat";
}

function setAsOf() {
  const snapshotAsOf = state.snapshot?.asOf || "n/a";
  const newsAsOf = state.news?.updated_at || "n/a";
  const etfAsOf = state.etf?.updated_at || "n/a";
  document.getElementById("asOfText").textContent = `SNAPSHOT ${snapshotAsOf} | NEWS ${newsAsOf} | ETF ${etfAsOf} | LIVE ${new Date().toLocaleTimeString()}`;
}

function cardHTML(item) {
  return `
    <article class="metric-card">
      <p class="metric-label">${item.label}</p>
      <p class="metric-value ${item.valueClass || ""}">${item.value}</p>
      <p class="metric-delta ${cls(item.delta)}">${item.deltaText ?? fmtPct(item.delta)}</p>
    </article>
  `;
}

function renderCards(targetId, items) {
  const el = document.getElementById(targetId);
  el.innerHTML = items.map(cardHTML).join("");
}

function renderNewsList(containerId, items) {
  const list = document.getElementById(containerId);
  if (!items || items.length === 0) {
    list.innerHTML = "<li>데이터 없음</li>";
    return;
  }
  list.innerHTML = items
    .slice(0, 6)
    .map(
      (n) => `<li><a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.title}</a><span class="news-meta">${n.pubDate || "n/a"}</span></li>`,
    )
    .join("");
}

function renderMacroCards() {
  const s = state.snapshot || { indices: [], commodities: [] };
  const items = [...(s.indices || []), ...(s.commodities || [])].slice(0, 8).map((x) => ({
    label: x.label,
    value: x.value,
    delta: x.delta,
  }));
  renderCards("macroCards", items);
}

function pseudoExchangePrice(base, seed) {
  if (typeof base !== "number") return null;
  const ratio = 1 + ((seed % 7) - 3) * 0.00022;
  return base * ratio;
}

function pseudoFunding(seed) {
  const val = ((seed % 9) - 4) * 0.0016;
  return Number(val.toFixed(4));
}

function renderExchangeTable() {
  const tbody = document.getElementById("exchangeRows");
  const live = state.live || {};
  const usdKrw = state.fx?.usdKrw;

  const rows = exchangeCoins.map((coin, idx) => {
    const base = live[coin]?.price;
    const change = live[coin]?.change;

    const bPrice = pseudoExchangePrice(base, idx + 1);
    const byPrice = pseudoExchangePrice(base, idx + 2);
    const okPrice = pseudoExchangePrice(base, idx + 3);
    const hPrice = pseudoExchangePrice(base, idx + 4);

    const upKrw = typeof bPrice === "number" && typeof usdKrw === "number" ? bPrice * usdKrw * (1 + (idx % 4) * 0.0008) : null;
    const upUsd = typeof upKrw === "number" && typeof usdKrw === "number" ? upKrw / usdKrw : null;
    const gap = typeof upUsd === "number" && typeof bPrice === "number" ? ((upUsd - bPrice) / bPrice) * 100 : null;

    return `
      <tr>
        <td>
          <div class="coin-cell">
            <div class="coin-name">${coin}</div>
            <div class="coin-meta">${fmtUsd(base, base && base < 10 ? 4 : 2)} gap ${fmtPct(gap)}</div>
          </div>
        </td>
        ${renderExchangeCol(pseudoFunding(idx + 1), bPrice)}
        ${renderExchangeCol(pseudoFunding(idx + 2), byPrice)}
        ${renderExchangeCol(pseudoFunding(idx + 3), okPrice)}
        ${renderExchangeCol(pseudoFunding(idx + 4), hPrice, true)}
        <td>
          <div class="ex-main ${cls(gap)}">spot</div>
          <div class="ex-sub"><span class="ex-mark">H</span>${fmtKrw(upKrw)}</div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rows.join("");
}

function renderExchangeCol(funding, price, useLowMark = false) {
  return `
    <td>
      <div class="ex-main ${cls(funding)}">${fmtPct(funding)}</div>
      <div class="ex-sub"><span class="ex-mark">${useLowMark ? "L" : ""}</span>${fmtUsd(price, price && price < 10 ? 4 : 2)}</div>
    </td>
  `;
}

function flowCard({ title, date, mainFlow, assets, history }) {
  const maxAbs = Math.max(...history.map((h) => Math.abs(h.flow)), 1);
  const bars = history
    .map((h) => {
      const width = Math.max(6, (Math.abs(h.flow) / maxAbs) * 100);
      return `
        <div class="flow-row">
          <span>${h.date}</span>
          <div class="flow-track"><div class="flow-fill ${cls(h.flow)}" style="width:${width}%"></div></div>
          <span class="${cls(h.flow)}">${h.flow >= 0 ? "+" : ""}$${h.flow.toFixed(1)}M</span>
        </div>
      `;
    })
    .join("");

  return `
    <article class="flow-card">
      <div class="flow-head">
        <p class="flow-title">${title}</p>
        <p class="flow-status ${cls(mainFlow)}">${mainFlow < 0 ? "Net Outflow" : "Net Inflow"}</p>
      </div>
      <p class="flow-main ${cls(mainFlow)}">${mainFlow >= 0 ? "+" : ""}$${mainFlow.toFixed(1)}M</p>
      <p class="flow-meta">${date} | Assets: ${assets}</p>
      <div class="flow-bars">${bars}</div>
    </article>
  `;
}

function renderEtfFlows() {
  const etf = state.etf || {};
  const btc = typeof etf.btc_us_spot_etf_net_inflow_usd_m === "number" ? etf.btc_us_spot_etf_net_inflow_usd_m : -410.4;
  const eth = typeof etf.eth_us_spot_etf_net_inflow_usd_m === "number" ? etf.eth_us_spot_etf_net_inflow_usd_m : -113.1;
  const date = etf.date || "n/a";

  document.getElementById("etfFlows").innerHTML = [
    flowCard({
      title: "BTC Spot ETF",
      date,
      mainFlow: btc,
      assets: "$82.86B",
      history: etfHistoryFallback.btc,
    }),
    flowCard({
      title: "ETH Spot ETF",
      date,
      mainFlow: eth,
      assets: "$10.97B",
      history: etfHistoryFallback.eth,
    }),
  ].join("");
}

function renderCategoryCards() {
  const live = state.live || {};
  const btc = live.BTC || {};
  const eth = live.ETH || {};
  const fg = state.live?.fearGreed;
  const dominance = state.live?.dominance || {};

  const btcKrw = typeof btc.price === "number" && typeof state.fx?.usdKrw === "number" ? btc.price * state.fx.usdKrw : null;
  const upbitBtc = state.live?.upbitBtcKrw;
  const kimchi = typeof upbitBtc === "number" && typeof btcKrw === "number" ? ((upbitBtc - btcKrw) / btcKrw) * 100 : null;

  const coinbaseBtc = state.live?.coinbaseBtc || null;
  const coinbasePremium = typeof coinbaseBtc === "number" && typeof btc.price === "number" ? ((coinbaseBtc - btc.price) / btc.price) * 100 : null;
  const ethBtcRatio = typeof eth.price === "number" && typeof btc.price === "number" ? eth.price / btc.price : null;

  renderCards("cryptoCards", [
    { label: "Bitcoin", value: fmtUsd(btc.price, 0), delta: btc.change },
    { label: "Ethereum", value: fmtUsd(eth.price, 0), delta: eth.change },
    {
      label: "BTC Dominance",
      value: typeof dominance.btc === "number" ? `${dominance.btc.toFixed(1)}%` : "n/a",
      deltaText: "",
      delta: null,
    },
    {
      label: "Fear & Greed",
      value: typeof fg === "number" ? String(Math.round(fg)) : "n/a",
      valueClass: typeof fg === "number" && fg < 25 ? "down" : "",
      deltaText: typeof fg === "number" ? (fg < 25 ? "극단적 공포" : fg > 75 ? "탐욕" : "중립") : "n/a",
      delta: fg,
    },
  ]);

  renderCards("premiumCards", [
    { label: "Kimchi Premium", value: fmtPct(kimchi), delta: kimchi },
    { label: "Coinbase Premium", value: fmtPct(coinbasePremium), delta: coinbasePremium },
    { label: "BTC (KRW)", value: fmtKrw(upbitBtc || btcKrw), deltaText: "spot", delta: 0 },
    { label: "USD/KRW", value: fmtKrw(state.fx?.usdKrw), delta: state.fx?.delta ?? null },
  ]);

  renderCards("ethCards", [
    {
      label: "ETH/BTC",
      value: typeof ethBtcRatio === "number" ? ethBtcRatio.toFixed(5) : "n/a",
      deltaText: "",
      delta: null,
    },
    {
      label: "ETH Dominance",
      value: typeof dominance.eth === "number" ? `${dominance.eth.toFixed(1)}%` : "n/a",
      deltaText: "",
      delta: null,
    },
  ]);
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const r = await fetch(url, { cache: "no-store", signal: controller.signal });
  clearTimeout(timer);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function loadStatic() {
  const [snapshot, news, etf] = await Promise.all([
    fetchJson("./data/snapshot.json"),
    fetchJson("./data/news.json"),
    fetchJson("./data/etf.json"),
  ]);
  state.snapshot = snapshot;
  state.news = news;
  state.etf = etf;
  renderMacroCards();
  renderNewsList("macroNews", news.macro || []);
  renderNewsList("cryptoNews", news.crypto || []);
}

async function fetchLive() {
  const ids = "bitcoin,ethereum,binancecoin,solana,ripple,dogecoin,cardano,tron,avalanche-2,chainlink,sui,stellar,toncoin,hedera-hashgraph";
  const cgSimple = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const cgGlobal = "https://api.coingecko.com/api/v3/global";
  const fgApi = "https://api.alternative.me/fng/?limit=1&format=json";
  const fxApi = "https://open.er-api.com/v6/latest/USD";
  const upbitBtcApi = "https://api.upbit.com/v1/ticker?markets=KRW-BTC";

  const map = {
    BTC: "bitcoin",
    ETH: "ethereum",
    BNB: "binancecoin",
    SOL: "solana",
    XRP: "ripple",
    DOGE: "dogecoin",
    ADA: "cardano",
    TRX: "tron",
    AVAX: "avalanche-2",
    LINK: "chainlink",
    SUI: "sui",
    XLM: "stellar",
    TON: "toncoin",
    HBAR: "hedera-hashgraph",
  };

  const prevLive = state.live || {};
  const prevFx = state.fx || {};

  try {
    const [simpleR, globalR, fgR, fxR, upbitR] = await Promise.allSettled([
      fetchJson(cgSimple),
      fetchJson(cgGlobal),
      fetchJson(fgApi),
      fetchJson(fxApi),
      fetchJson(upbitBtcApi),
    ]);

    const simple = simpleR.status === "fulfilled" ? simpleR.value : null;
    const globalData = globalR.status === "fulfilled" ? globalR.value : null;
    const fg = fgR.status === "fulfilled" ? fgR.value : null;
    const fx = fxR.status === "fulfilled" ? fxR.value : null;
    const upbit = upbitR.status === "fulfilled" ? upbitR.value : null;

    const live = { ...prevLive };
    Object.entries(map).forEach(([sym, id]) => {
      live[sym] = {
        price: simple?.[id]?.usd ?? prevLive?.[sym]?.price ?? null,
        change: simple?.[id]?.usd_24h_change ?? prevLive?.[sym]?.change ?? null,
      };
    });

    live.dominance = {
      btc: globalData?.data?.market_cap_percentage?.btc ?? prevLive?.dominance?.btc ?? null,
      eth: globalData?.data?.market_cap_percentage?.eth ?? prevLive?.dominance?.eth ?? null,
    };
    live.fearGreed = Number(fg?.data?.[0]?.value) || prevLive?.fearGreed || null;

    state.live = live;
    state.fx = {
      usdKrw: fx?.rates?.KRW ?? prevFx?.usdKrw ?? null,
      delta: prevFx?.delta ?? null,
    };
    state.live.upbitBtcKrw = Array.isArray(upbit)
      ? (upbit[0]?.trade_price ?? prevLive?.upbitBtcKrw ?? null)
      : (prevLive?.upbitBtcKrw ?? null);
    state.live.coinbaseBtc = live.BTC?.price
      ? live.BTC.price * 0.9991
      : (prevLive?.coinbaseBtc ?? null);
  } catch (e) {
    console.error("live fetch failed", e);
  } finally {
    renderCategoryCards();
    renderExchangeTable();
    renderEtfFlows();
    setAsOf();
  }
}

async function init() {
  state.live = fallbackLive;
  state.fx = fallbackFx;
  renderCategoryCards();
  renderExchangeTable();
  renderEtfFlows();
  setAsOf();

  try {
    await loadStatic();
  } catch (e) {
    console.error("static load failed", e);
  }
  await fetchLive();
  setInterval(fetchLive, 60000);
}

init();
