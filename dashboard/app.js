const state = {
  snapshot: null,
  news: null,
  etf: null,
};

function formatDelta(delta) {
  if (typeof delta !== "number") return "n/a";
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`;
}

function deltaClass(delta) {
  if (typeof delta !== "number") return "flat";
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function usdBillions(n) {
  if (typeof n !== "number") return "n/a";
  return `$${(n / 1e9).toFixed(2)}B`;
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "card";

  const label = document.createElement("p");
  label.className = "label";
  label.textContent = item.label;

  const value = document.createElement("p");
  value.className = "value";
  value.textContent = item.value;

  const delta = document.createElement("p");
  delta.className = `delta ${deltaClass(item.delta)}`;
  delta.textContent = formatDelta(item.delta);

  card.append(label, value, delta);
  return card;
}

function renderCards(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  items.forEach((item) => container.appendChild(createCard(item)));
}

function renderHeatRows(indices, commodities) {
  const rows = [...indices, ...commodities];
  const max = rows.reduce((acc, cur) => Math.max(acc, Math.abs(cur.delta || 0)), 1);
  const wrap = document.getElementById("heatRows");
  wrap.innerHTML = "";

  rows.forEach((row) => {
    const line = document.createElement("div");
    line.className = "heat-row";

    const label = document.createElement("div");
    label.className = "heat-label";
    label.textContent = row.label;

    const track = document.createElement("div");
    track.className = "heat-track";

    const fill = document.createElement("div");
    fill.className = `heat-fill ${deltaClass(row.delta)}`;
    fill.style.width = `${(Math.abs(row.delta || 0) / max) * 100}%`;
    track.appendChild(fill);

    const val = document.createElement("div");
    val.className = `heat-val ${deltaClass(row.delta)}`;
    val.textContent = formatDelta(row.delta);

    line.append(label, track, val);
    wrap.appendChild(line);
  });
}

function renderNewsList(containerId, items) {
  const list = document.getElementById(containerId);
  list.innerHTML = "";

  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "데이터 없음";
    list.appendChild(li);
    return;
  }

  items.forEach((n) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = n.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = n.title;
    li.appendChild(a);

    const meta = document.createElement("span");
    meta.className = "news-meta";
    meta.textContent = n.pubDate || "n/a";
    li.appendChild(meta);

    list.appendChild(li);
  });
}

function updateAsOf() {
  const asOfText = document.getElementById("asOfText");
  const snapshotAsOf = state.snapshot?.asOf || "n/a";
  const newsAsOf = state.news?.updated_at || "n/a";
  const etfAsOf = state.etf?.updated_at || "n/a";
  asOfText.textContent = `As of Snapshot ${snapshotAsOf} | News ${newsAsOf} | ETF ${etfAsOf}`;
}

function renderStaticBlocks() {
  const snapshot = state.snapshot || { indices: [], commodities: [] };
  renderCards("indices", snapshot.indices || []);
  renderCards("commodities", snapshot.commodities || []);
  renderHeatRows(snapshot.indices || [], snapshot.commodities || []);
  renderNewsList("macroNews", state.news?.macro || []);
  renderNewsList("cryptoNews", state.news?.crypto || []);
  updateAsOf();
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json();
}

async function loadStaticData() {
  try {
    const [snapshot, news, etf] = await Promise.all([
      fetchJson("./data/snapshot.json"),
      fetchJson("./data/news.json"),
      fetchJson("./data/etf.json"),
    ]);
    state.snapshot = snapshot;
    state.news = news;
    state.etf = etf;
    renderStaticBlocks();
  } catch (err) {
    console.error("Failed to load static data", err);
  }
}

async function fetchRealtimeCrypto() {
  const ids = "bitcoin,ethereum,solana,ripple";
  const simpleUrl =
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const globalUrl = "https://api.coingecko.com/api/v3/global";
  const stableUrl =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=stablecoins&order=market_cap_desc&per_page=100&page=1&sparkline=false";

  try {
    const [simpleRes, globalRes, stableRes] = await Promise.all([
      fetch(simpleUrl, { cache: "no-store" }),
      fetch(globalUrl, { cache: "no-store" }),
      fetch(stableUrl, { cache: "no-store" }),
    ]);
    const [simple, globalData, stableCoins] = await Promise.all([
      simpleRes.json(),
      globalRes.json(),
      stableRes.json(),
    ]);

    const stableMcap = Array.isArray(stableCoins)
      ? stableCoins.reduce((acc, c) => acc + (c.market_cap || 0), 0)
      : null;

    const etf = state.etf || {};
    const etfBtc = etf.btc_us_spot_etf_net_inflow_usd_m;
    const etfEth = etf.eth_us_spot_etf_net_inflow_usd_m;
    const etfText =
      typeof etfBtc === "number" || typeof etfEth === "number"
        ? `BTC ${typeof etfBtc === "number" ? etfBtc.toFixed(1) : "n/a"}M / ETH ${
            typeof etfEth === "number" ? etfEth.toFixed(1) : "n/a"
          }M`
        : "n/a";

    const coreMetrics = [
      {
        label: "$TOTAL Crypto Market Cap",
        value: usdBillions(globalData?.data?.total_market_cap?.usd),
        delta: null,
      },
      {
        label: "스테이블 시총",
        value: usdBillions(stableMcap),
        delta: null,
      },
      {
        label: "크립토 ETF 자금 유입(일별)",
        value: etfText,
        delta: null,
      },
    ];

    const liveMap = [
      { key: "bitcoin", label: "BTC" },
      { key: "ethereum", label: "ETH" },
      { key: "solana", label: "SOL" },
      { key: "ripple", label: "XRP" },
    ];
    const cryptoLive = liveMap.map((m) => ({
      label: `${m.label} (USD)`,
      value:
        typeof simple?.[m.key]?.usd === "number"
          ? `$${simple[m.key].usd.toLocaleString()}`
          : "n/a",
      delta:
        typeof simple?.[m.key]?.usd_24h_change === "number"
          ? simple[m.key].usd_24h_change
          : null,
    }));

    renderCards("coreMetrics", coreMetrics);
    renderCards("cryptoLive", cryptoLive);
  } catch (err) {
    console.error("Failed to fetch realtime crypto", err);
  }
}

async function init() {
  await loadStaticData();
  await fetchRealtimeCrypto();
  setInterval(fetchRealtimeCrypto, 60 * 1000);
}

init();
