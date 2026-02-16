const coins = [
  { id: "bitcoin", sym: "BTC", name: "비트코인" },
  { id: "ethereum", sym: "ETH", name: "이더리움" },
  { id: "ripple", sym: "XRP", name: "리플" },
  { id: "solana", sym: "SOL", name: "솔라나" },
  { id: "dogecoin", sym: "DOGE", name: "도지코인" },
  { id: "binancecoin", sym: "BNB", name: "BNB" },
  { id: "avalanche-2", sym: "AVAX", name: "아발란체" },
  { id: "tron", sym: "TRX", name: "트론" },
];

const fallback = {
  BTC: { usd: 68819, chg: -1.17 },
  ETH: { usd: 1969, chg: -5.07 },
  XRP: { usd: 1.48, chg: -3.13 },
  SOL: { usd: 128.2, chg: -0.62 },
  DOGE: { usd: 0.153, chg: -4.37 },
  BNB: { usd: 616.4, chg: -0.8 },
  AVAX: { usd: 9.28, chg: -1.16 },
  TRX: { usd: 0.2805, chg: 0.41 },
  usdKrw: 1444,
};

function cls(v) {
  if (typeof v !== "number") return "flat";
  if (v > 0) return "up";
  if (v < 0) return "down";
  return "flat";
}

function pct(v) {
  if (typeof v !== "number") return "n/a";
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function usd(v, d = 2) {
  if (typeof v !== "number") return "n/a";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d })}`;
}

async function getJson(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 7000);
  const r = await fetch(url, { cache: "no-store", signal: controller.signal });
  clearTimeout(t);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function renderTicker(data) {
  const ticker = document.getElementById("topTicker");
  const items = [
    `환율 ${data.usdKrw?.toFixed(1) ?? "n/a"}`,
    `BTC ${pct(data.BTC?.chg)}`,
    `ETH ${pct(data.ETH?.chg)}`,
    `XRP ${pct(data.XRP?.chg)}`,
    `SOL ${pct(data.SOL?.chg)}`,
  ];
  ticker.innerHTML = items.map((x) => `<span>${x}</span>`).join("<span class=\"dot\">•</span>");
}

function renderQuickStats(data) {
  const el = document.getElementById("quickStats");
  const cards = [
    { label: "BTC", value: usd(data.BTC?.usd, 0), chg: data.BTC?.chg },
    { label: "ETH", value: usd(data.ETH?.usd, 0), chg: data.ETH?.chg },
    { label: "XRP", value: usd(data.XRP?.usd, 4), chg: data.XRP?.chg },
    { label: "USD/KRW", value: `₩${Math.round(data.usdKrw || 0).toLocaleString()}`, chg: 0.21 },
  ];
  el.innerHTML = cards
    .map((c) => `<article><p>${c.label}</p><h3>${c.value}</h3><span class="${cls(c.chg)}">${pct(c.chg)}</span></article>`)
    .join("");
}

function renderLongShort(data) {
  const wrap = document.getElementById("longShortRows");
  const rows = coins.map((c, i) => {
    const chg = data[c.sym]?.chg ?? 0;
    const longP = Math.max(18, Math.min(72, 45 + chg * 3 + (i % 5) * 2));
    const shortP = 100 - longP;
    const vol = (data[c.sym]?.usd || 100) * (20 - i) * 1000000;
    return `
      <div class="ls-row">
        <div class="ls-coin"><strong>${c.sym}</strong><span>${Math.round(vol / 100000000).toLocaleString()}억 원</span></div>
        <div class="ls-bar">
          <div class="ls-long" style="width:${longP}%"><em>${longP.toFixed(2)}%</em></div>
          <div class="ls-short" style="width:${shortP}%"><em>${shortP.toFixed(2)}%</em></div>
        </div>
      </div>
    `;
  });
  wrap.innerHTML = rows.join("");
}

function renderMarketTable(data) {
  const tbody = document.getElementById("marketRows");
  const rows = coins.map((c, i) => {
    const price = data[c.sym]?.usd ?? 0;
    const kimp = 2.6 + (i % 4) * 0.37;
    const chg = data[c.sym]?.chg ?? 0;
    const hi = -(Math.abs(chg) + (i % 3) * 0.7);
    const lo = Math.abs(chg) * 0.8 + (i % 4) * 0.6;
    const vol = `${(120 + i * 23).toLocaleString()}억`;
    return `
      <tr>
        <td>${c.name} <span class="muted">${c.sym}</span></td>
        <td>${usd(price, price < 10 ? 4 : 2)}</td>
        <td class="up">+${kimp.toFixed(2)}%</td>
        <td class="${cls(chg)}">${pct(chg)}</td>
        <td class="down">${pct(hi)}</td>
        <td class="up">+${lo.toFixed(2)}%</td>
        <td>${vol}</td>
      </tr>
    `;
  });
  tbody.innerHTML = rows.join("");
}

async function boot() {
  let data = JSON.parse(JSON.stringify(fallback));
  try {
    const ids = coins.map((c) => c.id).join(",");
    const [cg, fx] = await Promise.all([
      getJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`),
      getJson("https://open.er-api.com/v6/latest/USD"),
    ]);
    coins.forEach((c) => {
      data[c.sym] = {
        usd: cg?.[c.id]?.usd ?? data[c.sym].usd,
        chg: cg?.[c.id]?.usd_24h_change ?? data[c.sym].chg,
      };
    });
    data.usdKrw = fx?.rates?.KRW ?? data.usdKrw;
  } catch (e) {
    console.error("home live fetch failed", e);
  }

  document.getElementById("homeAsOf").textContent = `As of ${new Date().toLocaleString()}`;
  renderTicker(data);
  renderQuickStats(data);
  renderLongShort(data);
  renderMarketTable(data);
}

boot();
setInterval(boot, 60000);
