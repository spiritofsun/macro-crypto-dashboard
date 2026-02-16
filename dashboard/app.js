const state = {
  snapshot: null,
  news: null,
  etf: null,
  live: null,
  fx: null,
  markets: [],
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

const fallbackMacro = {
  us10y: { value: 4.18, delta: 0.97 },
  us2y: { value: 3.47, delta: 0.58 },
  dxy: { value: 98.43, delta: 0.16 },
  sofr: { value: 3.64, delta: 0 },
  iorb: { value: 3.65, delta: 0 },
  dow: { value: 42510, delta: null },
  russell2000: { value: 2320, delta: null },
  wti: { value: 57.33, delta: -0.16 },
  rrp: { value: 3.40, delta: 0.12 },
  tga: { value: 796148, delta: -41158 },
  repo: { value: 0.0, delta: 0.0 },
};

const fallbackTopMarkets = [
  ["bitcoin", "BTC", 1, 68819, -1.17, 1360000000000, 38000000000],
  ["ethereum", "ETH", 2, 1969, -5.07, 236000000000, 21000000000],
  ["tether", "USDT", 3, 1.0, 0.0, 96000000000, 65000000000],
  ["xrp", "XRP", 4, 1.48, -3.1, 82000000000, 7200000000],
  ["binancecoin", "BNB", 5, 616.2, -0.7, 86000000000, 1800000000],
  ["solana", "SOL", 6, 86.2, -2.2, 41000000000, 3400000000],
  ["usd-coin", "USDC", 7, 1.0, 0.01, 39000000000, 9200000000],
  ["dogecoin", "DOGE", 8, 0.1027, -1.1, 15000000000, 1000000000],
  ["cardano", "ADA", 9, 0.2823, -0.9, 10000000000, 580000000],
  ["tron", "TRX", 10, 0.2807, 0.2, 24500000000, 520000000],
  ["avalanche-2", "AVAX", 11, 9.29, -1.2, 3600000000, 220000000],
  ["chainlink", "LINK", 12, 8.8, -1.9, 5200000000, 410000000],
  ["sui", "SUI", 13, 0.9768, -1.4, 3200000000, 280000000],
  ["stellar", "XLM", 14, 0.171, -0.5, 4800000000, 190000000],
  ["toncoin", "TON", 15, 1.47, 0.4, 6200000000, 180000000],
  ["hedera-hashgraph", "HBAR", 16, 0.08, -1.2, 2900000000, 130000000],
  ["shiba-inu", "SHIB", 17, 0.000019, -1.8, 11200000000, 490000000],
  ["litecoin", "LTC", 18, 73.1, -0.7, 5400000000, 460000000],
  ["polkadot", "DOT", 19, 5.2, -1.6, 7600000000, 250000000],
  ["bitcoin-cash", "BCH", 20, 390.6, 0.6, 7700000000, 310000000],
].map(([id, symbol, market_cap_rank, current_price, price_change_percentage_24h, market_cap, total_volume]) => ({
  id,
  symbol,
  name: symbol,
  market_cap_rank,
  current_price,
  price_change_percentage_24h,
  market_cap,
  total_volume,
}));

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
  if (typeof v !== "number" || Number.isNaN(v)) return "n/a";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function fmtUsd(v, digits = 0) {
  if (typeof v !== "number" || Number.isNaN(v)) return "n/a";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

function fmtKrw(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "n/a";
  return `₩${Math.round(v).toLocaleString()}`;
}

function fmtBigUsd(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "n/a";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return fmtUsd(v, 0);
}

function cls(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "flat";
  if (Math.abs(v) < 0.005) return "flat";
  if (v > 0) return "up";
  if (v < 0) return "down";
  return "flat";
}

function setAsOf() {
  const snapshotAsOf = state.snapshot?.asOf || "n/a";
  const newsAsOfRaw = state.news?.updated_at || "";
  const etfAsOfRaw = state.etf?.updated_at || "";
  const newsAsOf = newsAsOfRaw.startsWith("1970-01-01") || !newsAsOfRaw ? "수집 대기" : newsAsOfRaw;
  const etfAsOf = etfAsOfRaw.startsWith("1970-01-01") || !etfAsOfRaw ? "수집 대기" : etfAsOfRaw;

  const asOfText = `SNAPSHOT ${snapshotAsOf} | NEWS ${newsAsOf} | ETF ${etfAsOf} | LIVE ${new Date().toLocaleTimeString()}`;
  const pageAsOfEl = document.getElementById("asOfText");
  if (pageAsOfEl) pageAsOfEl.textContent = asOfText;

  const homeAsOfEl = document.getElementById("homeAsOf");
  if (homeAsOfEl) homeAsOfEl.textContent = asOfText;
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
  if (!el) return;
  el.innerHTML = items.map(cardHTML).join("");
}

function renderNewsList(containerId, items) {
  const list = document.getElementById(containerId);
  if (!list) return;
  if (!items || items.length === 0) {
    list.innerHTML = "<li>뉴스 수집 중입니다 (다음 배치 업데이트 대기)</li>";
    return;
  }
  list.innerHTML = items
    .slice(0, 6)
    .map((n) => `<li><a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.title}</a><span class="news-meta">${n.pubDate || "n/a"}</span></li>`)
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

  const checklistEl = document.getElementById("liqChecklist");
  if (checklistEl) {
    const checklist = s.liquidity_checklist || [];
    checklistEl.innerHTML = checklist.length > 0 ? checklist.map((x) => `<li>${x}</li>`).join("") : "<li>데이터 없음</li>";
  }

  const equities = (s.crypto_equities || []).map((x) => ({
    label: x.label,
    value: x.value,
    delta: x.delta,
  }));
  renderCards("cryptoEquityCards", equities);
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
  if (!tbody) return;
  const live = state.live || {};
  const usdKrw = state.fx?.usdKrw;

  const rows = exchangeCoins.map((coin, idx) => {
    const base = live[coin]?.price;
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
  const el = document.getElementById("etfFlows");
  if (!el) return;
  const etf = state.etf || {};
  const btc = typeof etf.btc_us_spot_etf_net_inflow_usd_m === "number" ? etf.btc_us_spot_etf_net_inflow_usd_m : -410.4;
  const eth = typeof etf.eth_us_spot_etf_net_inflow_usd_m === "number" ? etf.eth_us_spot_etf_net_inflow_usd_m : -113.1;
  const date = etf.date || "n/a";

  el.innerHTML = [
    flowCard({ title: "BTC Spot ETF", date, mainFlow: btc, assets: "$82.86B", history: etfHistoryFallback.btc }),
    flowCard({ title: "ETH Spot ETF", date, mainFlow: eth, assets: "$10.97B", history: etfHistoryFallback.eth }),
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
    { label: "BTC Dominance", value: typeof dominance.btc === "number" ? `${dominance.btc.toFixed(1)}%` : "n/a", deltaText: "", delta: null },
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
    { label: "ETH/BTC", value: typeof ethBtcRatio === "number" ? ethBtcRatio.toFixed(5) : "n/a", deltaText: "", delta: null },
    { label: "ETH Dominance", value: typeof dominance.eth === "number" ? `${dominance.eth.toFixed(1)}%` : "n/a", deltaText: "", delta: null },
  ]);
}

function averageFunding() {
  const sample = [pseudoFunding(1), pseudoFunding(2), pseudoFunding(3), pseudoFunding(4), pseudoFunding(5)];
  return sample.reduce((a, b) => a + b, 0) / sample.length;
}

function renderHomeHub() {
  const snapshotStrip = document.getElementById("strategySnapshot");
  if (!snapshotStrip) return;

  const fg = state.live?.fearGreed ?? null;
  const riskText = typeof fg === "number" && fg < 25 ? "Risk ON 주의: 극단적 공포" : "리스크 경고 없음";
  const vol = Math.abs(state.live?.BTC?.change ?? 0) + Math.abs(state.live?.ETH?.change ?? 0);
  const volText = vol > 7 ? "High Vol" : vol > 3 ? "Mid Vol" : "Low Vol";

  snapshotStrip.innerHTML = `
    <article class="snapshot-pill"><span class="label">Today Bias</span><span class="value">중립 / Range 대응</span></article>
    <article class="snapshot-pill"><span class="label">변동성 상태</span><span class="value">${volText}</span></article>
    <article class="snapshot-pill"><span class="label">리스크 경고</span><span class="value ${typeof fg === "number" && fg < 25 ? "down" : "flat"}">${riskText}</span></article>
  `;

  const btcEtf = typeof state.etf?.btc_us_spot_etf_net_inflow_usd_m === "number" ? state.etf.btc_us_spot_etf_net_inflow_usd_m : -410.4;
  const ethEtf = typeof state.etf?.eth_us_spot_etf_net_inflow_usd_m === "number" ? state.etf.eth_us_spot_etf_net_inflow_usd_m : -113.1;
  const avgFunding = averageFunding();

  const summary = [
    {
      title: "Crypto",
      href: "./crypto.html",
      rows: [
        ["BTC", fmtUsd(state.live?.BTC?.price, 0)],
        ["BTC.D", typeof state.live?.dominance?.btc === "number" ? `${state.live.dominance.btc.toFixed(1)}%` : "n/a"],
        ["Fear&Greed", typeof fg === "number" ? String(Math.round(fg)) : "n/a"],
        ["평균 Funding", fmtPct(avgFunding)],
      ],
    },
    {
      title: "주식 시장",
      href: "./stock-market.html",
      rows: [
        ["KOSPI", state.snapshot?.indices?.find((x) => x.label.includes("KOSPI"))?.value || "n/a"],
        ["NASDAQ", state.snapshot?.indices?.find((x) => x.label.includes("NASDAQ"))?.value || "n/a"],
        ["US10Y", fallbackMacro.us10y.value.toFixed(2)],
        ["DXY", fallbackMacro.dxy.value.toFixed(2)],
      ],
    },
    {
      title: "롱숏 정리",
      href: "./long-short.html",
      rows: [
        ["BTC L/S", "1.60"],
        ["ETH L/S", "1.29"],
        ["평균 Funding", fmtPct(avgFunding)],
      ],
    },
    {
      title: "ETF Flows",
      href: "./etf.html",
      rows: [
        ["BTC ETF", `${btcEtf >= 0 ? "+" : ""}$${btcEtf.toFixed(1)}M`],
        ["ETH ETF", `${ethEtf >= 0 ? "+" : ""}$${ethEtf.toFixed(1)}M`],
      ],
    },
    {
      title: "AI GPT 분석",
      href: "./ai-gpt-brief.html",
      rows: [
        ["최신 브리핑", state.snapshot?.asOf || "n/a"],
        ["Net Bias", "+0.24"],
      ],
    },
  ];

  const summaryEl = document.getElementById("categorySummary");
  if (summaryEl) {
    summaryEl.innerHTML = summary
      .map(
        (card) => `
      <a class="summary-link" href="${card.href}">
        <p class="summary-title">${card.title}</p>
        <ul class="summary-list">
          ${card.rows.map((r) => `<li><span>${r[0]}</span><strong>${r[1]}</strong></li>`).join("")}
        </ul>
      </a>
    `,
      )
      .join("");
  }

  const pulseRows = document.getElementById("pulseRows");
  if (pulseRows) {
    const rows = [
      ["BTC", fmtUsd(state.live?.BTC?.price, 0), state.live?.BTC?.change],
      ["ETH", fmtUsd(state.live?.ETH?.price, 0), state.live?.ETH?.change],
      ["SOL", fmtUsd(state.live?.SOL?.price, 2), state.live?.SOL?.change],
      ["NASDAQ", state.snapshot?.indices?.find((x) => x.label.includes("NASDAQ"))?.value || "n/a", state.snapshot?.indices?.find((x) => x.label.includes("NASDAQ"))?.delta ?? null],
      ["US10Y", fallbackMacro.us10y.value.toFixed(2), fallbackMacro.us10y.delta],
      ["DXY", fallbackMacro.dxy.value.toFixed(2), fallbackMacro.dxy.delta],
    ];
    pulseRows.innerHTML = rows
      .map((r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num ${cls(r[2])}">${fmtPct(r[2])}</td></tr>`)
      .join("");
  }

  const briefEl = document.getElementById("briefPreview");
  if (briefEl) {
    const macroTop = state.news?.macro?.[0];
    const title = macroTop?.title || "데일리 브리핑 준비 중";
    const date = macroTop?.pubDate || state.snapshot?.asOf || "n/a";
    const lines = [
      "달러/변동성 신호 혼재: 방향성 추종보다 레인지 대응 우선",
      "ETH 변동성 프리미엄 확대로 레버리지 보수적 운영",
      "BTC-ETH 상관이 높아 동행 리스크 관리 필요",
    ];

    briefEl.innerHTML = `
      <h3 class="brief-title">${title}</h3>
      <p class="brief-date">${date}</p>
      <ul class="brief-lines">${lines.map((line) => `<li>${line}</li>`).join("")}</ul>
    `;
  }
}

function setupCryptoTopControls() {
  const search = document.getElementById("cryptoSearch");
  const movers = document.getElementById("moversOnly");
  const sort = document.getElementById("cryptoSort");

  if (search && !search.dataset.bound) {
    search.addEventListener("input", renderCryptoTopTable);
    search.dataset.bound = "1";
  }
  if (movers && !movers.dataset.bound) {
    movers.addEventListener("change", renderCryptoTopTable);
    movers.dataset.bound = "1";
  }
  if (sort && !sort.dataset.bound) {
    sort.addEventListener("change", renderCryptoTopTable);
    sort.dataset.bound = "1";
  }
}

function renderCryptoTopSummary() {
  if (!document.getElementById("cryptoTopSummary")) return;

  const totalCap = state.markets.reduce((acc, m) => acc + (m.market_cap || 0), 0);
  renderCards("cryptoTopSummary", [
    { label: "BTC", value: fmtUsd(state.live?.BTC?.price, 0), delta: state.live?.BTC?.change },
    { label: "ETH", value: fmtUsd(state.live?.ETH?.price, 0), delta: state.live?.ETH?.change },
    { label: "TOTAL Market Cap", value: fmtBigUsd(totalCap), deltaText: "Top20 합산", delta: null },
    {
      label: "BTC Dominance",
      value: typeof state.live?.dominance?.btc === "number" ? `${state.live.dominance.btc.toFixed(1)}%` : "n/a",
      deltaText: "live",
      delta: null,
    },
    {
      label: "ETH Dominance",
      value: typeof state.live?.dominance?.eth === "number" ? `${state.live.dominance.eth.toFixed(1)}%` : "n/a",
      deltaText: "live",
      delta: null,
    },
  ]);
}

function renderCryptoTopTable() {
  const tbody = document.getElementById("cryptoTopRows");
  if (!tbody) return;

  const q = (document.getElementById("cryptoSearch")?.value || "").trim().toLowerCase();
  const moversOnly = Boolean(document.getElementById("moversOnly")?.checked);
  const sortBy = document.getElementById("cryptoSort")?.value || "market_cap";

  const dominanceBtc = state.live?.dominance?.btc;
  const dominanceEth = state.live?.dominance?.eth;
  let list = [...state.markets];

  if (q) {
    list = list.filter((m) => m.symbol.toLowerCase().includes(q) || (m.name || "").toLowerCase().includes(q));
  }

  if (moversOnly) {
    list = list.filter((m) => Math.abs(m.price_change_percentage_24h || 0) >= 1);
  }

  const sortMap = {
    market_cap: (m) => m.market_cap || 0,
    price: (m) => m.current_price || 0,
    change: (m) => Math.abs(m.price_change_percentage_24h || 0),
    volume: (m) => m.total_volume || 0,
  };
  list.sort((a, b) => sortMap[sortBy](b) - sortMap[sortBy](a));

  if (list.length === 0) {
    tbody.innerHTML = "<tr><td colspan='8'>조건에 맞는 데이터 없음</td></tr>";
    return;
  }

  tbody.innerHTML = list
    .slice(0, 20)
    .map((m, idx) => {
      const funding = pseudoFunding(idx + 1);
      const dominance = m.symbol.toUpperCase() === "BTC" ? dominanceBtc : m.symbol.toUpperCase() === "ETH" ? dominanceEth : null;
      return `
      <tr>
        <td>${m.market_cap_rank || idx + 1}</td>
        <td>
          <div class="asset-name">
            <strong>${(m.name || m.symbol).toUpperCase()}</strong>
            <span>${m.symbol.toUpperCase()}</span>
          </div>
        </td>
        <td class="num">${fmtUsd(m.current_price, m.current_price < 1 ? 4 : 2)}</td>
        <td class="num ${cls(m.price_change_percentage_24h)}">${fmtPct(m.price_change_percentage_24h)}</td>
        <td class="num">${fmtBigUsd(m.market_cap)}</td>
        <td class="num">${fmtBigUsd(m.total_volume)}</td>
        <td class="num ${cls(funding)}">${fmtPct(funding)}</td>
        <td class="num ${cls(dominance)}">${typeof dominance === "number" ? `${dominance.toFixed(1)}%` : "-"}</td>
      </tr>
    `;
    })
    .join("");
}

function renderStockMarketPage() {
  if (!document.getElementById("rateCards")) return;

  renderCards("rateCards", [
    { label: "US10Y", value: fallbackMacro.us10y.value.toFixed(2), delta: fallbackMacro.us10y.delta },
    { label: "US2Y", value: fallbackMacro.us2y.value.toFixed(2), delta: fallbackMacro.us2y.delta },
    { label: "SOFR", value: fallbackMacro.sofr.value.toFixed(2), delta: fallbackMacro.sofr.delta },
    { label: "IORB", value: fallbackMacro.iorb.value.toFixed(2), delta: fallbackMacro.iorb.delta },
  ]);

  renderCards("fxCards", [
    { label: "DXY", value: fallbackMacro.dxy.value.toFixed(2), delta: fallbackMacro.dxy.delta },
    { label: "USD/KRW", value: fmtKrw(state.fx?.usdKrw), delta: state.fx?.delta ?? null },
  ]);

  const indices = state.snapshot?.indices || [];
  const indexMap = {
    KOSPI: indices.find((x) => x.label.includes("KOSPI")),
    KOSDAQ: indices.find((x) => x.label.includes("KOSDAQ")),
    NASDAQ: indices.find((x) => x.label.includes("NASDAQ")),
    "DOW": { label: "DOW", value: fallbackMacro.dow.value.toLocaleString(), delta: fallbackMacro.dow.delta },
    "Russell 2000": { label: "Russell 2000", value: fallbackMacro.russell2000.value.toLocaleString(), delta: fallbackMacro.russell2000.delta },
    "S&P500": indices.find((x) => x.label.includes("S&P")),
  };
  const indexItems = Object.entries(indexMap).map(([k, v]) => ({ label: k, value: v?.value || "n/a", delta: v?.delta ?? null }));
  renderCards("indexCards", indexItems);

  const commodities = state.snapshot?.commodities || [];
  renderCards("commodityCards", [
    { label: "GOLD", value: commodities.find((x) => x.label.includes("Gold"))?.value || "n/a", delta: commodities.find((x) => x.label.includes("Gold"))?.delta ?? null },
    { label: "WTI", value: `$${fallbackMacro.wti.value.toFixed(2)}`, delta: fallbackMacro.wti.delta },
    { label: "COPPER", value: commodities.find((x) => x.label.includes("Copper"))?.value || "n/a", delta: commodities.find((x) => x.label.includes("Copper"))?.delta ?? null },
  ]);

  const qeRows = document.getElementById("qeRows");
  if (qeRows) {
    const rows = [
      ["RRP", fallbackMacro.rrp.value.toFixed(2), fmtPct(fallbackMacro.rrp.delta), "긴축 우려"],
      ["TGA", fallbackMacro.tga.value.toLocaleString(), fallbackMacro.tga.delta.toLocaleString(), "보합"],
      ["REPO", fallbackMacro.repo.value.toFixed(2), fallbackMacro.repo.delta.toFixed(2), "보합"],
      ["QT", "진행 중", "-", "유동성 점검 필요"],
    ];
    qeRows.innerHTML = rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td>${r[3]}</td></tr>`).join("");
  }
}

function renderAll() {
  renderMacroCards();
  renderNewsList("macroNews", state.news?.macro || []);
  renderNewsList("cryptoNews", state.news?.crypto || []);
  renderCategoryCards();
  renderExchangeTable();
  renderEtfFlows();
  renderHomeHub();
  renderCryptoTopSummary();
  renderCryptoTopTable();
  renderStockMarketPage();
  setAsOf();
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
  const [snapshot, news, etf] = await Promise.all([fetchJson("./data/snapshot.json"), fetchJson("./data/news.json"), fetchJson("./data/etf.json")]);
  state.snapshot = snapshot;
  state.news = news;
  state.etf = etf;
}

async function fetchLive() {
  const ids = "bitcoin,ethereum,binancecoin,solana,ripple,dogecoin,cardano,tron,avalanche-2,chainlink,sui,stellar,toncoin,hedera-hashgraph";
  const cgSimple = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const cgGlobal = "https://api.coingecko.com/api/v3/global";
  const fgApi = "https://api.alternative.me/fng/?limit=1&format=json";
  const fxApi = "https://open.er-api.com/v6/latest/USD";
  const upbitBtcApi = "https://api.upbit.com/v1/ticker?markets=KRW-BTC";
  const marketApi = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h";

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
    const [simpleR, globalR, fgR, fxR, upbitR, marketR] = await Promise.allSettled([
      fetchJson(cgSimple),
      fetchJson(cgGlobal),
      fetchJson(fgApi),
      fetchJson(fxApi),
      fetchJson(upbitBtcApi),
      fetchJson(marketApi),
    ]);

    const simple = simpleR.status === "fulfilled" ? simpleR.value : null;
    const globalData = globalR.status === "fulfilled" ? globalR.value : null;
    const fg = fgR.status === "fulfilled" ? fgR.value : null;
    const fx = fxR.status === "fulfilled" ? fxR.value : null;
    const upbit = upbitR.status === "fulfilled" ? upbitR.value : null;
    const markets = marketR.status === "fulfilled" ? marketR.value : null;

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
    state.live.upbitBtcKrw = Array.isArray(upbit) ? upbit[0]?.trade_price ?? prevLive?.upbitBtcKrw ?? null : prevLive?.upbitBtcKrw ?? null;
    state.live.coinbaseBtc = live.BTC?.price ? live.BTC.price * 0.9991 : prevLive?.coinbaseBtc ?? null;

    state.markets = Array.isArray(markets) && markets.length > 0 ? markets : state.markets;
  } catch (e) {
    console.error("live fetch failed", e);
  } finally {
    renderAll();
  }
}

async function init() {
  state.live = fallbackLive;
  state.fx = fallbackFx;
  state.markets = fallbackTopMarkets;
  setupCryptoTopControls();
  renderAll();

  try {
    await loadStatic();
  } catch (e) {
    console.error("static load failed", e);
  }

  renderAll();
  await fetchLive();
  setInterval(fetchLive, 60000);
}

init();
