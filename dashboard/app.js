const state = {
  snapshot: null,
  news: null,
  etf: null,
  macroSnapshot: null,
  cryptoTop20: [],
  live: null,
  fx: null,
};

const uiState = {
  cryptoSort: { key: "market_cap", dir: "desc" },
};

const STABLES = new Set(["USDT", "USDC", "DAI", "FDUSD", "TUSD", "USDE", "USDD"]);

const fallbackLive = {
  BTC: { price: 89986.73, change: 1.41 },
  ETH: { price: 3125.32, change: 4.16 },
  SOL: { price: 132.63, change: 4.63 },
  XRP: { price: 2.02, change: 7.54 },
  dominance: { btc: 56.7, eth: 9.8 },
  fearGreed: 29,
  upbitBtcKrw: 102432000,
};

const fallbackFx = { usdKrw: 1444, delta: 0.22 };

const fallbackMacro = {
  rates: {
    us10y: { value: 4.18, delta: 0.97, display: "4.18" },
    us2y: { value: 3.47, delta: 0.58, display: "3.47" },
    sofr: { value: 3.64, delta: 0.0, display: "3.64" },
    iorb: { value: 3.65, delta: 0.0, display: "3.65" },
  },
  fx: {
    dxy: { value: 98.43, delta: 0.16, display: "98.43" },
    usdkrw: { value: 1444, delta: 0.22, display: "1,444" },
  },
  indices: {
    kospi: { value: 5507, delta: 2.85, display: "5,507" },
    kosdaq: { value: 1106, delta: -0.79, display: "1,106" },
    nasdaq: { value: 22547, delta: -2.25, display: "22,547" },
    dow: { value: 42510, delta: -0.42, display: "42,510" },
    russell2000: { value: 2320, delta: -0.61, display: "2,320" },
    sp500: { value: 6836, delta: -1.52, display: "6,836" },
  },
  commodities: {
    gold: { value: 5034, delta: 0.23, display: "$5,034/oz" },
    wti: { value: 57.33, delta: -0.16, display: "$57.33" },
    copper: { value: 5.77, delta: -0.33, display: "$5.77/lb" },
  },
  liquidity: {
    rrp: { value: 3.4, delta: 0.12, display: "3.40" },
    tga: { value: 796148, delta: -41158, display: "796,148" },
    repo: { value: 0.0, delta: 0.0, display: "0.00" },
    qt_status: "진행 중 (대차대조표 축소)",
  },
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

function formatPct(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatUsd(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function formatBigNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return value.toLocaleString();
}

function formatSupply(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toLocaleString();
}

function formatKrw(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `₩${Math.round(value).toLocaleString()}`;
}

function toneClass(value, neutralThreshold = 0.01) {
  if (typeof value !== "number" || Number.isNaN(value)) return "flat";
  if (Math.abs(value) <= neutralThreshold) return "flat";
  return value > 0 ? "up" : "down";
}

function cardHTML(item) {
  return `
    <article class="metric-card">
      <p class="metric-label">${item.label}</p>
      <p class="metric-value ${item.valueClass || ""}">${item.value}</p>
      <p class="metric-delta ${toneClass(item.delta, item.neutralThreshold ?? 0.01)}">${item.deltaText ?? formatPct(item.delta)}</p>
    </article>
  `;
}

function renderCards(targetId, items) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = items.map(cardHTML).join("");
}

function setAsOf() {
  const snapshotAsOf = state.snapshot?.asOf || state.macroSnapshot?.as_of || "n/a";
  const newsAsOfRaw = state.news?.updated_at || "";
  const etfAsOfRaw = state.etf?.updated_at || "";
  const newsAsOf = newsAsOfRaw.startsWith("1970-01-01") || !newsAsOfRaw ? "수집 대기" : newsAsOfRaw;
  const etfAsOf = etfAsOfRaw.startsWith("1970-01-01") || !etfAsOfRaw ? "수집 대기" : etfAsOfRaw;
  const live = new Date().toLocaleTimeString();
  const text = `SNAPSHOT ${snapshotAsOf} | NEWS ${newsAsOf} | ETF ${etfAsOf} | LIVE ${live}`;

  const asOf = document.getElementById("asOfText");
  if (asOf) asOf.textContent = text;

  const homeAsOf = document.getElementById("homeAsOf");
  if (homeAsOf) homeAsOf.textContent = text;
}

function renderNewsList(containerId, items) {
  const list = document.getElementById(containerId);
  if (!list) return;
  if (!Array.isArray(items) || items.length === 0) {
    list.innerHTML = "<li>뉴스 수집 중입니다 (다음 배치 업데이트 대기)</li>";
    return;
  }

  list.innerHTML = items
    .slice(0, 6)
    .map((n) => `<li><a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.title}</a><span class="news-meta">${n.pubDate || "n/a"}</span></li>`)
    .join("");
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

function renderExchangeCol(funding, price, useLowMark = false) {
  return `
    <td>
      <div class="ex-main ${toneClass(funding)}">${formatPct(funding)}</div>
      <div class="ex-sub"><span class="ex-mark">${useLowMark ? "L" : ""}</span>${formatUsd(price, price && price < 10 ? 4 : 2)}</div>
    </td>
  `;
}

function renderExchangeTable() {
  const tbody = document.getElementById("exchangeRows");
  if (!tbody) return;

  const usdKrw = state.fx?.usdKrw;
  const rows = exchangeCoins.map((coin, idx) => {
    const base = state.live?.[coin]?.price;
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
            <div class="coin-meta">${formatUsd(base, base && base < 10 ? 4 : 2)} gap ${formatPct(gap)}</div>
          </div>
        </td>
        ${renderExchangeCol(pseudoFunding(idx + 1), bPrice)}
        ${renderExchangeCol(pseudoFunding(idx + 2), byPrice)}
        ${renderExchangeCol(pseudoFunding(idx + 3), okPrice)}
        ${renderExchangeCol(pseudoFunding(idx + 4), hPrice, true)}
        <td>
          <div class="ex-main ${toneClass(gap)}">spot</div>
          <div class="ex-sub"><span class="ex-mark">H</span>${formatKrw(upKrw)}</div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rows.join("");
}

function flowCard({ title, date, mainFlow, assets, history }) {
  const maxAbs = Math.max(...history.map((h) => Math.abs(h.flow)), 1);
  const bars = history
    .map((h) => {
      const width = Math.max(6, (Math.abs(h.flow) / maxAbs) * 100);
      return `
        <div class="flow-row">
          <span>${h.date}</span>
          <div class="flow-track"><div class="flow-fill ${toneClass(h.flow)}" style="width:${width}%"></div></div>
          <span class="${toneClass(h.flow)}">${h.flow >= 0 ? "+" : ""}$${h.flow.toFixed(1)}M</span>
        </div>
      `;
    })
    .join("");

  return `
    <article class="flow-card">
      <div class="flow-head">
        <p class="flow-title">${title}</p>
        <p class="flow-status ${toneClass(mainFlow)}">${mainFlow < 0 ? "Net Outflow" : "Net Inflow"}</p>
      </div>
      <p class="flow-main ${toneClass(mainFlow)}">${mainFlow >= 0 ? "+" : ""}$${mainFlow.toFixed(1)}M</p>
      <p class="flow-meta">${date} | Assets: ${assets}</p>
      <div class="flow-bars">${bars}</div>
    </article>
  `;
}

function renderEtfFlows() {
  const el = document.getElementById("etfFlows");
  if (!el) return;

  const btc = typeof state.etf?.btc_us_spot_etf_net_inflow_usd_m === "number" ? state.etf.btc_us_spot_etf_net_inflow_usd_m : -410.4;
  const eth = typeof state.etf?.eth_us_spot_etf_net_inflow_usd_m === "number" ? state.etf.eth_us_spot_etf_net_inflow_usd_m : -113.1;
  const date = state.etf?.date || "n/a";

  el.innerHTML = [
    flowCard({ title: "BTC Spot ETF", date, mainFlow: btc, assets: "$82.86B", history: etfHistoryFallback.btc }),
    flowCard({ title: "ETH Spot ETF", date, mainFlow: eth, assets: "$10.97B", history: etfHistoryFallback.eth }),
  ].join("");
}

function renderMacroCards() {
  const s = state.snapshot || { indices: [], commodities: [] };
  const items = [...(s.indices || []), ...(s.commodities || [])].slice(0, 8).map((x) => ({
    label: x.label,
    value: x.value,
    delta: x.delta,
    neutralThreshold: 0.2,
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
    neutralThreshold: 0.2,
  }));
  renderCards("cryptoEquityCards", equities);
}

function avgFundingFromTop20() {
  const hasFunding = state.cryptoTop20.filter((a) => typeof a.funding === "number");
  if (hasFunding.length === 0) return null;
  return hasFunding.reduce((sum, row) => sum + row.funding, 0) / hasFunding.length;
}

function renderHomeHub() {
  const snapshotStrip = document.getElementById("strategySnapshot");
  if (!snapshotStrip) return;

  const fearGreed = state.live?.fearGreed;
  const btcChg = state.live?.BTC?.change ?? 0;
  const ethChg = state.live?.ETH?.change ?? 0;
  const vol = Math.abs(btcChg) + Math.abs(ethChg);
  const volText = vol > 8 ? "High" : vol > 4 ? "Medium" : "Low";
  const riskText = typeof fearGreed === "number" && fearGreed < 25 ? "경고: 극단적 공포" : "정상";

  snapshotStrip.innerHTML = `
    <article class="snapshot-pill"><span class="label">Today Bias</span><span class="value">중립 (Range)</span></article>
    <article class="snapshot-pill"><span class="label">변동성 상태</span><span class="value">${volText}</span></article>
    <article class="snapshot-pill"><span class="label">리스크 경고</span><span class="value ${toneClass(typeof fearGreed === "number" && fearGreed < 25 ? -1 : 0)}">${riskText}</span></article>
  `;

  const pulseRows = document.getElementById("pulseRows");
  if (pulseRows) {
    const macro = state.macroSnapshot || fallbackMacro;
    const rows = [
      ["BTC", formatUsd(state.live?.BTC?.price, 2), state.live?.BTC?.change],
      ["ETH", formatUsd(state.live?.ETH?.price, 2), state.live?.ETH?.change],
      ["SOL", formatUsd(state.live?.SOL?.price, 2), state.live?.SOL?.change],
      ["NASDAQ", macro.indices.nasdaq.display, macro.indices.nasdaq.delta],
      ["US10Y", macro.rates.us10y.display, macro.rates.us10y.delta],
      ["DXY", macro.fx.dxy.display, macro.fx.dxy.delta],
    ];

    pulseRows.innerHTML = rows
      .map((row) => `<tr><td>${row[0]}</td><td class="num">${row[1]}</td><td class="num ${toneClass(row[2], 0.2)}">${formatPct(row[2])}</td></tr>`)
      .join("");
  }

  const brief = document.getElementById("briefPreview");
  if (brief) {
    const topMacro = state.news?.macro?.[0];
    const title = topMacro?.title || "오늘 브리핑 준비 중";
    const date = topMacro?.pubDate || state.snapshot?.asOf || "n/a";

    brief.innerHTML = `
      <h3 class="brief-title">${title}</h3>
      <p class="brief-date">${date}</p>
      <ul class="brief-lines">
        <li>달러와 금리 신호가 혼재되어 추격매수보다 확인매매 우선.</li>
        <li>ETH 변동성이 높아 포지션 사이징 보수적으로 유지.</li>
        <li>BTC-ETH 동행 리스크를 감안해 분산 진입 필요.</li>
      </ul>
    `;
  }
}

function renderCryptoTopSummary() {
  const target = document.getElementById("cryptoTopSummary");
  if (!target) return;

  const total = state.cryptoTop20.reduce((sum, row) => sum + (row.market_cap_usd || 0), 0);
  const avgFunding = avgFundingFromTop20();

  renderCards("cryptoTopSummary", [
    { label: "TOTAL Market Cap", value: formatBigNumber(total), deltaText: "Top20 합산", delta: null },
    {
      label: "BTC Dominance",
      value: typeof state.live?.dominance?.btc === "number" ? `${state.live.dominance.btc.toFixed(1)}%` : "—",
      deltaText: "live",
      delta: null,
    },
    {
      label: "ETH Dominance",
      value: typeof state.live?.dominance?.eth === "number" ? `${state.live.dominance.eth.toFixed(1)}%` : "—",
      deltaText: "live",
      delta: null,
    },
    {
      label: "Fear & Greed",
      value: typeof state.live?.fearGreed === "number" ? String(state.live.fearGreed) : "—",
      deltaText: typeof state.live?.fearGreed === "number" ? (state.live.fearGreed < 25 ? "극단적 공포" : "중립") : "—",
      delta: typeof state.live?.fearGreed === "number" ? (state.live.fearGreed < 25 ? -1 : 0.5) : null,
    },
    {
      label: "Avg Funding",
      value: typeof avgFunding === "number" ? formatPct(avgFunding) : "—",
      deltaText: "Top20 평균",
      delta: avgFunding,
    },
  ]);
}

function getCryptoFilteredSortedRows() {
  const search = (document.getElementById("cryptoSearch")?.value || "").trim().toLowerCase();
  const moversOnly = Boolean(document.getElementById("moversOnly")?.checked);
  const hideStables = Boolean(document.getElementById("hideStables")?.checked);
  const fundingOnly = Boolean(document.getElementById("fundingOnly")?.checked);

  let rows = [...state.cryptoTop20];

  if (search) {
    rows = rows.filter((row) => row.symbol.toLowerCase().includes(search) || row.name.toLowerCase().includes(search));
  }

  if (moversOnly) {
    rows = rows.filter((row) => Math.abs(row.pct_24h || 0) >= 2);
  }

  if (hideStables) {
    rows = rows.filter((row) => !STABLES.has(row.symbol.toUpperCase()));
  }

  if (fundingOnly) {
    rows = rows.filter((row) => typeof row.funding === "number");
  }

  const { key, dir } = uiState.cryptoSort;
  const factor = dir === "asc" ? 1 : -1;
  const keyMap = {
    rank: "rank",
    name: "name",
    price: "price_usd",
    pct24h: "pct_24h",
    pct7d: "pct_7d",
    market_cap: "market_cap_usd",
    volume_24h: "volume_24h_usd",
    circulating_supply: "circulating_supply",
    funding: "funding",
  };
  const dataKey = keyMap[key] || key;

  rows.sort((a, b) => {
    const av = a[dataKey];
    const bv = b[dataKey];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
    return String(av ?? "").localeCompare(String(bv ?? "")) * factor;
  });

  return rows;
}

function setCryptoSortHeaderState() {
  const headers = document.querySelectorAll("#cryptoTopTable th.sortable");
  headers.forEach((th) => {
    const key = th.dataset.sort;
    if (key === uiState.cryptoSort.key) {
      th.dataset.dir = uiState.cryptoSort.dir;
    } else {
      th.dataset.dir = "";
    }
  });
}

function renderCryptoTopTable() {
  const tbody = document.getElementById("cryptoTopRows");
  if (!tbody) return;

  const rows = getCryptoFilteredSortedRows();
  setCryptoSortHeaderState();

  if (rows.length === 0) {
    tbody.innerHTML = "<tr><td colspan='10'>조건에 맞는 자산이 없습니다.</td></tr>";
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const tags = [...(row.tags || [])];
      if (row.symbol === "BTC") tags.push("BTC.D");
      if (row.symbol === "ETH") tags.push("ETH.D");

      return `
      <tr class="click-row" data-symbol="${row.symbol}">
        <td>${row.rank}</td>
        <td>
          <div class="asset-name">
            <strong>${row.symbol}</strong>
            <span>${row.name}</span>
          </div>
        </td>
        <td class="num">${formatUsd(row.price_usd, row.price_usd < 1 ? 4 : 2)}</td>
        <td class="num ${toneClass(row.pct_24h, 0.2)}">${formatPct(row.pct_24h)}</td>
        <td class="num ${toneClass(row.pct_7d, 0.2)}">${formatPct(row.pct_7d)}</td>
        <td class="num">${formatBigNumber(row.market_cap_usd)}</td>
        <td class="num">${formatBigNumber(row.volume_24h_usd)}</td>
        <td class="num">${formatSupply(row.circulating_supply)}</td>
        <td class="num ${toneClass(row.funding, 0.0001)}">${typeof row.funding === "number" ? formatPct(row.funding, 4) : "—"}</td>
        <td>${tags.join(", ") || "—"}</td>
      </tr>
    `;
    })
    .join("");

  tbody.querySelectorAll("tr.click-row").forEach((row) => {
    row.addEventListener("click", () => {
      const symbol = row.dataset.symbol;
      if (!symbol) return;
      window.location.href = `/crypto/${symbol}`;
    });
  });
}

function setupCryptoTopControls() {
  const ids = ["cryptoSearch", "moversOnly", "hideStables", "fundingOnly"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound) return;
    el.addEventListener("input", renderCryptoTopTable);
    el.addEventListener("change", renderCryptoTopTable);
    el.dataset.bound = "1";
  });

  document.querySelectorAll("#cryptoTopTable th.sortable").forEach((th) => {
    if (th.dataset.bound) return;
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (!key) return;
      if (uiState.cryptoSort.key === key) {
        uiState.cryptoSort.dir = uiState.cryptoSort.dir === "asc" ? "desc" : "asc";
      } else {
        uiState.cryptoSort.key = key;
        uiState.cryptoSort.dir = key === "name" ? "asc" : "desc";
      }
      renderCryptoTopTable();
    });
    th.dataset.bound = "1";
  });
}

function renderStockMarketPage() {
  if (!document.getElementById("rateCards")) return;

  const macro = state.macroSnapshot || fallbackMacro;

  renderCards("rateCards", [
    { label: "US10Y", value: macro.rates.us10y.display, delta: macro.rates.us10y.delta, neutralThreshold: 0.2 },
    { label: "US2Y", value: macro.rates.us2y.display, delta: macro.rates.us2y.delta, neutralThreshold: 0.2 },
    { label: "SOFR", value: macro.rates.sofr.display, delta: macro.rates.sofr.delta, neutralThreshold: 0.2 },
    { label: "IORB", value: macro.rates.iorb.display, delta: macro.rates.iorb.delta, neutralThreshold: 0.2 },
  ]);

  renderCards("fxCards", [
    { label: "DXY", value: macro.fx.dxy.display, delta: macro.fx.dxy.delta, neutralThreshold: 0.2 },
    { label: "USD/KRW", value: macro.fx.usdkrw.display, delta: macro.fx.usdkrw.delta, neutralThreshold: 0.2 },
  ]);

  renderCards("indexCards", [
    { label: "KOSPI", value: macro.indices.kospi.display, delta: macro.indices.kospi.delta, neutralThreshold: 0.2 },
    { label: "KOSDAQ", value: macro.indices.kosdaq.display, delta: macro.indices.kosdaq.delta, neutralThreshold: 0.2 },
    { label: "NASDAQ", value: macro.indices.nasdaq.display, delta: macro.indices.nasdaq.delta, neutralThreshold: 0.2 },
    { label: "DOW", value: macro.indices.dow.display, delta: macro.indices.dow.delta, neutralThreshold: 0.2 },
    { label: "Russell 2000", value: macro.indices.russell2000.display, delta: macro.indices.russell2000.delta, neutralThreshold: 0.2 },
    { label: "S&P500", value: macro.indices.sp500.display, delta: macro.indices.sp500.delta, neutralThreshold: 0.2 },
  ]);

  renderCards("commodityCards", [
    { label: "GOLD", value: macro.commodities.gold.display, delta: macro.commodities.gold.delta, neutralThreshold: 0.2 },
    { label: "WTI", value: macro.commodities.wti.display, delta: macro.commodities.wti.delta, neutralThreshold: 0.2 },
    { label: "COPPER", value: macro.commodities.copper.display, delta: macro.commodities.copper.delta, neutralThreshold: 0.2 },
  ]);

  const qeRows = document.getElementById("qeRows");
  if (qeRows) {
    const rows = [
      ["RRP", macro.liquidity.rrp.display, formatPct(macro.liquidity.rrp.delta), macro.liquidity.rrp.delta > 0 ? "긴축 우려" : "완화"],
      ["TGA", macro.liquidity.tga.display, macro.liquidity.tga.delta.toLocaleString(), "보합"],
      ["REPO", macro.liquidity.repo.display, formatPct(macro.liquidity.repo.delta), "보합"],
      ["QT", macro.liquidity.qt_status, "-", "상태"],
    ];
    qeRows.innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td class="num">${row[1]}</td><td class="num">${row[2]}</td><td>${row[3]}</td></tr>`).join("");
  }
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

  renderCards("cryptoCards", [
    { label: "Bitcoin", value: formatUsd(btc.price, 0), delta: btc.change, neutralThreshold: 0.2 },
    { label: "Ethereum", value: formatUsd(eth.price, 0), delta: eth.change, neutralThreshold: 0.2 },
    { label: "BTC Dominance", value: typeof dominance.btc === "number" ? `${dominance.btc.toFixed(1)}%` : "—", deltaText: "", delta: null },
    {
      label: "Fear & Greed",
      value: typeof fg === "number" ? String(Math.round(fg)) : "—",
      valueClass: typeof fg === "number" && fg < 25 ? "down" : "",
      deltaText: typeof fg === "number" ? (fg < 25 ? "극단적 공포" : fg > 75 ? "탐욕" : "중립") : "—",
      delta: typeof fg === "number" ? (fg < 25 ? -1 : fg > 75 ? 1 : 0) : null,
    },
  ]);

  renderCards("premiumCards", [
    { label: "Kimchi Premium", value: formatPct(kimchi), delta: kimchi, neutralThreshold: 0.2 },
    { label: "BTC (KRW)", value: formatKrw(upbitBtc || btcKrw), deltaText: "spot", delta: null },
    { label: "USD/KRW", value: formatKrw(state.fx?.usdKrw), delta: state.fx?.delta ?? null, neutralThreshold: 0.2 },
  ]);

  renderCards("ethCards", [
    {
      label: "ETH Dominance",
      value: typeof dominance.eth === "number" ? `${dominance.eth.toFixed(1)}%` : "—",
      deltaText: "live",
      delta: null,
    },
  ]);
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

function setupSidebarShell() {
  const sidebar = document.querySelector(".left-sidebar");
  if (!sidebar) return;

  const menu = [
    { href: "./index.html", label: "홈", icon: "🏠" },
    { href: "./crypto.html", label: "크립토", icon: "₿" },
    { href: "./stock-market.html", label: "주식/매크로", icon: "📈" },
    { href: "./long-short.html", label: "롱/숏", icon: "⚖️" },
    { href: "./etf.html", label: "ETF Flows", icon: "🏦" },
    { href: "./funding.html", label: "펀딩비", icon: "💸" },
    { href: "./exchanges.html", label: "거래소별 프리미엄+가격", icon: "🧾" },
    { href: "./ai-gpt-brief.html", label: "AI 브리핑", icon: "🤖" },
    { href: "./news.html", label: "뉴스", icon: "📰" },
  ];

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  sidebar.innerHTML = menu
    .map((item) => {
      const isActive = item.href.endsWith(currentPage);
      const cls = item.href === "./index.html" ? `side-home ${isActive ? "active" : ""}`.trim() : `side-link ${isActive ? "active" : ""}`.trim();
      return `<a class="${cls}" href="${item.href}"><span class="side-ico">${item.icon}</span><span class="side-label">${item.label}</span></a>`;
    })
    .join("");

  if (!document.querySelector(".sidebar-toggle")) {
    const btn = document.createElement("button");
    btn.className = "sidebar-toggle";
    btn.type = "button";
    btn.innerHTML = "☰";
    btn.setAttribute("aria-label", "사이드바 토글");
    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 980px)").matches) {
        document.body.classList.toggle("sidebar-open");
      } else {
        document.body.classList.toggle("sidebar-collapsed");
      }
    });
  }

  if (!document.querySelector(".sidebar-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  }

  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 980px)").matches) {
      document.body.classList.remove("sidebar-open");
    }
  });
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const response = await fetch(url, { cache: "no-store", signal: controller.signal });
  clearTimeout(timer);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadStatic() {
  const [snapshot, news, etf, macro, top20] = await Promise.allSettled([
    fetchJson("./data/snapshot.json"),
    fetchJson("./data/news.json"),
    fetchJson("./data/etf.json"),
    fetchJson("./data/macro_snapshot.json"),
    fetchJson("./data/crypto_top20.json"),
  ]);

  state.snapshot = snapshot.status === "fulfilled" ? snapshot.value : null;
  state.news = news.status === "fulfilled" ? news.value : null;
  state.etf = etf.status === "fulfilled" ? etf.value : null;
  state.macroSnapshot = macro.status === "fulfilled" ? macro.value : fallbackMacro;
  state.cryptoTop20 = top20.status === "fulfilled" ? top20.value.assets || [] : [];
}

async function fetchLive() {
  const ids = "bitcoin,ethereum,solana,ripple,binancecoin,dogecoin,cardano,tron,avalanche-2,chainlink,sui,stellar,toncoin,hedera-hashgraph";
  const cgSimple = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const cgGlobal = "https://api.coingecko.com/api/v3/global";
  const fgApi = "https://api.alternative.me/fng/?limit=1&format=json";
  const fxApi = "https://open.er-api.com/v6/latest/USD";
  const upbitBtcApi = "https://api.upbit.com/v1/ticker?markets=KRW-BTC";

  const map = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    XRP: "ripple",
    BNB: "binancecoin",
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

  const prevLive = state.live || fallbackLive;
  const prevFx = state.fx || fallbackFx;

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
    Object.entries(map).forEach(([symbol, id]) => {
      live[symbol] = {
        price: simple?.[id]?.usd ?? prevLive?.[symbol]?.price ?? null,
        change: simple?.[id]?.usd_24h_change ?? prevLive?.[symbol]?.change ?? null,
      };
    });

    live.dominance = {
      btc: globalData?.data?.market_cap_percentage?.btc ?? prevLive?.dominance?.btc ?? null,
      eth: globalData?.data?.market_cap_percentage?.eth ?? prevLive?.dominance?.eth ?? null,
    };

    live.fearGreed = Number(fg?.data?.[0]?.value) || prevLive?.fearGreed || null;
    live.upbitBtcKrw = Array.isArray(upbit) ? upbit[0]?.trade_price ?? prevLive?.upbitBtcKrw : prevLive?.upbitBtcKrw;

    state.live = live;
    state.fx = {
      usdKrw: fx?.rates?.KRW ?? prevFx.usdKrw,
      delta: prevFx.delta,
    };
  } catch (error) {
    console.error("live fetch failed", error);
  } finally {
    renderAll();
  }
}

async function init() {
  state.live = fallbackLive;
  state.fx = fallbackFx;
  state.macroSnapshot = fallbackMacro;

  setupSidebarShell();
  setupCryptoTopControls();
  renderAll();

  try {
    await loadStatic();
  } catch (error) {
    console.error("static load failed", error);
  }

  renderAll();
  await fetchLive();
  setInterval(fetchLive, 60000);
}

init();
