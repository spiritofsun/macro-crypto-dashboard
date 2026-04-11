const state = {
  snapshot: null,
  news: null,
  etf: null,
  status: null,
  macroSnapshot: null,
  cryptoUniverse: [],
  stocksWatchlist: [],
  live: null,
  fx: null,
};

const uiState = {
  cryptoSort: { key: "market_cap", dir: "desc" },
  cryptoCgLastFetchTs: 0,
  staticLastFetchTs: 0,
};

const STABLES = new Set(["USDT", "USDC", "DAI", "FDUSD", "TUSD", "USDE", "USDD", "FRAX"]);
const MODE_A = {
  apiBase: window.PROJECT_MARK_API_BASE || "https://project-mark-gateway.workers.dev",
};

const POLL_INTERVAL_MS = {
  home: 60_000,
  crypto: 90_000,
  stocks: 600_000,
  default: 300_000,
};

const fallbackLive = {
  BTC: { price: 89986.73, change: 1.41 },
  ETH: { price: 3125.32, change: 4.16 },
  SOL: { price: 132.63, change: 4.63 },
  dominance: { btc: 56.7, eth: 9.8 },
  fearGreed: 29,
  upbitBtcKrw: 102432000,
  coinbasePremiumPct: -0.09,
};

const fallbackFx = { usdKrw: 1444, delta: 0.22 };

const fallbackMacro = {
  as_of: "2026-02-16 09:31 KST",
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
    vix: { value: 21.34, delta: 4.18, display: "21.34" },
  },
  commodities: {
    gold: { value: 5034, delta: 0.23, display: "$5,034/oz" },
    silver: { value: 76.34, delta: -1.94, display: "$76.34/oz" },
    wti: { value: 57.33, delta: -0.16, display: "$57.33" },
    copper: { value: 5.77, delta: -0.33, display: "$5.77/lb" },
  },
  liquidity: {
    rrp: { value: 1.048, delta: -0.737, display: "1.048" },
    tga: { value: 915306, delta: 119158, display: "915,306" },
    repo: { value: 0.004, delta: 0.004, display: "0.004" },
    qt_status: "진행 중 (대차대조표 축소)",
  },
};

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

const longShortFallback = [
  { asset: "BTC", long: 38.57, short: 61.43 },
  { asset: "ETH", long: 34.98, short: 65.02 },
  { asset: "XRP", long: 27.28, short: 72.72 },
  { asset: "SOL", long: 25.68, short: 74.32 },
  { asset: "BNB", long: 40.32, short: 59.68 },
  { asset: "DOGE", long: 20.15, short: 79.85 },
];

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

function toNumSafe(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatBnDelta(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}bn`;
}

function formatIntDelta(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${Math.trunc(value).toLocaleString()}`;
}

function formatSigned(value, digits = 2, suffix = "") {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}${suffix}`;
}

function toneClass(value, neutralThreshold = 0.2) {
  if (typeof value !== "number" || Number.isNaN(value)) return "flat";
  if (Math.abs(value) < neutralThreshold) return "flat";
  return value > 0 ? "up" : "down";
}

function formatKstDateTime(input, fallback = "수집 대기") {
  if (!input) return fallback;
  if (typeof input === "string" && input.includes("KST")) return input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return fallback;
  const text = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return `${text} KST`;
}

function statusText(level) {
  if (level === "danger") return "지연";
  if (level === "warn") return "주의";
  if (level === "missing") return "누락";
  return "정상";
}

function statusTone(level) {
  if (level === "danger" || level === "missing") return "down";
  if (level === "warn") return "flat";
  return "up";
}

function parseDashboardDate(input) {
  if (!input || typeof input !== "string") return null;
  const direct = new Date(input);
  if (!Number.isNaN(direct.getTime())) return direct;

  const kstMatch = input.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) KST$/);
  if (!kstMatch) return null;
  const [, year, month, day, hour, minute] = kstMatch;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+09:00`);
}

function hoursSince(input) {
  const parsed = parseDashboardDate(input);
  if (!parsed) return null;
  return (Date.now() - parsed.getTime()) / 3_600_000;
}

function metricNeedsReview(metric, maxAgeHours = 6) {
  if (!metric || typeof metric !== "object") return false;
  if (metric.source !== "carry") return false;
  if (!metric.source_as_of) return true;
  const age = hoursSince(metric.source_as_of);
  return age === null || age > maxAgeHours;
}

function metricDisplay(metric, fallback = "—", maxAgeHours = 6) {
  if (!metric || typeof metric !== "object") return fallback;
  if (metricNeedsReview(metric, maxAgeHours)) return "검증 필요";
  return typeof metric.display === "string" && metric.display ? metric.display : fallback;
}

function setAsOf() {
  const snapshotAsOf = formatKstDateTime(state.snapshot?.asOf || state.macroSnapshot?.as_of, "n/a");
  const newsAsOfRaw = state.news?.updated_at || "";
  const etfAsOfRaw = state.etf?.updated_at || "";
  const newsAsOf = newsAsOfRaw.startsWith("1970-01-01") || !newsAsOfRaw ? "수집 대기" : formatKstDateTime(newsAsOfRaw);
  const etfAsOf = etfAsOfRaw.startsWith("1970-01-01") || !etfAsOfRaw ? "수집 대기" : formatKstDateTime(etfAsOfRaw);
  const liveTs = formatKstDateTime(new Date().toISOString(), "n/a");
  const text = `SNAPSHOT ${snapshotAsOf} | NEWS ${newsAsOf} | ETF ${etfAsOf} | LIVE ${liveTs}`;

  const asOf = document.getElementById("asOfText");
  if (asOf) asOf.textContent = text;

  const homeAsOf = document.getElementById("homeAsOf");
  if (homeAsOf) homeAsOf.textContent = text;

  const top = document.getElementById("globalSnapshotText");
  if (top) {
    top.innerHTML = `Snapshot ${snapshotAsOf} · News ${newsAsOf} · ETF ${etfAsOf} · <span class="live-dot">●</span> Live ${liveTs}`;
  }
}

function renderGlobalDataHealth() {
  const host = document.getElementById("globalDataHealth");
  if (!host) return;
  const datasets = state.status?.datasets || {};
  const entries = ["macro", "news", "etf"].map((key) => datasets[key]).filter(Boolean);
  if (!entries.length) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }

  host.hidden = false;
  host.innerHTML = entries
    .map((entry) => {
      const note = entry.critical_issue_count
        ? `검증 ${entry.critical_issue_count}건`
        : entry.issue_count
          ? `보류 ${entry.issue_count}건`
          : typeof entry.age_hours === "number"
            ? `${Math.round(entry.age_hours)}h`
            : "n/a";
      return `<article class="health-pill ${statusTone(entry.level)}"><span>${entry.label}</span><strong>${statusText(entry.level)}</strong><em>${note}</em></article>`;
    })
    .join("");
}

function cardHTML(item, index, topCount = 4) {
  const topClass = index < topCount ? " top-kpi" : "";
  return `
    <article class="metric-card${topClass}">
      <p class="metric-label">${item.label}</p>
      <p class="metric-value ${item.valueClass || ""}">${item.value}</p>
      <p class="metric-delta ${toneClass(item.delta, item.neutralThreshold ?? 0.2)}">${item.deltaText ?? formatPct(item.delta)}</p>
    </article>
  `;
}

function renderCards(targetId, items, options = {}) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const topCount = typeof options.topCount === "number" ? options.topCount : 4;
  el.innerHTML = items.map((item, idx) => cardHTML(item, idx, topCount)).join("");
}

function setupSidebarShell() {
  if (!document.querySelector(".top-snapshot-bar")) {
    const bar = document.createElement("div");
    bar.className = "top-snapshot-bar";
    bar.innerHTML = '<div class="top-snapshot-inner" id="globalSnapshotText">Snapshot n/a · News n/a · ETF n/a · <span class="live-dot">●</span> Live n/a</div>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

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

  const current = window.location.pathname.split("/").pop() || "index.html";
  sidebar.innerHTML = menu
    .map((item) => {
      const isActive = item.href.endsWith(current);
      const cls = item.href === "./index.html" ? `side-home ${isActive ? "active" : ""}`.trim() : `side-link ${isActive ? "active" : ""}`.trim();
      return `<a class="${cls}" href="${item.href}"><span class="side-ico">${item.icon}</span><span class="side-label">${item.label}</span></a>`;
    })
    .join("");

  if (!document.querySelector(".sidebar-toggle")) {
    const btn = document.createElement("button");
    btn.className = "sidebar-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "사이드바 토글");
    btn.textContent = "☰";
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
}

function normalizeCustomUniverse(items) {
  if (!Array.isArray(items)) return [];

  const typoMap = {
    "canton netowork": "Canton Network",
    "file": "Filecoin",
    "stable": "StablecoinBucket",
    "world": "World",
    "morph": "Morpho",
    "maple": "Maple Finance",
    "liena": "Linea",
  };

  const seen = new Set();
  const normalized = [];

  items.forEach((raw) => {
    const nameRaw = (raw.name || "").trim();
    const nameKey = nameRaw.toLowerCase();
    const fixedName = typoMap[nameKey] || nameRaw;
    const ticker = raw.ticker ? String(raw.ticker).trim().toUpperCase() : null;
    const key = `${ticker || ""}::${fixedName.toLowerCase()}`;
    if (seen.has(key)) return;

    seen.add(key);
    normalized.push({ ...raw, name: fixedName, ticker });
  });

  return normalized;
}

function renderHomeHub() {
  const snapshotStrip = document.getElementById("strategySnapshot");
  if (!snapshotStrip) return;

  const fg = state.live?.fearGreed;
  const vol = Math.abs(state.live?.BTC?.change || 0) + Math.abs(state.live?.ETH?.change || 0);
  const volText = vol > 8 ? "높음" : vol > 4 ? "보통" : "낮음";
  const riskText = typeof fg === "number" && fg < 25 ? "경고" : "정상";

  snapshotStrip.innerHTML = `
    <article class="snapshot-pill"><span class="label">오늘 바이어스</span><span class="value">중립</span></article>
    <article class="snapshot-pill"><span class="label">변동성 상태</span><span class="value">${volText}</span></article>
    <article class="snapshot-pill"><span class="label">리스크 경고</span><span class="value ${toneClass(typeof fg === "number" && fg < 25 ? -1 : 0)}">${riskText}</span></article>
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
      .map((r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num ${toneClass(r[2])}">${formatPct(r[2])}</td></tr>`)
      .join("");
  }

  const brief = document.getElementById("briefPreview");
  if (brief) {
    const top = state.news?.macro?.[0] || state.news?.crypto?.[0];
    const title = top?.title || "브리핑 수집 대기";
    const date = top?.pubDate || state.snapshot?.asOf || "n/a";
    brief.innerHTML = `
      <h3 class="brief-title">${title}</h3>
      <p class="brief-date">${date}</p>
      <ul class="brief-lines">
        <li>매크로·크립토·주식 시황 핵심 요약.</li>
        <li>변동성 구간에서 포지션 사이징 보수적 접근.</li>
        <li>동행 리스크(BTC-ETH, 위험자산) 점검 필요.</li>
      </ul>
    `;
  }
}

function renderNewsPage() {
  const feed = document.getElementById("newsFeed");
  if (!feed) return;

  const selected = document.querySelector('input[name="newsType"]:checked')?.value || "all";
  const macro = Array.isArray(state.news?.macro) ? state.news.macro.map((n) => ({ ...n, type: "macro" })) : [];
  const crypto = Array.isArray(state.news?.crypto) ? state.news.crypto.map((n) => ({ ...n, type: "crypto" })) : [];

  let merged = [...macro, ...crypto];
  if (selected !== "all") merged = merged.filter((n) => n.type === selected);

  if (merged.length === 0) {
    feed.innerHTML = "<li>뉴스 수집 중입니다 (다음 배치 업데이트 대기)</li>";
  } else {
    feed.innerHTML = merged
      .slice(0, 20)
      .map((n) => `<li><a href="${n.link}" target="_blank" rel="noopener noreferrer">[${n.type.toUpperCase()}] ${n.title}</a><span class="news-meta">${n.pubDate || "n/a"}</span></li>`)
      .join("");
  }

  const badges = document.getElementById("newsSourceBadges");
  if (badges) {
    const sources = [...new Set(merged.map((n) => {
      try {
        return new URL(n.link).hostname.replace("www.", "");
      } catch {
        return "source";
      }
    }))];

    badges.innerHTML = sources.length ? sources.map((s) => `<span class="source-badge">${s}</span>`).join("") : '<span class="source-badge">source</span>';
  }
}

function renderNewsOverview() {
  const lead = document.getElementById("newsLeadCard");
  const quick = document.getElementById("newsQuickStrip");
  if (!lead && !quick) return;

  const macro = Array.isArray(state.news?.macro) ? state.news.macro : [];
  const crypto = Array.isArray(state.news?.crypto) ? state.news.crypto : [];
  const top = macro[0] || crypto[0];

  if (lead) {
    lead.innerHTML = `
      <p class="page-lead-kicker">뉴스 브리핑</p>
      <h2>${top ? "가장 최근 업데이트가 반영된 상태입니다" : "뉴스 수집 대기 중입니다"}</h2>
      <p class="page-lead-body">${top ? top.title : "Google News 수집이 완료되면 매크로와 크립토 주요 헤드라인이 여기에 요약됩니다."}</p>
      <div class="page-lead-meta">
        <span>매크로 ${macro.length}건</span>
        <span>크립토 ${crypto.length}건</span>
      </div>
    `;
  }

  if (quick) {
    const items = [
      { label: "업데이트 상태", value: state.news?.updated_at ? "정상" : "대기", meta: formatKstDateTime(state.news?.updated_at, "수집 대기") },
      { label: "매크로 헤드라인", value: `${macro.length}건`, meta: macro[0]?.pubDate || "최근 기사 없음" },
      { label: "크립토 헤드라인", value: `${crypto.length}건`, meta: crypto[0]?.pubDate || "최근 기사 없음" },
      { label: "소스 구성", value: `${new Set([...macro, ...crypto].map((n) => { try { return new URL(n.link).hostname.replace("www.", ""); } catch { return "source"; } })).size || 0}개`, meta: "도메인 기준" },
    ];
    quick.innerHTML = items.map((item) => `<article class="page-quick-card"><p>${item.label}</p><strong>${item.value}</strong><span>${item.meta}</span></article>`).join("");
  }
}

function setupNewsControls() {
  document.querySelectorAll('input[name="newsType"]').forEach((input) => {
    if (input.dataset.bound) return;
    input.addEventListener("change", renderNewsPage);
    input.dataset.bound = "1";
  });
}

function cryptoSortKeyMap() {
  return {
    rank_in_custom: "rank_in_custom",
    ticker: "ticker",
    name: "name",
    price: "price",
    change_24h: "change_24h",
    market_cap: "market_cap",
    volume_24h: "volume_24h",
  };
}

function getFilteredCryptoRows() {
  const query = (document.getElementById("cryptoSearch")?.value || "").trim().toLowerCase();
  const moversOnly = Boolean(document.getElementById("moversOnly")?.checked);
  const hideStables = Boolean(document.getElementById("hideStables")?.checked);

  let rows = [...state.cryptoUniverse];

  if (query) {
    rows = rows.filter((r) => (r.ticker || "").toLowerCase().includes(query) || r.name.toLowerCase().includes(query));
  }

  if (moversOnly) {
    rows = rows.filter((r) => typeof r.change_24h === "number" && Math.abs(r.change_24h) >= 2);
  }

  if (hideStables) {
    rows = rows.filter((r) => !(STABLES.has((r.ticker || "").toUpperCase()) || (r.tags || []).includes("stablecoin") || (r.tags || []).includes("StablecoinBucket")));
  }

  const sortMap = cryptoSortKeyMap();
  const key = sortMap[uiState.cryptoSort.key] || "market_cap";
  const factor = uiState.cryptoSort.dir === "asc" ? 1 : -1;

  rows.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
    return String(av ?? "").localeCompare(String(bv ?? "")) * factor;
  });

  return rows;
}

function renderCryptoSummary() {
  const tbody = document.getElementById("cryptoSummaryRows");
  const shell = document.getElementById("cryptoSummaryShell");
  if (!tbody && !shell) return;

  const rows = state.cryptoUniverse.filter((r) => typeof r.market_cap === "number");
  const total = rows.reduce((s, r) => s + r.market_cap, 0);
  const stable = typeof state.snapshot?.stablecoin_market_cap === "number" ? state.snapshot.stablecoin_market_cap : (state.cryptoStableMcap || 0);
  const btcMcap = rows.find((r) => r.ticker === "BTC")?.market_cap || 0;
  const ethMcap = rows.find((r) => r.ticker === "ETH")?.market_cap || 0;
  const coinbasePremium = toNumSafe(state.live?.coinbasePremiumPct);
  const btcDominance = toNumSafe(state.live?.dominance?.btc) ?? toNumSafe(fallbackLive.dominance?.btc);
  const altDominance = typeof btcDominance === "number" ? 100 - btcDominance : null;

  const totals = {
    TOTAL: total,
    TOTALES: total - stable,
    TOTAL2: total - btcMcap,
    TOTAL2ES: total - btcMcap - stable,
    TOTAL3: total - btcMcap - ethMcap,
    TOTAL3ES: total - btcMcap - ethMcap - stable,
  };

  const summaryRows = [
    ["Stable 시총", formatBigNumber(stable), "스테이블코인 유동성"],
    ["BTC 도미넌스", typeof btcDominance === "number" ? `${btcDominance.toFixed(2)}%` : "—", "비트코인 시장 점유율"],
    ["알트코인 도미넌스", typeof altDominance === "number" ? `${altDominance.toFixed(2)}%` : "—", "100 - BTC.D"],
    ["Coinbase Premium", typeof coinbasePremium === "number" ? formatPct(coinbasePremium, 2) : "—", "BTC Coinbase vs 글로벌 평균"],
    ["TOTAL", formatBigNumber(totals.TOTAL), "전체 시총"],
    ["TOTALES", formatBigNumber(totals.TOTALES), "스테이블 제외"],
    ["TOTAL2", formatBigNumber(totals.TOTAL2), "BTC 제외"],
    ["TOTAL2ES", formatBigNumber(totals.TOTAL2ES), "BTC + 스테이블 제외"],
    ["TOTAL3", formatBigNumber(totals.TOTAL3), "BTC + ETH 제외"],
    ["TOTAL3ES", formatBigNumber(totals.TOTAL3ES), "BTC + ETH + 스테이블 제외"],
  ];

  const html = summaryRows
    .map(([label, value, note]) => `<tr><td>${label}</td><td class="num strong-num">${value}</td><td>${note}</td></tr>`)
    .join("");

  if (tbody) {
    tbody.innerHTML = html;
  } else {
    shell.innerHTML = `<div class="table-wrap"><table class="data-table compact-table crypto-summary-table"><tbody>${html}</tbody></table></div>`;
  }
}

function renderCryptoOverview() {
  const lead = document.getElementById("cryptoLeadCard");
  const quick = document.getElementById("cryptoQuickStrip");
  if (!lead && !quick) return;

  const rows = state.cryptoUniverse.filter((r) => typeof r.market_cap === "number");
  const btc = rows.find((r) => r.ticker === "BTC");
  const eth = rows.find((r) => r.ticker === "ETH");
  const btcDom = toNumSafe(state.live?.dominance?.btc) ?? toNumSafe(fallbackLive.dominance?.btc);
  const fearGreed = toNumSafe(state.live?.fearGreed) ?? toNumSafe(fallbackLive.fearGreed);
  const regime = typeof fearGreed === "number" && fearGreed < 30 ? "방어적 심리 우세" : typeof fearGreed === "number" && fearGreed > 60 ? "위험 선호 우세" : "중립 구간";

  if (lead) {
    lead.innerHTML = `
      <p class="page-lead-kicker">크립토 체온계</p>
      <h2>${regime}</h2>
      <p class="page-lead-body">커스텀 유니버스와 도미넌스, 스테이블 시총, 프리미엄 지표를 한 화면에서 읽을 수 있게 정리했습니다.</p>
      <div class="page-lead-meta">
        <span>BTC ${typeof btc?.price === "number" ? formatUsd(btc.price, 0) : "—"}</span>
        <span>ETH ${typeof eth?.price === "number" ? formatUsd(eth.price, 0) : "—"}</span>
        <span>BTC.D ${typeof btcDom === "number" ? `${btcDom.toFixed(2)}%` : "—"}</span>
      </div>
    `;
  }

  if (quick) {
    const items = [
      { label: "심리 지수", value: typeof fearGreed === "number" ? `${fearGreed}` : "—", meta: "Fear & Greed" },
      { label: "BTC 도미넌스", value: typeof btcDom === "number" ? `${btcDom.toFixed(2)}%` : "—", meta: "시장 점유율" },
      { label: "유니버스 규모", value: `${state.cryptoUniverse.length}종`, meta: "커스텀 리스트" },
      { label: "코인베이스 프리미엄", value: formatPct(toNumSafe(state.live?.coinbasePremiumPct), 2), meta: "BTC 기준" },
    ];
    quick.innerHTML = items.map((item) => `<article class="page-quick-card"><p>${item.label}</p><strong>${item.value}</strong><span>${item.meta}</span></article>`).join("");
  }
}

function renderDominanceHybrid() {
  const btcEl = document.getElementById("btcDomNum");
  const ethEl = document.getElementById("ethDomNum");
  const srcEl = document.getElementById("domSource");
  if (!btcEl || !ethEl) return;

  const btcDom = toNumSafe(state.live?.dominance?.btc) ?? toNumSafe(fallbackLive.dominance?.btc);
  const ethDom = toNumSafe(state.live?.dominance?.eth) ?? toNumSafe(fallbackLive.dominance?.eth);
  btcEl.textContent = typeof btcDom === "number" ? `${btcDom.toFixed(2)}%` : "—";
  ethEl.textContent = typeof ethDom === "number" ? `${ethDom.toFixed(2)}%` : "—";
  if (srcEl) srcEl.textContent = "source: coingecko";

  const host = document.getElementById("tvDominanceWidget");
  if (!host || host.dataset.mounted === "1") return;

  const container = document.createElement("div");
  container.className = "tradingview-widget-container";
  container.innerHTML = `
    <div class="tradingview-widget-container__widget"></div>
    <div class="tradingview-widget-copyright">
      <a href="https://www.tradingview.com/" rel="noopener noreferrer" target="_blank">TradingView</a>
    </div>
  `;
  host.appendChild(container);

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.text = JSON.stringify({
    autosize: true,
    symbol: "CRYPTOCAP:BTC.D",
    interval: "60",
    timezone: "Asia/Seoul",
    theme: "dark",
    style: "1",
    locale: "kr",
    allow_symbol_change: true,
    studies: ["STD;CRYPTOCAP:ETH.D"],
    hide_side_toolbar: false,
    withdateranges: true,
    support_host: "https://www.tradingview.com",
  });
  container.appendChild(script);
  host.dataset.mounted = "1";
}

function applyHybridPricesToUniverse(priceMap) {
  if (!priceMap || typeof priceMap !== "object") return;
  state.cryptoUniverse = state.cryptoUniverse.map((row) => {
    if (row?.disable_ticker_feed) return row;
    const ticker = (row.ticker || "").toUpperCase();
    if (!ticker || !priceMap[ticker]) return row;
    const live = priceMap[ticker];
    return {
      ...row,
      price: typeof live.price === "number" ? live.price : row.price,
      change_24h: typeof live.change_24h === "number" ? live.change_24h : row.change_24h,
      volume_24h: typeof live.volume_24h === "number" ? live.volume_24h : row.volume_24h,
      price_source: live.source || row.price_source || null,
    };
  });
}

async function fetchCoinGeckoMarketMap() {
  const endpoints = [1, 2, 3, 4].map(
    (page) =>
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false&price_change_percentage=24h`,
  );

  const settled = await Promise.allSettled(endpoints.map((url) => fetchJson(url)));
  const rows = settled
    .filter((x) => x.status === "fulfilled" && Array.isArray(x.value))
    .flatMap((x) => x.value);

  const bySymbol = new Map();
  const byName = new Map();
  const byId = new Map();

  rows.forEach((row) => {
    const symbol = String(row?.symbol || "").toUpperCase();
    const name = String(row?.name || "").trim().toLowerCase();
    const id = String(row?.id || "").trim().toLowerCase();
    const cap = toNumSafe(row?.market_cap) ?? -1;

    if (id) byId.set(id, row);

    // 중복 심볼은 시총이 더 큰 항목 우선.
    if (symbol) {
      const prev = bySymbol.get(symbol);
      const prevCap = toNumSafe(prev?.market_cap) ?? -1;
      if (!prev || cap > prevCap) bySymbol.set(symbol, row);
    }

    // 이름은 정확 매칭 1:1로 사용.
    if (name && !byName.has(name)) byName.set(name, row);
  });

  return { bySymbol, byName, byId };
}

function applyCoinGeckoFundamentals(marketMap) {
  if (!marketMap) return;
  state.cryptoUniverse = state.cryptoUniverse.map((row) => {
    const id = String(row?.coingecko_id || "").trim().toLowerCase();
    const symbol = String(row?.ticker || "").trim().toUpperCase();
    const name = String(row?.name || "").trim().toLowerCase();

    const m = (id && marketMap.byId.get(id)) || (name && marketMap.byName.get(name)) || (symbol && marketMap.bySymbol.get(symbol));
    if (!m) return row;

    const cgPrice = toNumSafe(m.current_price);
    const cgChange = toNumSafe(m.price_change_percentage_24h);
    const cgCap = toNumSafe(m.market_cap);
    const cgVol = toNumSafe(m.total_volume);

    // 거래소 우선 가격 정책 유지. 단, 가격이 비어있거나 ticker feed가 비활성인 경우에만 CG 가격 보강.
    const canPatchPrice = row.price == null || row.disable_ticker_feed === true;
    return {
      ...row,
      price: canPatchPrice && cgPrice !== null ? cgPrice : row.price,
      change_24h: canPatchPrice && cgChange !== null ? cgChange : row.change_24h,
      market_cap: cgCap !== null ? cgCap : row.market_cap,
      volume_24h: cgVol !== null ? cgVol : row.volume_24h,
      market_source: "coingecko",
    };
  });
}

async function refreshCryptoFundamentalsIfNeeded() {
  if (detectPageType() !== "crypto" || state.cryptoUniverse.length === 0) return;
  const now = Date.now();
  // 시총/거래량은 5분 주기로 보강
  if (now - uiState.cryptoCgLastFetchTs < 5 * 60 * 1000) return;

  try {
    const map = await fetchCoinGeckoMarketMap();
    applyCoinGeckoFundamentals(map);
    uiState.cryptoCgLastFetchTs = now;
  } catch (error) {
    console.warn("coingecko fundamentals fetch failed", error);
  }
}

async function fetchHybridPriceMapDirect(tickers) {
  const uniq = [...new Set((tickers || []).map((t) => String(t || "").trim().toUpperCase()).filter(Boolean))];
  if (uniq.length === 0) return {};

  const priceMap = {};
  const byTicker = {};
  uniq.forEach((t) => {
    byTicker[t] = { binance: null, bybit: null, okx: null };
  });

  const [binanceR, bybitR, okxR] = await Promise.allSettled([
    fetchJson("https://api.binance.com/api/v3/ticker/24hr"),
    fetchJson("https://api.bybit.com/v5/market/tickers?category=spot"),
    fetchJson("https://www.okx.com/api/v5/market/tickers?instType=SPOT"),
  ]);

  if (binanceR.status === "fulfilled" && Array.isArray(binanceR.value)) {
    const binanceMap = new Map(
      binanceR.value
        .filter((row) => String(row?.symbol || "").endsWith("USDT"))
        .map((row) => [String(row.symbol).slice(0, -4), row]),
    );
    uniq.forEach((t) => {
      const r = binanceMap.get(t);
      if (!r) return;
      byTicker[t].binance = {
        price: toNumSafe(r.lastPrice),
        change_24h: toNumSafe(r.priceChangePercent),
        volume_24h: toNumSafe(r.quoteVolume),
        source: "binance",
      };
    });
  }

  if (bybitR.status === "fulfilled" && Array.isArray(bybitR.value?.result?.list)) {
    const bybitMap = new Map(
      bybitR.value.result.list
        .filter((row) => String(row?.symbol || "").endsWith("USDT"))
        .map((row) => [String(row.symbol).slice(0, -4), row]),
    );
    uniq.forEach((t) => {
      const r = bybitMap.get(t);
      if (!r) return;
      const pct = toNumSafe(r.price24hPcnt);
      byTicker[t].bybit = {
        price: toNumSafe(r.lastPrice),
        change_24h: pct === null ? null : pct * 100,
        volume_24h: toNumSafe(r.turnover24h),
        source: "bybit",
      };
    });
  }

  if (okxR.status === "fulfilled" && Array.isArray(okxR.value?.data)) {
    const okxMap = new Map(
      okxR.value.data
        .filter((row) => String(row?.instId || "").endsWith("-USDT"))
        .map((row) => [String(row.instId).replace("-USDT", ""), row]),
    );
    uniq.forEach((t) => {
      const r = okxMap.get(t);
      if (!r) return;
      const last = toNumSafe(r.last);
      const open = toNumSafe(r.open24h);
      byTicker[t].okx = {
        price: last,
        change_24h: last !== null && open !== null && open !== 0 ? ((last - open) / open) * 100 : null,
        volume_24h: toNumSafe(r.volCcy24h),
        source: "okx",
      };
    });
  }

  uniq.forEach((t) => {
    const picked = byTicker[t].binance || byTicker[t].bybit || byTicker[t].okx;
    if (picked) priceMap[t] = picked;
  });

  return priceMap;
}

function renderCryptoTable() {
  const tbody = document.getElementById("cryptoCustomRows");
  if (!tbody) return;
  const head = document.getElementById("cryptoUniverseHead");
  const empty = document.getElementById("cryptoUniverseEmpty");

  const rows = getFilteredCryptoRows();
  if (head) {
    const gainers = rows.filter((r) => typeof r.change_24h === "number" && r.change_24h > 0).length;
    const losers = rows.filter((r) => typeof r.change_24h === "number" && r.change_24h < 0).length;
    const movers = rows.filter((r) => typeof r.change_24h === "number" && Math.abs(r.change_24h) >= 5).length;
    head.innerHTML = `
      <div class="crypto-filter-summary">
        <span>표시 <b>${rows.length}</b></span>
        <span>상승 <b class="up">${gainers}</b></span>
        <span>하락 <b class="down">${losers}</b></span>
        <span>급등락 <b class="flat">${movers}</b></span>
      </div>
    `;
  }

  if (rows.length === 0) {
    tbody.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  tbody.innerHTML = rows
    .map((r) => `
      <tr class="click-row" data-symbol="${(r.ticker || r.name).toUpperCase()}">
        <td>${r.rank_in_custom}</td>
        <td><strong>${r.ticker || "—"}</strong></td>
        <td>${r.name}</td>
        <td class="num">${typeof r.price === "number" ? formatUsd(r.price, r.price < 1 ? 4 : 2) : "—"}</td>
        <td class="num ${toneClass(r.change_24h)}">${formatPct(r.change_24h)}</td>
        <td class="num">${formatBigNumber(r.market_cap)}</td>
        <td class="num">${formatBigNumber(r.volume_24h)}</td>
      </tr>
    `)
    .join("");

  tbody.querySelectorAll("tr.click-row").forEach((row) => {
    row.addEventListener("click", () => {
      const symbol = row.dataset.symbol;
      if (!symbol) return;
      window.location.href = `/crypto/${symbol}`;
    });
  });
}

function setupCryptoControls() {
  ["cryptoSearch", "moversOnly", "hideStables", "cryptoSortSelect"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound) return;
    el.addEventListener("input", renderCryptoTable);
    el.addEventListener("change", renderCryptoTable);
    el.dataset.bound = "1";
  });

  const sortSelect = document.getElementById("cryptoSortSelect");
  if (sortSelect && !sortSelect.dataset.bound2) {
    sortSelect.addEventListener("change", () => {
      const [key, dir] = String(sortSelect.value || "market_cap:desc").split(":");
      uiState.cryptoSort.key = key || "market_cap";
      uiState.cryptoSort.dir = dir === "asc" ? "asc" : "desc";
      renderCryptoTable();
    });
    sortSelect.dataset.bound2 = "1";
  }
}

function renderStockMarketPage() {
  if (!document.getElementById("rateCards")) return;
  const macro = state.macroSnapshot || fallbackMacro;
  const macroAgeHours = hoursSince(macro.as_of);
  const vixMetric = (() => {
    const live = macro.indices?.vix;
    if ((toNumSafe(live?.value) ?? toNumSafe(live?.display)) !== null) return live;
    return fallbackMacro.indices.vix;
  })();
  const curve = (toNumSafe(macro.rates?.us10y?.value) ?? 0) - (toNumSafe(macro.rates?.us2y?.value) ?? 0);
  const dxyDelta = toNumSafe(macro.fx?.dxy?.delta) ?? 0;
  const rrpDelta = toNumSafe(macro.liquidity?.rrp?.delta) ?? 0;
  const equityBreadth = ((toNumSafe(macro.indices?.sp500?.delta) ?? 0) + (toNumSafe(macro.indices?.nasdaq?.delta) ?? 0)) / 2;
  const vixValue = toNumSafe(vixMetric?.value) ?? toNumSafe(vixMetric?.display) ?? 0;
  const silverFromSnapshot = (() => {
    const list = state.snapshot?.commodities;
    if (!Array.isArray(list)) return null;
    const item = list.find((x) => String(x?.label || "").toLowerCase().includes("silver"));
    if (!item) return null;
    return {
      value: toNumSafe(String(item.value || "").replace(/[^0-9.-]/g, "")),
      delta: toNumSafe(item.delta),
      display: item.value || "—",
    };
  })();
  const silver = macro.commodities?.silver || silverFromSnapshot || { value: null, delta: null, display: "—" };
  const vixDisplay = metricDisplay(vixMetric);
  const dxyDisplay = metricDisplay(macro.fx?.dxy);
  const goldDisplay = metricDisplay(macro.commodities?.gold);
  const silverDisplay = metricDisplay(macro.commodities?.silver, silver.display);
  const wtiDisplay = metricDisplay(macro.commodities?.wti);
  const copperDisplay = metricDisplay(macro.commodities?.copper);

  const leadCard = document.getElementById("macroLeadCard");
  if (leadCard) {
    const regime = equityBreadth >= 0.75 ? "위험 선호 확산" : equityBreadth <= -0.75 ? "방어 국면 강화" : "방향 탐색 구간";
    const regimeTone = equityBreadth >= 0.75 ? "up" : equityBreadth <= -0.75 ? "down" : "flat";
    const regimeBody = equityBreadth >= 0.75
      ? "미국 주가지수 모멘텀이 우세하고 변동성 압력은 상대적으로 제한된 구간입니다."
      : equityBreadth <= -0.75
        ? "주가지수 모멘텀이 약하고 달러와 변동성 변수에 더 민감한 구간입니다."
        : "방향성보다 금리와 달러 변화에 따라 해석이 빠르게 바뀌는 혼조 구간입니다.";
    leadCard.innerHTML = `
      <p class="macro-lead-kicker">시장 국면</p>
      <h2 class="${regimeTone}">${regime}</h2>
      <p class="macro-lead-body">${regimeBody}</p>
      <div class="macro-lead-meta">
        <span>S&P500/NASDAQ 평균 ${formatPct(equityBreadth)}</span>
        <span>VIX ${vixDisplay}</span>
        <span>USD/KRW ${macro.fx.usdkrw.display}</span>
      </div>
    `;
  }

  const miniGrid = document.getElementById("macroMiniGrid");
  if (miniGrid) {
    const items = [
      {
        label: "변동성",
        value: vixValue >= 24 ? "고변동성 경계" : vixValue >= 18 ? "주의 구간" : "안정권",
        tone: vixValue >= 24 ? "down" : vixValue >= 18 ? "flat" : "up",
        meta: `VIX ${vixDisplay}`,
      },
      {
        label: "달러",
        value: dxyDelta >= 0.3 ? "긴축 압력" : dxyDelta <= -0.3 ? "완화 신호" : "중립권",
        tone: dxyDelta >= 0.3 ? "down" : dxyDelta <= -0.3 ? "up" : "flat",
        meta: `DXY ${formatPct(dxyDelta)}`,
      },
      {
        label: "유동성",
        value: rrpDelta <= -5 ? "개선" : rrpDelta >= 5 ? "흡수 강화" : "안정 유지",
        tone: rrpDelta <= -5 ? "up" : rrpDelta >= 5 ? "down" : "flat",
        meta: `RRP ${formatBnDelta(rrpDelta)}`,
      },
      {
        label: "금리곡선",
        value: curve >= 0 ? "정상화" : "역전 지속",
        tone: curve >= 0 ? "up" : "down",
        meta: `10Y-2Y ${formatSigned(curve, 2, "%p")}`,
      },
    ];
    miniGrid.innerHTML = items
      .map((item) => `<article class="macro-mini-card"><p>${item.label}</p><strong class="${item.tone}">${item.value}</strong><span>${item.meta}</span></article>`)
      .join("");
  }

  const dataHealth = document.getElementById("macroDataHealth");
  if (dataHealth) {
    const issueCount = Number(macro?._health?.issue_count || 0);
    const criticalIssueCount = Number(macro?._health?.critical_issue_count || 0);
    if (criticalIssueCount > 0) {
      dataHealth.className = "data-health danger";
      dataHealth.hidden = false;
      dataHealth.innerHTML = `<strong>데이터 검증 필요</strong><span>현재 매크로 데이터에 검증되지 않은 핵심 항목이 ${criticalIssueCount}개 있습니다. 원자재/변동성 수치는 실제 시세와 다를 수 있습니다.</span>`;
    } else if (issueCount > 0) {
      dataHealth.className = "data-health warn";
      dataHealth.hidden = false;
      dataHealth.innerHTML = `<strong>부분 수집 보류</strong><span>현재 매크로 데이터 일부 항목이 이전 값을 유지하고 있습니다. 세부 수치 해석 전 상태 배너를 확인해 주세요.</span>`;
    } else if (typeof macroAgeHours === "number" && macroAgeHours >= 6) {
      const severity = macroAgeHours >= 24 ? "danger" : "warn";
      const ageText = macroAgeHours >= 48 ? `${Math.round(macroAgeHours / 24)}일` : `${Math.round(macroAgeHours)}시간`;
      dataHealth.className = `data-health ${severity}`;
      dataHealth.hidden = false;
      dataHealth.innerHTML = `<strong>데이터 갱신 지연</strong><span>마지막 매크로 스냅샷은 ${macro.as_of} 기준입니다. 현재 시점 대비 약 ${ageText} 지연되어 보일 수 있습니다.</span>`;
    } else {
      dataHealth.hidden = true;
      dataHealth.className = "data-health";
      dataHealth.textContent = "";
    }
  }

  const strip = document.getElementById("macroTopStrip");
  if (strip) {
    const cells = [
      { label: "NASDAQ", value: macro.indices.nasdaq.display, delta: macro.indices.nasdaq.delta },
      { label: "VIX", value: vixDisplay, delta: vixMetric?.delta ?? 0 },
      { label: "DXY", value: dxyDisplay, delta: macro.fx.dxy.delta },
      { label: "US10Y", value: macro.rates.us10y.display, delta: macro.rates.us10y.delta },
      { label: "RRP (bn)", value: macro.liquidity.rrp.display, delta: macro.liquidity.rrp.delta, rawDelta: formatBnDelta(macro.liquidity.rrp.delta) },
    ];
    strip.innerHTML = cells
      .map((c) => `<article class="snapshot-pill top-kpi"><span class="label">${c.label}</span><span class="value">${c.value}</span><span class="metric-delta ${toneClass(c.delta)}">${c.rawDelta || formatPct(c.delta)}</span></article>`)
      .join("");
  }

  const readGrid = document.getElementById("macroReadGrid");
  if (readGrid) {
    const reads = [
      {
        label: "주식",
        value: equityBreadth >= 0.75 ? "지수 참여도 개선" : equityBreadth <= -0.75 ? "지수 참여도 둔화" : "혼조 참여",
        detail: `S&P500 ${formatPct(macro.indices.sp500.delta)} / NASDAQ ${formatPct(macro.indices.nasdaq.delta)}`,
      },
      {
        label: "금리",
        value: curve >= 0 ? "장단기 금리차 재확대" : "단기 금리 부담 지속",
        detail: `US10Y ${macro.rates.us10y.display} / US2Y ${macro.rates.us2y.display}`,
      },
      {
        label: "환율",
        value: dxyDelta >= 0.3 ? "달러 부담" : dxyDelta <= -0.3 ? "달러 완화" : "중립",
        detail: `DXY ${dxyDisplay} / USDKRW ${macro.fx.usdkrw.display}`,
      },
      {
        label: "원자재",
        value: (toNumSafe(macro.commodities.gold.delta) ?? 0) > 0 ? "방어 수요 유지" : "방어 수요 약화",
        detail: `Gold ${goldDisplay} / WTI ${wtiDisplay}`,
      },
    ];
    readGrid.innerHTML = reads
      .map((item) => `<article class="macro-read-card"><p class="macro-read-label">${item.label}</p><strong>${item.value}</strong><span>${item.detail}</span></article>`)
      .join("");
  }

  renderCards("rateCards", [
    { label: "US10Y", value: macro.rates.us10y.display, delta: macro.rates.us10y.delta },
    { label: "US2Y", value: macro.rates.us2y.display, delta: macro.rates.us2y.delta },
    { label: "SOFR", value: macro.rates.sofr.display, delta: macro.rates.sofr.delta },
    { label: "IORB", value: macro.rates.iorb.display, delta: macro.rates.iorb.delta },
  ]);

  renderCards("fxCards", [
    { label: "DXY", value: dxyDisplay, delta: macro.fx.dxy.delta },
    { label: "USD/KRW", value: macro.fx.usdkrw.display, delta: macro.fx.usdkrw.delta },
  ]);

  const indexRows = document.getElementById("indexRows");
  if (indexRows) {
    const rows = [
      ["KOSPI", macro.indices.kospi.display, macro.indices.kospi.delta],
      ["KOSDAQ", macro.indices.kosdaq.display, macro.indices.kosdaq.delta],
      ["NASDAQ", macro.indices.nasdaq.display, macro.indices.nasdaq.delta],
      ["DOW", macro.indices.dow.display, macro.indices.dow.delta],
      ["Russell 2000", macro.indices.russell2000.display, macro.indices.russell2000.delta],
      ["S&P500", macro.indices.sp500.display, macro.indices.sp500.delta],
      ["VIX", vixDisplay, vixMetric?.delta ?? 0],
    ];
    indexRows.innerHTML = rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num ${toneClass(r[2])}">${formatPct(r[2])}</td></tr>`).join("");
  } else {
    renderCards("indexCards", [
      { label: "KOSPI", value: macro.indices.kospi.display, delta: macro.indices.kospi.delta },
      { label: "KOSDAQ", value: macro.indices.kosdaq.display, delta: macro.indices.kosdaq.delta },
      { label: "NASDAQ", value: macro.indices.nasdaq.display, delta: macro.indices.nasdaq.delta },
      { label: "DOW", value: macro.indices.dow.display, delta: macro.indices.dow.delta },
      { label: "Russell 2000", value: macro.indices.russell2000.display, delta: macro.indices.russell2000.delta },
      { label: "S&P500", value: macro.indices.sp500.display, delta: macro.indices.sp500.delta },
    ]);
  }

  renderCards("commodityCards", [
    { label: "GOLD", value: goldDisplay, delta: macro.commodities.gold.delta },
    { label: "SILVER", value: silverDisplay, delta: silver.delta },
    { label: "WTI", value: wtiDisplay, delta: macro.commodities.wti.delta },
    { label: "COPPER", value: copperDisplay, delta: macro.commodities.copper.delta },
  ]);

  const qeRows = document.getElementById("qeRows");
  if (qeRows) {
    const rows = [
      ["RRP (bn)", macro.liquidity.rrp.display, formatBnDelta(macro.liquidity.rrp.delta), macro.liquidity.rrp.delta > 0 ? "유동성 흡수 증가" : "유동성 흡수 감소"],
      ["TGA", macro.liquidity.tga.display, formatIntDelta(macro.liquidity.tga.delta), macro.liquidity.tga.delta > 0 ? "재무부 현금 증가" : "재무부 현금 감소"],
      ["REPO (bn)", macro.liquidity.repo.display, formatBnDelta(macro.liquidity.repo.delta), macro.liquidity.repo.delta > 0 ? "레포 공급 증가" : "보합"],
      ["QT", macro.liquidity.qt_status, "-", "상태"],
    ];
    qeRows.innerHTML = rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td>${r[3]}</td></tr>`).join("");
  }

  const watchRows = document.getElementById("stocksWatchRows");
  if (watchRows) {
    watchRows.innerHTML = (state.stocksWatchlist || [])
      .map((row) => `<tr><td>${row.group}</td><td>${row.name}</td><td>${row.ticker}</td><td class="num">${formatUsd(row.price)}</td><td class="num ${toneClass(row.change)}">${formatPct(row.change)}</td></tr>`)
      .join("");
  }
}

function renderEtfOverview() {
  const lead = document.getElementById("etfLeadCard");
  const quick = document.getElementById("etfQuickStrip");
  if (!lead && !quick) return;

  const btc = typeof state.etf?.btc_us_spot_etf_net_inflow_usd_m === "number" ? state.etf.btc_us_spot_etf_net_inflow_usd_m : -410.4;
  const eth = typeof state.etf?.eth_us_spot_etf_net_inflow_usd_m === "number" ? state.etf.eth_us_spot_etf_net_inflow_usd_m : -113.1;
  const date = state.etf?.date || "n/a";
  const combined = btc + eth;

  if (lead) {
    lead.innerHTML = `
      <p class="page-lead-kicker">ETF 흐름 요약</p>
      <h2>${combined >= 0 ? "현물 ETF 자금 유입 우세" : "현물 ETF 자금 유출 우세"}</h2>
      <p class="page-lead-body">BTC와 ETH 현물 ETF의 최신 순유입 흐름을 한 장에서 비교하도록 정리했습니다.</p>
      <div class="page-lead-meta">
        <span>기준일 ${date}</span>
        <span>BTC ${btc >= 0 ? "+" : ""}$${btc.toFixed(1)}M</span>
        <span>ETH ${eth >= 0 ? "+" : ""}$${eth.toFixed(1)}M</span>
      </div>
    `;
  }

  if (quick) {
    const items = [
      { label: "BTC 흐름", value: `${btc >= 0 ? "+" : ""}$${btc.toFixed(1)}M`, meta: btc >= 0 ? "순유입" : "순유출" },
      { label: "ETH 흐름", value: `${eth >= 0 ? "+" : ""}$${eth.toFixed(1)}M`, meta: eth >= 0 ? "순유입" : "순유출" },
      { label: "합산 흐름", value: `${combined >= 0 ? "+" : ""}$${combined.toFixed(1)}M`, meta: "BTC + ETH" },
      { label: "상태", value: state.etf?.freshness === "latest" ? "최신" : "보강값", meta: state.etf?.source || "source" },
    ];
    quick.innerHTML = items.map((item) => `<article class="page-quick-card"><p>${item.label}</p><strong>${item.value}</strong><span>${item.meta}</span></article>`).join("");
  }
}

function renderLongShortPage() {
  const tbody = document.getElementById("longShortRows");
  if (!tbody) return;
  const rows = longShortFallback.map((row) => {
    const delta = row.long - row.short;
    const status = row.short >= 70 ? "EXTREME" : row.short >= 60 ? "BIAS" : "NEUTRAL";
    const badgeClass = status === "EXTREME" ? "status-extreme" : status === "BIAS" ? "status-bias" : "status-neutral";
    return `
      <tr>
        <td>${row.asset}</td>
        <td>
          <div class="segbar">
            <span class="seg-midline"></span>
            <span class="seg-long" style="width:${row.long.toFixed(2)}%">${row.long.toFixed(2)}%</span>
            <span class="seg-short" style="width:${row.short.toFixed(2)}%">${row.short.toFixed(2)}%</span>
          </div>
        </td>
        <td class="num ${toneClass(delta)}">${formatPct(delta, 2)}</td>
        <td><span class="status-badge ${badgeClass}">${status}</span></td>
      </tr>
    `;
  });
  tbody.innerHTML = rows.join("");
}

function renderEtfFlows() {
  const el = document.getElementById("etfFlows");
  if (!el) return;

  const btc = typeof state.etf?.btc_us_spot_etf_net_inflow_usd_m === "number" ? state.etf.btc_us_spot_etf_net_inflow_usd_m : -410.4;
  const eth = typeof state.etf?.eth_us_spot_etf_net_inflow_usd_m === "number" ? state.etf.eth_us_spot_etf_net_inflow_usd_m : -113.1;
  const date = state.etf?.date || "n/a";
  const btcHistory = Array.isArray(state.etf?.btc_history_7d_usd_m) && state.etf.btc_history_7d_usd_m.length
    ? state.etf.btc_history_7d_usd_m
    : etfHistoryFallback.btc;
  const ethHistory = Array.isArray(state.etf?.eth_history_7d_usd_m) && state.etf.eth_history_7d_usd_m.length
    ? state.etf.eth_history_7d_usd_m
    : etfHistoryFallback.eth;

  const card = ({ title, flow, assets, history }) => {
    const maxAbs = Math.max(...history.map((h) => Math.abs(h.flow)), 1);
    const bars = history
      .map((h) => {
        const width = Math.max(6, (Math.abs(h.flow) / maxAbs) * 100);
        return `<div class="flow-row"><span>${h.date}</span><div class="flow-track"><div class="flow-fill ${toneClass(h.flow)}" style="width:${width}%"></div></div><span class="${toneClass(h.flow)}">${h.flow >= 0 ? "+" : ""}$${h.flow.toFixed(1)}M</span></div>`;
      })
      .join("");

    return `<article class="flow-card"><div class="flow-head"><p class="flow-title">${title}</p><p class="flow-status ${toneClass(flow)}">${flow < 0 ? "순유출" : "순유입"}</p></div><p class="flow-main ${toneClass(flow)}">${flow >= 0 ? "+" : ""}$${flow.toFixed(1)}M</p><p class="flow-meta">${date} | Assets: ${assets}</p><div class="flow-bars">${bars}</div></article>`;
  };

  el.innerHTML = [
    card({ title: "BTC Spot ETF", flow: btc, assets: "$82.86B", history: btcHistory }),
    card({ title: "ETH Spot ETF", flow: eth, assets: "$10.97B", history: ethHistory }),
  ].join("");
}

function renderAll() {
  setAsOf();
  renderGlobalDataHealth();
  renderHomeHub();
  renderNewsPage();
  renderNewsOverview();
  renderCryptoSummary();
  renderCryptoOverview();
  renderDominanceHybrid();
  renderCryptoTable();
  renderStockMarketPage();
  renderLongShortPage();
  renderEtfOverview();
  renderEtfFlows();
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const response = await fetch(url, { cache: "no-store", signal: controller.signal });
  clearTimeout(timer);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function detectPageType() {
  if (document.getElementById("pulseRows")) return "home";
  if (document.getElementById("cryptoCustomRows")) return "crypto";
  if (document.getElementById("rateCards")) return "stocks";
  return "default";
}

function getPollIntervalMs() {
  const page = detectPageType();
  return POLL_INTERVAL_MS[page] || POLL_INTERVAL_MS.default;
}

function normalizeGatewayPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  return {
    live: {
      BTC: { price: toNumSafe(payload?.btc?.price_usd), change: toNumSafe(payload?.btc?.change_24h_pct) },
      ETH: { price: toNumSafe(payload?.eth?.price_usd), change: toNumSafe(payload?.eth?.change_24h_pct) },
      SOL: { price: toNumSafe(payload?.sol?.price_usd), change: toNumSafe(payload?.sol?.change_24h_pct) },
      dominance: {
        btc: toNumSafe(payload?.dominance?.btc),
        eth: toNumSafe(payload?.dominance?.eth),
      },
      fearGreed: toNumSafe(payload?.fear_greed),
      upbitBtcKrw: toNumSafe(payload?.btc?.upbit_krw),
      coinbasePremiumPct: toNumSafe(payload?.coinbase?.premium_pct),
    },
    fx: {
      usdKrw: toNumSafe(payload?.fx?.usdkrw),
      delta: fallbackFx.delta,
    },
  };
}

async function loadStatic() {
  const [snapshot, news, etf, status, macro, universe, stocks] = await Promise.allSettled([
    fetchJson("./data/snapshot.json"),
    fetchJson("./data/news.json"),
    fetchJson("./data/etf.json"),
    fetchJson("./data/status.json"),
    fetchJson("./data/macro_snapshot.json"),
    fetchJson("./data/crypto_custom_universe.json"),
    fetchJson("./data/stocks_watchlist.json"),
  ]);

  state.snapshot = snapshot.status === "fulfilled" ? snapshot.value : null;
  state.news = news.status === "fulfilled" ? news.value : { macro: [], crypto: [] };
  state.etf = etf.status === "fulfilled" ? etf.value : null;
  state.status = status.status === "fulfilled" ? status.value : null;
  state.macroSnapshot = macro.status === "fulfilled" ? macro.value : fallbackMacro;
  state.cryptoUniverse = universe.status === "fulfilled" ? normalizeCustomUniverse(universe.value.assets || []) : [];
  state.cryptoStableMcap = universe.status === "fulfilled" ? universe.value.stablecoin_market_cap : 0;
  state.stocksWatchlist = stocks.status === "fulfilled" ? stocks.value.rows || [] : [];
  uiState.staticLastFetchTs = Date.now();
}

async function fetchLiveDirectFallback() {
  const ids = "bitcoin,ethereum,solana";
  const binance24h =
    "https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D";
  const cgSimple = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const cgGlobal = "https://api.coingecko.com/api/v3/global";
  const fgApi = "https://api.alternative.me/fng/?limit=1&format=json";
  const fxApi = "https://open.er-api.com/v6/latest/USD";
  const upbitBtcApi = "https://api.upbit.com/v1/ticker?markets=KRW-BTC";
  const coinbaseBtcApi = "https://api.coinbase.com/v2/prices/BTC-USD/spot";

  const prevLive = state.live || fallbackLive;

  try {
    const [binanceR, simpleR, globalR, fgR, fxR, upbitR, coinbaseBtcR] = await Promise.allSettled([
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
    const coinbaseBtc = coinbaseBtcR.status === "fulfilled" ? coinbaseBtcR.value : null;
    const globalBtcPrice = toNumSafe(simple?.bitcoin?.usd);
    const btcBinancePrice = toNumSafe(ticker?.BTCUSDT?.lastPrice);
    const btcBinancePct = toNumSafe(ticker?.BTCUSDT?.priceChangePercent);
    const ethBinancePrice = toNumSafe(ticker?.ETHUSDT?.lastPrice);
    const ethBinancePct = toNumSafe(ticker?.ETHUSDT?.priceChangePercent);
    const solBinancePrice = toNumSafe(ticker?.SOLUSDT?.lastPrice);
    const solBinancePct = toNumSafe(ticker?.SOLUSDT?.priceChangePercent);
    const coinbaseBtcPrice = toNumSafe(coinbaseBtc?.data?.amount);
    const coinbasePremiumPct =
      coinbaseBtcPrice !== null && globalBtcPrice !== null && globalBtcPrice !== 0
        ? ((coinbaseBtcPrice - globalBtcPrice) / globalBtcPrice) * 100
        : prevLive.coinbasePremiumPct;

    state.live = {
      BTC: {
        price: btcBinancePrice ?? simple?.bitcoin?.usd ?? prevLive.BTC.price,
        change: btcBinancePct ?? simple?.bitcoin?.usd_24h_change ?? prevLive.BTC.change,
      },
      ETH: {
        price: ethBinancePrice ?? simple?.ethereum?.usd ?? prevLive.ETH.price,
        change: ethBinancePct ?? simple?.ethereum?.usd_24h_change ?? prevLive.ETH.change,
      },
      SOL: {
        price: solBinancePrice ?? simple?.solana?.usd ?? prevLive.SOL.price,
        change: solBinancePct ?? simple?.solana?.usd_24h_change ?? prevLive.SOL.change,
      },
      dominance: {
        btc: globalData?.data?.market_cap_percentage?.btc ?? prevLive.dominance.btc,
        eth: globalData?.data?.market_cap_percentage?.eth ?? prevLive.dominance.eth,
      },
      fearGreed: Number(fg?.data?.[0]?.value) || prevLive.fearGreed,
      upbitBtcKrw: Array.isArray(upbit) ? upbit[0]?.trade_price ?? prevLive.upbitBtcKrw : prevLive.upbitBtcKrw,
      coinbasePremiumPct,
    };

    state.fx = {
      usdKrw: fx?.rates?.KRW ?? fallbackFx.usdKrw,
      delta: fallbackFx.delta,
    };

    if (detectPageType() === "crypto" && state.cryptoUniverse.length > 0) {
      const tickers = [
        ...new Set(
          state.cryptoUniverse
            .filter((row) => !row?.disable_ticker_feed)
            .map((row) => (row.ticker || "").toUpperCase())
            .filter(Boolean),
        ),
      ];
      const directMap = await fetchHybridPriceMapDirect(tickers);
      applyHybridPricesToUniverse(directMap);
    }
  } catch (error) {
    console.error("live fetch failed", error);
  } finally {
    renderAll();
  }
}

async function fetchLiveFromGateway() {
  const endpoint = `${MODE_A.apiBase}/api/live`;
  const payload = await fetchJson(endpoint);
  const normalized = normalizeGatewayPayload(payload);
  if (!normalized) {
    throw new Error("Invalid gateway payload");
  }

  const prevLive = state.live || fallbackLive;
  state.live = {
    BTC: {
      price: normalized.live.BTC.price ?? prevLive.BTC.price,
      change: normalized.live.BTC.change ?? prevLive.BTC.change,
    },
    ETH: {
      price: normalized.live.ETH.price ?? prevLive.ETH.price,
      change: normalized.live.ETH.change ?? prevLive.ETH.change,
    },
    SOL: {
      price: normalized.live.SOL.price ?? prevLive.SOL.price,
      change: normalized.live.SOL.change ?? prevLive.SOL.change,
    },
    dominance: {
      btc: normalized.live.dominance.btc ?? prevLive.dominance.btc,
      eth: normalized.live.dominance.eth ?? prevLive.dominance.eth,
    },
    fearGreed: normalized.live.fearGreed ?? prevLive.fearGreed,
    upbitBtcKrw: normalized.live.upbitBtcKrw ?? prevLive.upbitBtcKrw,
    coinbasePremiumPct: normalized.live.coinbasePremiumPct ?? prevLive.coinbasePremiumPct,
  };
  state.fx = {
    usdKrw: normalized.fx.usdKrw ?? fallbackFx.usdKrw,
    delta: normalized.fx.delta ?? fallbackFx.delta,
  };

  if (detectPageType() === "crypto" && state.cryptoUniverse.length > 0) {
    const tickers = [
      ...new Set(
        state.cryptoUniverse
          .filter((row) => !row?.disable_ticker_feed)
          .map((row) => (row.ticker || "").toUpperCase())
          .filter(Boolean),
      ),
    ];
    const pEndpoint = `${MODE_A.apiBase}/api/crypto-prices?tickers=${encodeURIComponent(tickers.join(","))}`;
    try {
      const pRes = await fetchJson(pEndpoint);
      applyHybridPricesToUniverse(pRes?.prices || {});
    } catch (priceError) {
      console.warn("crypto hybrid price fetch failed, fallback to direct", priceError);
      const directMap = await fetchHybridPriceMapDirect(tickers);
      applyHybridPricesToUniverse(directMap);
    }
  }
}

async function fetchLive() {
  try {
    await fetchLiveFromGateway();
  } catch (gatewayError) {
    console.warn("gateway fetch failed, fallback to direct sources", gatewayError);
    await fetchLiveDirectFallback();
  }

  try {
    if (!uiState.staticLastFetchTs || Date.now() - uiState.staticLastFetchTs > 5 * 60 * 1000) {
      await loadStatic();
    }
  } catch (error) {
    console.warn("periodic static refresh failed", error);
  }

  await refreshCryptoFundamentalsIfNeeded();
  renderAll();
}

async function init() {
  state.live = fallbackLive;
  state.fx = fallbackFx;

  setupSidebarShell();
  setupNewsControls();
  setupCryptoControls();
  renderAll();

  try {
    await loadStatic();
  } catch (error) {
    console.error("static load failed", error);
  }

  renderAll();
  await fetchLive();
  const pollMs = getPollIntervalMs();
  setInterval(() => {
    if (document.hidden) return;
    fetchLive();
  }, pollMs);
}

init();
