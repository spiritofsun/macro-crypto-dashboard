const state = {
  snapshot: null,
  news: null,
  etf: null,
  status: null,
  macroSnapshot: null,
  cryptoMarket: null,
  cryptoUniverse: [],
  stocksWatchlist: [],
  stablecoinSummary: null,
  live: null,
  fx: null,
};

const uiState = {
  cryptoSort: { key: "market_cap", dir: "desc" },
  smartMoneyTab: "buy",
  cryptoCgLastFetchTs: 0,
  globalCryptoLastFetchTs: 0,
  stablecoinLastFetchTs: 0,
  staticLastFetchTs: 0,
};

const STABLES = new Set(["USDT", "USDC", "DAI", "FDUSD", "TUSD", "USDE", "USDD", "FRAX", "USDS", "SUSDS", "SUSDE", "USDTB", "USDF", "USD1", "BFUSD", "USD0", "USDC.E", "STABLE"]);
const CRYPTO_SECTOR_BY_SYMBOL = {
  BTC: "Bitcoin", ETH: "Layer1", SOL: "Layer1", BNB: "Exchange/L1", XRP: "Payments", ADA: "Layer1", AVAX: "Layer1", SUI: "Layer1", TON: "Layer1", TRX: "Layer1",
  LINK: "Oracle", PYTH: "Oracle", UNI: "DeFi", AAVE: "DeFi", CRV: "DeFi", LDO: "DeFi", PENDLE: "DeFi", ENA: "DeFi", MORPHO: "DeFi", ONDO: "RWA",
  DOGE: "Meme", SHIB: "Meme", WLD: "AI", ICP: "AI", GRT: "AI/Data", NEAR: "AI/L1", SAND: "GameFi", HYPE: "Perp/DEX", MNT: "Layer2", OP: "Layer2", ARB: "Layer2", STRK: "Layer2", ZK: "Layer2", LINEA: "Layer2",
  XLM: "Payments", XMR: "Privacy", BCH: "Bitcoin", LTC: "Bitcoin", FIL: "Storage", AERO: "DeFi", SYRUP: "DeFi", SKY: "DeFi", OKB: "Exchange/L1",
};
const CRYPTO_CHAIN_BY_SYMBOL = {
  BTC: "Bitcoin", BCH: "Bitcoin", LTC: "Bitcoin", BSV: "Bitcoin", DOGE: "Dogecoin",
  ETH: "Ethereum", WETH: "Ethereum", WBTC: "Ethereum", WEETH: "Ethereum", WSTETH: "Ethereum", STETH: "Ethereum", RETH: "Ethereum", RSETH: "Ethereum", EZETH: "Ethereum", ETHFI: "Ethereum", ETHX: "Ethereum", LSETH: "Ethereum", LINK: "Ethereum", UNI: "Ethereum", AAVE: "Ethereum", LDO: "Ethereum", ENA: "Ethereum", PENDLE: "Ethereum", MORPHO: "Ethereum", ONDO: "Ethereum", SHIB: "Ethereum", PEPE: "Ethereum", GRT: "Ethereum", FET: "Ethereum", WLD: "Ethereum", MOG: "Ethereum", METH: "Ethereum", QNT: "Ethereum", DEXE: "Ethereum", PAXG: "Ethereum", XAUT: "Ethereum", SPX: "Ethereum", FLOKI: "Ethereum",
  SOL: "Solana", PYTH: "Solana", RAY: "Solana", JUP: "Solana", JLP: "Solana", BONK: "Solana", WIF: "Solana", PENGU: "Solana", JTO: "Solana", JITOSOL: "Solana", JUPSOL: "Solana", BNSOL: "Solana", MSOL: "Solana", MEW: "Solana", POPCAT: "Solana", TRUMP: "Solana", PUMP: "Solana",
  BNB: "BSC", BTCB: "BSC", WBNB: "BSC", CAKE: "BSC", FDUSD: "BSC", TWT: "BSC", ASTER: "BSC",
  TRX: "Tron", WTRX: "Tron", JST: "Tron", SUN: "Tron", BTT: "Tron", NFT: "Tron",
  TON: "TON", NOT: "TON", DOGS: "TON",
  ADA: "Cardano", AVAX: "Avalanche", SUI: "Sui", XRP: "XRP Ledger", XLM: "Stellar",
  HYPE: "Hyperliquid", MNT: "Mantle", OP: "Optimism", ARB: "Arbitrum", GMX: "Arbitrum", STRK: "Starknet", ZK: "ZKsync", LINEA: "Linea",
  NEAR: "Near", ATOM: "Cosmos", TIA: "Cosmos", INJ: "Cosmos", SEI: "Cosmos", OSMO: "Cosmos",
  POL: "Polygon", MATIC: "Polygon", AERO: "Base", VIRTUAL: "Base", BRETT: "Base", DEGEN: "Base", CBBTC: "Base", TBTC: "Base",
  ICP: "Internet Computer", FIL: "Filecoin", XMR: "Monero", TAO: "Bittensor", OKB: "OKX", CRO: "Cronos", KAS: "Kaspa", ALGO: "Algorand", APT: "Aptos",
  LEO: "Bitfinex", WBT: "WhiteBIT", ZEC: "Zcash", M: "MemeCore", CC: "Canton", HBAR: "Hedera", RAIN: "Arbitrum", SKY: "Ethereum", WLFI: "Ethereum", PI: "Pi", BGB: "Bitget", ETC: "Ethereum Classic", KCS: "KuCoin", KHYPE: "Hyperliquid", RENDER: "Solana", LBTC: "Ethereum", GT: "Gate", FLR: "Flare", VET: "VeChain", BDX: "Beldex", NIGHT: "Cardano", NEXO: "Ethereum", SIREN: "BSC", SOLVBTC: "BSC", DASH: "Dash", EDGE: "edgeX", VVV: "Base", STX: "Stacks", XTZ: "Tezos", XDC: "XDC", EOS: "EOS", "BTC.B": "Avalanche", LUNC: "Terra Classic", DCR: "Decred", MON: "Monad", IMX: "Immutable", GNO: "Gnosis", KAIA: "Kaia", "2Z": "Solana",
};
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
  dominance: { btc: null, eth: null },
  totalMarketCapUsd: null,
  fearGreed: null,
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
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  return `${sign}${abs.toLocaleString()}`;
}

function formatCompactUsd(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`;
  if (abs > 0) return `${sign}$${abs.toFixed(abs >= 10 ? 0 : 2)}`;
  return "$0";
}

function formatSignedCompactUsd(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  if (Math.abs(value) < 0.000001) return "$0";
  return `${value > 0 ? "+" : "-"}${formatCompactUsd(Math.abs(value))}`;
}

function formatKrw(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `₩${Math.round(value).toLocaleString()}`;
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function newsSourceFromLink(link) {
  try {
    return new URL(link).hostname.replace("www.", "");
  } catch {
    return "source";
  }
}

function stripNewsSource(title) {
  return String(title || "")
    .replace(/\s+-\s+[^-]+$/g, "")
    .replace(/\s+–\s+[^–]+$/g, "")
    .trim();
}

function localizeNewsTitle(title, type = "") {
  const text = stripNewsSource(title);
  const lower = text.toLowerCase();

  if (lower.includes("oil") && lower.includes("iran")) return "유가, 미국-이란 휴전 이슈를 주시하며 상승 출발";
  if (lower.includes("treasury") && lower.includes("cpi")) return "미 국채금리, 낮아진 근원 CPI와 2026년 1회 인하 기대 속 보합";
  if (lower.includes("inflation") && lower.includes("stock market")) return "물가 흐름, 주식시장 부담 요인으로 재부각";
  if (lower.includes("quantitative easing") || lower.includes("qe")) return "양적완화가 금속·원자재 시장에 미치는 영향 점검";
  if (lower.includes("cybersecurity") || lower.includes("anthropic")) return "미 재무부와 연준, AI 관련 사이버보안 위협 논의";
  if (lower.includes("crowdstrike")) return "크라우드스트라이크 주가 약세, 기술주 투자심리 점검 필요";
  if (lower.includes("sgov") || lower.includes("hike rates")) return "연준 금리 인상 가능성에 단기국채 ETF 관심";
  if (lower.includes("inflation report")) return "물가 발표를 앞두고 증시 변동성 경계";
  if (lower.includes("crypto miners") || lower.includes("miners")) return "AI 확산 속 크립토 채굴주 재평가 가능성";
  if (lower.includes("morgan stanley") && lower.includes("bitcoin")) return "모건스탠리, 비트코인 ETF 시장 진입 확대";
  if (lower.includes("bitcoin institutional") || lower.includes("institutional demand")) return "시장 불안 속 비트코인 기관 수요 확대";
  if (lower.includes("crypto etfs") || lower.includes("crypto trends")) return "크립토 ETF 시장의 핵심 트렌드 점검";
  if (lower.includes("cautious optimism")) return "크립토 시장, 신중한 낙관론 유지";
  if (lower.includes("crypto brief") || lower.includes("newsletter")) return "크립토 규제와 시장 주요 이슈 브리프";
  if (lower.includes("bitcoin etf")) return "비트코인 ETF 관련 신규 흐름 점검";
  if (type === "크립토") return `크립토 뉴스: ${text}`;
  if (type === "매크로") return `매크로 뉴스: ${text}`;
  return text || "제목 없음";
}

function newsImpactText(title, type = "") {
  const lower = String(title || "").toLowerCase();
  if (lower.includes("oil") || lower.includes("iran")) return "유가와 인플레이션 기대를 통해 금리·위험자산에 영향을 줄 수 있습니다.";
  if (lower.includes("treasury") || lower.includes("fed") || lower.includes("cpi") || lower.includes("inflation")) return "금리 경로와 달러 방향성이 핵심 확인 변수입니다.";
  if (lower.includes("bitcoin etf") || lower.includes("crypto etf") || lower.includes("institutional")) return "BTC 수급과 ETF 플로우 변화로 연결되는지 확인해야 합니다.";
  if (lower.includes("miners") || lower.includes("ai")) return "AI 테마와 크립토 관련주의 동조화 여부를 점검합니다.";
  if (type === "크립토") return "BTC·ETH 가격 반응과 도미넌스 변화를 함께 봐야 합니다.";
  return "지수, 금리, 달러가 같은 방향으로 반응하는지 확인합니다.";
}

function sentimentMeta(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return {
      label: "수집 대기",
      tone: "flat",
      summary: "심리 지수 데이터를 불러오는 중입니다.",
      position: 50,
    };
  }
  if (value <= 24) {
    return {
      label: "극단적 공포",
      tone: "down",
      summary: "공포가 강한 구간입니다. 반등보다 변동성 관리가 우선입니다.",
      position: value,
    };
  }
  if (value <= 44) {
    return {
      label: "공포",
      tone: "down",
      summary: "방어 심리가 우세합니다. BTC 지지선과 ETF 플로우 확인이 필요합니다.",
      position: value,
    };
  }
  if (value <= 55) {
    return {
      label: "중립",
      tone: "flat",
      summary: "방향성이 뚜렷하지 않습니다. 뉴스와 금리 변화에 민감한 구간입니다.",
      position: value,
    };
  }
  if (value <= 75) {
    return {
      label: "탐욕",
      tone: "up",
      summary: "위험선호가 우세합니다. 추세 지속 여부는 거래량과 ETF 수급이 중요합니다.",
      position: value,
    };
  }
  return {
    label: "극단적 탐욕",
    tone: "up",
    summary: "과열 가능성이 커진 구간입니다. 추격보다 리스크 관리가 필요합니다.",
    position: value,
  };
}

function getCryptoMarketValue(path) {
  if (!state.cryptoMarket || typeof state.cryptoMarket !== "object") return null;
  let cur = state.cryptoMarket;
  for (const key of path) {
    cur = cur?.[key];
    if (cur === undefined || cur === null) return null;
  }
  return toNumSafe(cur);
}

function getBtcDominance() {
  const live = toNumSafe(state.live?.dominance?.btc);
  return live !== null && live > 0 ? live : getCryptoMarketValue(["global", "btc_dominance"]);
}

function getEthDominance() {
  const live = toNumSafe(state.live?.dominance?.eth);
  return live !== null && live > 0 ? live : getCryptoMarketValue(["global", "eth_dominance"]);
}

function getTotalMarketCapUsd() {
  const live = toNumSafe(state.live?.totalMarketCapUsd);
  return live !== null && live > 0 ? live : getCryptoMarketValue(["global", "total_market_cap_usd"]);
}

function getFearGreedValue() {
  return toNumSafe(state.live?.fearGreed) ?? getCryptoMarketValue(["fear_greed", "value"]);
}

function getCoinbasePremiumPct() {
  return toNumSafe(state.live?.coinbasePremiumPct) ?? getCryptoMarketValue(["coinbase_premium", "pct"]);
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

function statusLabel(level) {
  if (level === "danger" || level === "missing") return "danger";
  if (level === "warn") return "warn";
  return "ok";
}

function formatAgeHours(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  if (value < 0.05) return "방금";
  if (value < 1) return `${Math.max(1, Math.round(value * 60))}분`;
  if (value < 24) return `${value.toFixed(value < 10 ? 1 : 0)}h`;
  return `${(value / 24).toFixed(1)}d`;
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

function metricIsCarry(metric) {
  return !!metric && typeof metric === "object" && metric.source === "carry";
}

function metricDisplay(metric, fallback = "—", maxAgeHours = 6) {
  if (!metric || typeof metric !== "object") return fallback;
  return typeof metric.display === "string" && metric.display ? metric.display : fallback;
}

function verifiedMetricDisplay(metric, fallback = "—") {
  if (metricIsCarry(metric)) return "검증 필요";
  return metricDisplay(metric, fallback);
}

function verifiedMetricDelta(metric, fallback = 0) {
  if (metricIsCarry(metric)) return null;
  return typeof metric?.delta === "number" && Number.isFinite(metric.delta) ? metric.delta : fallback;
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
  const entries = ["macro", "stocks", "snapshot", "news", "etf", "crypto_market", "crypto_universe"].map((key) => datasets[key]).filter(Boolean);
  if (!entries.length) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }

  const problemEntries = entries.filter((entry) => entry.level !== "ok");
  const okCount = entries.filter((entry) => entry.level === "ok").length;
  const warnCount = entries.filter((entry) => entry.level === "warn").length;
  const dangerCount = entries.filter((entry) => entry.level === "danger" || entry.level === "missing").length;
  const issueCount = entries.reduce((sum, entry) => sum + (entry.issue_count || 0) + (entry.critical_issue_count || 0), 0);
  const maxAge = Math.max(0, ...entries.map((entry) => (typeof entry.age_hours === "number" ? entry.age_hours : 0)));
  const overallTone = state.status?.overall === "ok" ? "up" : state.status?.overall === "danger" ? "down" : "flat";
  const overallClass = statusLabel(state.status?.overall);
  const summary = problemEntries.length
    ? `${problemEntries.map((entry) => entry.label).join(" · ")} 점검 필요`
    : "전체 데이터 정상 갱신";
  const nowKst = formatKstDateTime(new Date().toISOString(), "현재 시각 확인 중");
  const lastBuild = formatKstDateTime(state.status?.updated_at, "상태 파일 대기");
  const lastDataTs = entries
    .map((entry) => parseDashboardDate(entry.timestamp))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const lastDataUpdate = lastDataTs ? formatKstDateTime(lastDataTs.toISOString(), "데이터 시각 대기") : "데이터 시각 대기";
  const issueText = dangerCount ? `${dangerCount}개 지연/누락` : warnCount ? `${warnCount}개 주의` : "정상 갱신";
  const isHome = document.body.classList.contains("home-command-body");

  const entryDetail = (entry) => {
    const details = [];
    if (entry.carried_metrics?.length) details.push(`보류: ${entry.carried_metrics.slice(0, 3).join(", ")}${entry.carried_metrics.length > 3 ? " 외" : ""}`);
    if (entry.critical_metrics?.length) details.push(`위험: ${entry.critical_metrics.slice(0, 3).join(", ")}${entry.critical_metrics.length > 3 ? " 외" : ""}`);
    if (entry.market_date) details.push(`시장일 ${entry.market_date}`);
    if (entry.source) details.push(`소스 ${entry.source}`);
    if (entry.universe) details.push(entry.universe);
    if (entry.asset_count) details.push(`${entry.asset_count} assets`);
    if (typeof entry.macro_count === "number" || typeof entry.crypto_count === "number") details.push(`뉴스 ${entry.macro_count || 0}/${entry.crypto_count || 0}`);
    return details.length ? details.join(" · ") : entry.timestamp || "timestamp n/a";
  };

  host.hidden = false;
  if (!isHome) {
    host.innerHTML = `
      <article class="data-ops-mini ${overallTone} ${overallClass}">
        <div>
          <span class="data-ops-kicker">DATA OPS</span>
          <strong>데이터 갱신 상태</strong>
          <p>${summary}</p>
        </div>
        <dl>
          <div><dt>최근 데이터</dt><dd>${lastDataUpdate}</dd></div>
          <div><dt>최대 지연</dt><dd>${formatAgeHours(maxAge)}</dd></div>
          <div><dt>상태</dt><dd>${issueText}</dd></div>
        </dl>
        <span class="data-ops-status-pill ${overallClass}">${statusText(state.status?.overall)}</span>
      </article>
    `;
    return;
  }

  host.innerHTML = `
    <article class="data-ops-panel data-ops-compact ${overallTone} ${overallClass}">
      <header class="data-ops-topline">
        <div>
          <span class="data-ops-kicker">DATA OPS</span>
          <h2>데이터 갱신 상태</h2>
          <p>${summary}</p>
        </div>
        <strong class="data-ops-status-pill ${overallClass}">${statusText(state.status?.overall)}</strong>
      </header>

      <div class="data-ops-summary-row">
        <p><span>현재 시각</span><b>${nowKst}</b></p>
        <p><span>최근 데이터</span><b>${lastDataUpdate}</b></p>
        <p><span>상태 빌드</span><b>${lastBuild}</b></p>
        <p><span>최대 지연</span><b>${formatAgeHours(maxAge)}</b></p>
      </div>

      <div class="data-ops-score-row">
        <span class="ok">정상 ${okCount}</span>
        <span class="warn">주의 ${warnCount}</span>
        <span class="danger">지연 ${dangerCount}</span>
        <em>${issueCount ? `확인 항목 ${issueCount}건 · 자동 갱신 유지` : "병목 없이 정상 범위"}</em>
      </div>

      <details class="data-ops-details">
        <summary>
          <span>상세 데이터 상태</span>
          <b>${entries.length}개 소스</b>
        </summary>
        <div class="data-ops-table" role="table" aria-label="데이터 상태">
          <div class="data-ops-table-head" role="row">
            <span>데이터</span>
            <span>상태</span>
            <span>지연</span>
            <span>갱신 시각</span>
            <span>비고</span>
          </div>
          ${entries.map((entry) => {
            const note = entry.critical_issue_count
              ? `검증 ${entry.critical_issue_count}건`
              : entry.issue_count
                ? `보류 ${entry.issue_count}건`
                : formatAgeHours(entry.age_hours);
            return `
              <div class="data-ops-table-row ${statusLabel(entry.level)}" role="row">
                <b>${entry.label}</b>
                <strong>${statusText(entry.level)}</strong>
                <span>${note}</span>
                <time>${formatKstDateTime(entry.timestamp, "timestamp n/a")}</time>
                <small title="${escapeHtml(entryDetail(entry))}">${entryDetail(entry)}</small>
              </div>
            `;
          }).join("")}
        </div>
      </details>
    </article>
  `;
}

function renderCommandRightTicker() {
  const targets = document.querySelectorAll(".command-ticker-card .command-mini-tickers, #homeRightTicker");
  if (!targets.length) return;

  const macro = state.macroSnapshot || fallbackMacro;
  const btcKrw = state.live?.upbitBtcKrw || ((state.live?.BTC?.price || 0) * (state.fx?.usdKrw || fallbackFx.usdKrw));
  const tickerRows = [
    { label: "비트코인", icon: "₿", value: formatKrw(btcKrw), delta: state.live?.BTC?.change },
    { label: "나스닥", icon: "US", value: macro.indices?.nasdaq?.display || "—", delta: macro.indices?.nasdaq?.delta },
    { label: "VIX", icon: "VX", value: macro.indices?.vix?.display || "—", delta: macro.indices?.vix?.delta, invert: true },
    { label: "달러 환율", icon: "FX", value: `${Math.round(state.fx?.usdKrw || fallbackFx.usdKrw).toLocaleString()}원`, delta: state.fx?.delta ?? fallbackFx.delta },
  ];
  const html = tickerRows.map((item) => {
    const delta = toNumSafe(item.delta);
    const toneValue = item.invert && typeof delta === "number" ? -delta : delta;
    return `
      <p>
        <span><i>${item.icon}</i>${item.label}</span>
        <b>${item.value}</b>
        <em class="${toneClass(toneValue)}">${formatPct(delta, 2)}</em>
      </p>
    `;
  }).join("");

  targets.forEach((target) => {
    target.innerHTML = html;
  });
}

function renderCommandShellClock() {
  const clock = document.getElementById("commandClock");
  const date = document.getElementById("commandDate");
  if (!clock && !date) return;
  const now = new Date();
  if (clock) {
    clock.textContent = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
  }
  if (date) {
    date.innerHTML = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
    }).format(now);
  }
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
  const usesPortalShell = document.body.classList.contains("command-portal-body") || document.body.classList.contains("crypto-portal-body");
  if (!usesPortalShell && !document.querySelector(".top-snapshot-bar")) {
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
    { href: "./etf.html", label: "ETF Flows", icon: "🏦" },
    { href: "./news.html", label: "뉴스", icon: "📰" },
    { href: "./long-short.html", label: "롱/숏", icon: "⚖️" },
    { href: "./funding.html", label: "펀딩비", icon: "💸" },
    { href: "./exchanges.html", label: "거래소 프리미엄", icon: "🧾" },
    { href: "./ai-gpt-brief.html", label: "AI 브리핑", icon: "🤖" },
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

  const fg = getFearGreedValue();
  const vol = Math.abs(state.live?.BTC?.change || 0) + Math.abs(state.live?.ETH?.change || 0);
  const volText = vol > 8 ? "높음" : vol > 4 ? "보통" : "낮음";
  const riskText = typeof fg === "number" && fg < 25 ? "경고" : "정상";

  snapshotStrip.innerHTML = `
    <article class="snapshot-pill"><span class="label">시장 방향</span><span class="value flat">중립</span><small>강한 추세보다 확인 구간</small></article>
    <article class="snapshot-pill"><span class="label">변동성</span><span class="value ${volText === "높음" ? "down" : volText === "보통" ? "flat" : "up"}">${volText}</span><small>BTC/ETH 24H 변동 합산</small></article>
    <article class="snapshot-pill"><span class="label">리스크</span><span class="value ${toneClass(typeof fg === "number" && fg < 25 ? -1 : 0)}">${riskText}</span><small>공포·탐욕 ${typeof fg === "number" ? Math.round(fg) : "대기"}</small></article>
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

function renderAiBriefPage() {
  const statusHost = document.getElementById("aiBriefStatus");
  const sentimentHost = document.getElementById("aiSentimentGauge");
  const newsBriefHost = document.getElementById("aiNewsBriefGrid");
  const catalystHost = document.getElementById("aiCatalystList");
  const hubHost = document.getElementById("aiSummaryHub");
  if (!statusHost && !sentimentHost && !newsBriefHost && !catalystHost && !hubHost) return;

  if (statusHost) {
    const datasets = state.status?.datasets || {};
    const rows = [
      {
        label: "매크로 온도",
        value: statusText(datasets.macro?.level),
        tone: statusTone(datasets.macro?.level),
        meta: datasets.macro?.timestamp || "수집 대기",
      },
      {
        label: "뉴스 온도",
        value: statusText(datasets.news?.level),
        tone: statusTone(datasets.news?.level),
        meta: `매크로 ${datasets.news?.macro_count ?? 0} / 크립토 ${datasets.news?.crypto_count ?? 0}`,
      },
      {
        label: "ETF 온도",
        value: statusText(datasets.etf?.level),
        tone: statusTone(datasets.etf?.level),
        meta: datasets.etf?.market_date ? `시장일 ${datasets.etf.market_date}` : "시장일 확인 중",
      },
      {
        label: "브리핑",
        value: state.status?.overall === "ok" ? "생성 가능" : "점검 필요",
        tone: state.status?.overall === "ok" ? "up" : "flat",
        meta: formatKstDateTime(state.status?.updated_at, "상태 대기"),
      },
    ];

    statusHost.innerHTML = rows
      .map(
        (item) => `
          <article class="market-metric-card ai-status-card">
            <p>${item.label}</p>
            <strong class="${item.tone}">${item.value}</strong>
            <span>${item.meta}</span>
          </article>
        `,
      )
      .join("");
  }

  if (sentimentHost) {
    const value = getFearGreedValue();
    const meta = sentimentMeta(value);
    const displayValue = typeof value === "number" ? Math.round(value) : "—";
    const needle = Math.max(0, Math.min(100, meta.position));
    sentimentHost.innerHTML = `
      <div class="ai-gauge-card">
        <div class="ai-gauge-arc" style="--score:${needle}">
          <span class="ai-gauge-dot"></span>
          <div class="ai-gauge-center">
            <strong>${displayValue}</strong>
            <span class="${meta.tone}">${meta.label}</span>
          </div>
        </div>
        <p>${meta.summary}</p>
        <div class="ai-gauge-scale">
          <span>공포</span>
          <span>중립</span>
          <span>탐욕</span>
        </div>
      </div>
    `;
  }

  const macro = Array.isArray(state.news?.macro) ? state.news.macro.map((n) => ({ ...n, type: "매크로" })) : [];
  const crypto = Array.isArray(state.news?.crypto) ? state.news.crypto.map((n) => ({ ...n, type: "크립토" })) : [];
  const items = [...macro.slice(0, 4), ...crypto.slice(0, 4)].slice(0, 8);
  const btcDom = getBtcDominance();
  const fearGreed = getFearGreedValue();
  const premium = getCoinbasePremiumPct();
  const status = state.status?.overall || "warn";
  const hubTone = status === "ok" ? "up" : status === "danger" ? "down" : "flat";
  const briefingMode = status === "ok" ? "요약 생성 가능" : "데이터 점검 병행";
  const marketRead =
    typeof fearGreed === "number" && fearGreed < 30
      ? "방어적 심리가 우세합니다. 뉴스보다 데이터 지연과 ETF 수급 확인이 먼저입니다."
      : typeof fearGreed === "number" && fearGreed > 60
        ? "위험선호가 강합니다. 추세 지속 여부는 BTC 도미넌스와 거래량 확산으로 확인합니다."
        : "중립 구간입니다. 큰 방향성보다 섹터별 선별 흐름과 주요 뉴스 영향을 구분해야 합니다.";

  if (hubHost) {
    const topNews = items[0];
    hubHost.innerHTML = `
      <article class="ai-hub-main ${hubTone}">
        <p>AI Briefing Hub</p>
        <h2>${briefingMode}</h2>
        <span>${marketRead}</span>
      </article>
      <div class="ai-hub-grid">
        <article><p>핵심 뉴스</p><strong>${topNews ? escapeHtml(localizeNewsTitle(topNews.title, topNews.type)) : "뉴스 수집 대기"}</strong><span>${topNews ? escapeHtml(newsImpactText(topNews.title, topNews.type)) : "다음 업데이트를 기다립니다."}</span></article>
        <article><p>심리</p><strong>${typeof fearGreed === "number" ? Math.round(fearGreed) : "—"}</strong><span>Fear & Greed</span></article>
        <article><p>BTC 주도권</p><strong>${typeof btcDom === "number" ? `${btcDom.toFixed(2)}%` : "—"}</strong><span>도미넌스 확인</span></article>
        <article><p>프리미엄</p><strong>${formatPct(premium, 2)}</strong><span>Coinbase BTC</span></article>
      </div>
    `;
  }

  if (newsBriefHost) {
    const featured = items.slice(0, 2);
    newsBriefHost.innerHTML =
      featured.length > 0
        ? featured
            .map((item, index) => {
              const source = newsSourceFromLink(item.link);
              const koTitle = localizeNewsTitle(item.title, item.type);
              const impact = newsImpactText(item.title, item.type);
              return `
                <a class="ai-news-feature" href="${escapeHtml(item.link || "#")}" target="_blank" rel="noopener noreferrer">
                  <p>${index === 0 ? "메인 뉴스" : "보조 뉴스"} · ${item.type}</p>
                  <strong>${escapeHtml(koTitle)}</strong>
                  <span>${escapeHtml(impact)}</span>
                  <em>${escapeHtml(source)} · ${escapeHtml(formatKstDateTime(item.pubDate, "시간 미확인"))}</em>
                </a>
              `;
            })
            .join("")
        : '<article class="ai-news-feature"><p>뉴스 대기</p><strong>수집된 뉴스가 없습니다.</strong><span>다음 업데이트 대기</span></article>';
  }

  if (catalystHost) {
    catalystHost.innerHTML =
      items.length > 0
        ? items
            .map(
              (item) => `
                <li>
                  <span>${item.type}</span>
                  <a href="${escapeHtml(item.link || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(localizeNewsTitle(item.title, item.type))}</a>
                  <small>${escapeHtml(newsImpactText(item.title, item.type))}</small>
                  <em>${escapeHtml(newsSourceFromLink(item.link))} · ${escapeHtml(formatKstDateTime(item.pubDate, "시간 미확인"))}</em>
                </li>
              `,
            )
            .join("")
        : "<li>뉴스 데이터 수집 대기 중입니다.</li>";
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
  const fallbackTotal = rows.reduce((s, r) => s + r.market_cap, 0);
  const btcDominance = getBtcDominance();
  const ethDominance = getEthDominance();
  const liveTotal = getTotalMarketCapUsd();
  const total = liveTotal ?? (fallbackTotal > 0 ? fallbackTotal : null);
  const stable =
    toNumSafe(state.stablecoinSummary?.total) ??
    (typeof state.snapshot?.stablecoin_market_cap === "number" ? state.snapshot.stablecoin_market_cap : (state.cryptoStableMcap || 0));
  const btcMcap =
    typeof total === "number" && typeof btcDominance === "number"
      ? total * (btcDominance / 100)
      : rows.find((r) => r.ticker === "BTC")?.market_cap || 0;
  const ethMcap =
    typeof total === "number" && typeof ethDominance === "number"
      ? total * (ethDominance / 100)
      : rows.find((r) => r.ticker === "ETH")?.market_cap || 0;
  const coinbasePremium = getCoinbasePremiumPct();
  const btcExcludedShare = typeof btcDominance === "number" ? 100 - btcDominance : null;
  const exStableAltShare =
    typeof total === "number" && typeof stable === "number" && typeof btcMcap === "number" && total > stable
      ? ((total - stable - btcMcap) / (total - stable)) * 100
      : null;

  const totals = {
    TOTAL: total,
    TOTALES: total !== null ? total - stable : null,
    TOTAL2: total !== null ? total - btcMcap : null,
    TOTAL2ES: total !== null ? total - btcMcap - stable : null,
    TOTAL3: total !== null ? total - btcMcap - ethMcap : null,
    TOTAL3ES: total !== null ? total - btcMcap - ethMcap - stable : null,
  };

  const summaryRows = [
    ["Stable 시총", formatBigNumber(stable), state.stablecoinSummary ? "DefiLlama live" : "정적 데이터"],
    ["BTC 도미넌스", typeof btcDominance === "number" ? `${btcDominance.toFixed(2)}%` : "—", "CoinGecko global"],
    ["BTC 제외 비중", typeof btcExcludedShare === "number" ? `${btcExcludedShare.toFixed(2)}%` : "—", "100 - BTC.D, 스테이블 포함"],
    ["스테이블 제외 알트 비중", typeof exStableAltShare === "number" ? `${exStableAltShare.toFixed(2)}%` : "—", "(TOTAL - BTC - Stable) / (TOTAL - Stable)"],
    ["Coinbase Premium", typeof coinbasePremium === "number" ? formatPct(coinbasePremium, 2) : "—", "Coinbase BTC spot vs CoinGecko BTC"],
    ["TOTAL", formatBigNumber(totals.TOTAL), toNumSafe(state.live?.totalMarketCapUsd) ? "CoinGecko global" : "유니버스 합계"],
    ["TOTALES", formatBigNumber(totals.TOTALES), "CoinGecko TOTAL - DefiLlama Stable"],
    ["TOTAL2", formatBigNumber(totals.TOTAL2), "CoinGecko TOTAL - BTC 추정 시총"],
    ["TOTAL2ES", formatBigNumber(totals.TOTAL2ES), "CoinGecko TOTAL - BTC - DefiLlama Stable"],
    ["TOTAL3", formatBigNumber(totals.TOTAL3), "CoinGecko TOTAL - BTC - ETH 추정 시총"],
    ["TOTAL3ES", formatBigNumber(totals.TOTAL3ES), "CoinGecko TOTAL - BTC - ETH - DefiLlama Stable"],
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

function aggregateCryptoGroups(rows, mapping, fallbackLabel) {
  const grouped = new Map();
  rows.forEach((row) => {
    const ticker = String(row.ticker || "").toUpperCase();
    if (!ticker || STABLES.has(ticker)) return;
    const label = mapping[ticker] || fallbackLabel;
    const change = toNumSafe(row.change_24h);
    const volume = toNumSafe(row.volume_24h) ?? 0;
    const cap = toNumSafe(row.market_cap) ?? 0;
    if (!grouped.has(label)) {
      grouped.set(label, { label, count: 0, changeSum: 0, changeWeight: 0, volume: 0, marketCap: 0 });
    }
    const bucket = grouped.get(label);
    const weight = Math.max(cap, 1);
    bucket.count += 1;
    bucket.volume += volume;
    bucket.marketCap += cap;
    if (typeof change === "number") {
      bucket.changeSum += change * weight;
      bucket.changeWeight += weight;
    }
  });
  return [...grouped.values()].map((bucket) => ({
    ...bucket,
    avgChange: bucket.changeWeight ? bucket.changeSum / bucket.changeWeight : 0,
  }));
}

function renderCryptoBriefingExtras() {
  const flow = document.getElementById("cryptoFlowList");
  const trend = document.getElementById("cryptoTrendStrip");
  const marketRows = document.getElementById("cryptoMarketRows");
  const actionCards = document.getElementById("cryptoActionCards");
  const sentiment = document.getElementById("cryptoSentimentCards");
  const smartMoney = document.getElementById("cryptoSmartMoney");
  const topBottom = document.getElementById("cryptoTopBottom");
  const sectorPerformance = document.getElementById("cryptoSectorPerformance");
  const predictions = document.getElementById("cryptoPredictionList");
  const rsiMap = document.getElementById("cryptoRsiMap");
  const chainFlow = document.getElementById("cryptoChainFlow");
  const sideHot = document.getElementById("cryptoSideHot");
  const tagCloud = document.getElementById("cryptoTagCloud");
  const sideNews = document.getElementById("cryptoSideNews");
  const rightTicker = document.getElementById("cryptoRightTicker");
  const rightNews = document.getElementById("cryptoRightNews");
  const clock = document.getElementById("cryptoClock");
  const clockDate = document.getElementById("cryptoClockDate");
  const prevDay = document.getElementById("cryptoPrevDay");
  if (!flow && !trend && !marketRows && !actionCards && !sentiment && !smartMoney && !topBottom && !sectorPerformance && !predictions && !rsiMap && !chainFlow && !sideHot && !rightTicker) return;

  const rows = state.cryptoUniverse.filter((r) => typeof r.market_cap === "number");
  const coreRows = ["BTC", "ETH", "SOL", "HYPE"].map((t) => rows.find((r) => r.ticker === t)).filter(Boolean);
  const sortedMovers = [...rows]
    .filter((r) => typeof r.change_24h === "number")
    .sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h))
    .slice(0, 10);
  const gainers = [...rows].filter((r) => typeof r.change_24h === "number").sort((a, b) => b.change_24h - a.change_24h).slice(0, 5);
  const losers = [...rows].filter((r) => typeof r.change_24h === "number").sort((a, b) => a.change_24h - b.change_24h).slice(0, 5);
  const smartScore = (row) => {
    const change = toNumSafe(row.change_24h) ?? 0;
    const volume = toNumSafe(row.volume_24h) ?? 0;
    const cap = toNumSafe(row.market_cap) ?? 1;
    const turnover = cap > 0 ? volume / cap : 0;
    return change * 0.65 + Math.min(turnover * 100, 20) * 0.35;
  };
  const buyRows = [...rows].filter((r) => !STABLES.has(r.ticker)).sort((a, b) => smartScore(b) - smartScore(a)).slice(0, 7);
  const sellRows = [...rows].filter((r) => !STABLES.has(r.ticker)).sort((a, b) => smartScore(a) - smartScore(b)).slice(0, 8);
  const futuresRows = [...rows].filter((r) => typeof r.volume_24h === "number" && !STABLES.has(r.ticker)).sort((a, b) => b.volume_24h - a.volume_24h).slice(0, 6);
  const cryptoNews = Array.isArray(state.news?.crypto) ? state.news.crypto : [];
  const total = getTotalMarketCapUsd();
  const btcDom = getBtcDominance();
  const ethDom = getEthDominance();
  const fearGreed = getFearGreedValue();
  const premium = getCoinbasePremiumPct();
  const stable = toNumSafe(state.stablecoinSummary?.total) ?? toNumSafe(state.cryptoMarket?.stablecoins?.total_market_cap_usd);
  const rsiScore = (row) => Math.max(5, Math.min(95, Math.round(50 + (toNumSafe(row.change_24h) ?? 0) * 6)));
  const now = new Date();

  if (actionCards) {
    const inflowProxy = aggregateCryptoGroups(rows, CRYPTO_CHAIN_BY_SYMBOL, "미분류")
      .map((x) => ({ ...x, pressure: x.volume * (x.avgChange / 100) }))
      .filter((x) => x.label !== "미분류")
      .sort((a, b) => b.pressure - a.pressure)[0];
    const movers = rows.filter((r) => typeof r.change_24h === "number" && Math.abs(r.change_24h) >= 5).length;
    const ctas = [
      { href: "#sentiment", label: "심리 먼저", value: typeof fearGreed === "number" ? `${Math.round(fearGreed)}` : "—", meta: "Fear & Greed", tone: typeof fearGreed === "number" && fearGreed < 30 ? "down" : "flat" },
      { href: "#chainflow", label: "체인 수급", value: inflowProxy?.label || "관측 대기", meta: inflowProxy ? formatSignedCompactUsd(inflowProxy.pressure) : "$0", tone: inflowProxy?.pressure > 0 ? "up" : "flat" },
      { href: "#rsi", label: "과열/침체", value: `${movers}개`, meta: "±5% 이상 변동", tone: movers >= 20 ? "down" : "flat" },
      { href: "#universe", label: "상위 200", value: `${state.cryptoUniverse.length || rows.length}개`, meta: state.cryptoUniverseMeta?.source || "market data", tone: "up" },
    ];
    actionCards.innerHTML = ctas.map((x) => `
      <a class="crypto-cta-card ${x.tone}" href="${x.href}">
        <span>${x.label}</span>
        <strong>${x.value}</strong>
        <em>${x.meta}</em>
      </a>
    `).join("");
  }

  if (clockDate) {
    clockDate.textContent = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
    }).format(now);
  }

  if (prevDay) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    prevDay.textContent = `← ${new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(yesterday)}`;
  }

  if (clock) {
    clock.textContent = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
  }

  if (trend) {
    trend.innerHTML = sortedMovers
      .slice(0, 6)
      .map((r) => `
        <article class="portal-trend-card">
          <div><strong>${r.ticker || "—"}</strong><span>${r.name || ""}</span></div>
          <b class="${toneClass(r.change_24h)}">${formatPct(r.change_24h)}</b>
          <small>${typeof r.price === "number" ? formatUsd(r.price, r.price < 1 ? 4 : 2) : "—"} · ${formatBigNumber(r.market_cap)}</small>
        </article>
      `)
      .join("");
  }

  if (flow) {
    const items = [
      {
        label: "시장 규모",
        value: formatBigNumber(total),
        note: `BTC.D ${typeof btcDom === "number" ? `${btcDom.toFixed(2)}%` : "—"} · Stable ${formatBigNumber(stable)}`,
      },
      {
        label: "프리미엄",
        value: formatPct(getCoinbasePremiumPct(), 2),
        note: "Coinbase BTC spot vs CoinGecko BTC",
      },
      ...cryptoNews.map((item) => ({
        label: "뉴스",
        value: item.title || "헤드라인 수집 대기",
        note: item.source || "Google News",
      })),
    ].slice(0, 6);

    flow.innerHTML = items
      .map((item) => `
        <article class="crypto-flow-item">
          <p>${item.label}</p>
          <strong>${item.value}</strong>
          <span>${item.note}</span>
        </article>
      `)
      .join("");
  }

  if (marketRows) {
    const marketList = coreRows.length ? coreRows : rows.slice(0, 4);
    marketRows.innerHTML = marketList
      .map((r) => `
        <div class="portal-market-row">
          <span><b>${r.name || r.ticker}</b><em>${r.ticker || ""}</em></span>
          <span>${typeof r.price === "number" ? formatUsd(r.price, r.price < 1 ? 4 : 2) : "—"}</span>
          <span class="${toneClass(r.change_24h)}">${formatPct(r.change_24h)}</span>
          <span>${formatBigNumber(r.market_cap)}</span>
        </div>
      `)
      .join("");
  }

  if (sentiment) {
    const altSeason = typeof btcDom === "number" ? Math.max(0, Math.min(100, Math.round(100 - btcDom))) : null;
    const longShort = typeof premium === "number" ? Math.max(0, Math.min(100, Math.round(50 + premium * 120))) : null;
    const cards = [
      { label: "공포·탐욕", value: fearGreed, meta: typeof fearGreed === "number" && fearGreed < 30 ? "공포" : "중립" },
      { label: "알트코인 시즌", value: altSeason, meta: "BTC 제외 비중" },
      { label: "프리미엄 점수", value: longShort, meta: "Coinbase" },
    ];
    sentiment.innerHTML = cards
      .map((card) => {
        const v = typeof card.value === "number" ? Math.round(card.value) : null;
        return `
          <article class="portal-gauge-card">
            <div class="portal-gauge" style="--score:${v ?? 50}"><b>${v ?? "—"}</b></div>
            <p>${card.label}</p>
            <span>${card.meta}</span>
          </article>
        `;
      })
      .join("");
  }

  if (smartMoney) {
    const sourceRows = uiState.smartMoneyTab === "sell" ? sellRows : uiState.smartMoneyTab === "futures" ? futuresRows : buyRows;
    const maxAbs = Math.max(1, ...sourceRows.map((r) => Math.abs(smartScore(r))));
    smartMoney.innerHTML = sourceRows
      .map((r, idx) => {
        const change = toNumSafe(r.change_24h) ?? 0;
        const score = smartScore(r);
        const turnover = (toNumSafe(r.volume_24h) ?? 0) / Math.max(toNumSafe(r.market_cap) ?? 1, 1) * 100;
        const width = Math.max(8, Math.min(100, Math.abs(score) / maxAbs * 100));
        return `
          <div class="smart-money-row">
            <span>${idx + 1}</span>
            <b>${r.ticker || "—"}</b>
            <em>${r.name || ""} · 회전율 ${turnover.toFixed(1)}%</em>
            <strong class="${toneClass(change)}">${formatPct(change)}</strong>
            <i><u style="width:${width}%"></u></i>
          </div>
        `;
      })
      .join("");
    const buyCount = document.getElementById("smartBuyCount");
    const sellCount = document.getElementById("smartSellCount");
    const futuresCount = document.getElementById("smartFuturesCount");
    if (buyCount) buyCount.textContent = `${buyRows.length}개`;
    if (sellCount) sellCount.textContent = `${sellRows.length}개`;
    if (futuresCount) futuresCount.textContent = `${futuresRows.length}개`;
  }

  if (topBottom) {
    const block = (title, list, tone) => `
      <div class="top-bottom-card ${tone}">
        <h3>${title}</h3>
        ${list.map((r) => `<p><span>${r.ticker}</span><b>${formatPct(r.change_24h, 1)}</b></p>`).join("")}
      </div>
    `;
    topBottom.innerHTML = block("급등 TOP 5", gainers, "up") + block("급락 TOP 5", losers, "down");
  }

  if (sectorPerformance) {
    const sectors = aggregateCryptoGroups(rows, CRYPTO_SECTOR_BY_SYMBOL, "기타");
    const topSectors = sectors.filter((x) => x.count >= 1).sort((a, b) => b.avgChange - a.avgChange).slice(0, 5);
    const bottomSectors = sectors.filter((x) => x.count >= 1).sort((a, b) => a.avgChange - b.avgChange).slice(0, 5);
    const renderSector = (title, list, tone) => `
      <article class="sector-performance-card ${tone}">
        <h3>${title}</h3>
        ${list.map((x) => {
          const intensity = Math.min(100, Math.max(8, Math.abs(x.avgChange) * 12));
          return `<p><span>${x.label}<em>${x.count}개 · ${formatBigNumber(x.volume)}</em></span><b class="${toneClass(x.avgChange)}">${formatPct(x.avgChange, 1)}</b><i><u style="width:${intensity}%"></u></i></p>`;
        }).join("")}
      </article>
    `;
    sectorPerformance.innerHTML = sectors.length
      ? renderSector("상승 TOP 5", topSectors, "up") + renderSector("하락 TOP 5", bottomSectors, "down")
      : `<div class="crypto-empty-state">섹터 데이터 로딩 대기 중입니다. 데이터 번들이 없거나 네트워크 요청이 차단되면 표시됩니다.</div>`;
  }

  if (predictions) {
    const subjects = ["비트코인이 이번 주 도미넌스를 유지할까?", "ETH/BTC가 반등할까?", "스테이블 시총이 증가세를 유지할까?", "시장 심리가 공포 구간을 벗어날까?", "알트코인 거래량이 BTC를 앞지를까?"];
    predictions.innerHTML = subjects
      .map((title, idx) => {
        const odds = [58, 44, 63, 31, 27][idx];
        return `
          <article class="prediction-item">
            <b>${odds}%</b>
            <div><strong>${title}</strong><span>${odds >= 50 ? "YES 우세" : "NO 우세"} · 참고용 시장 시나리오</span></div>
          </article>
        `;
      })
      .join("");
  }

  if (rsiMap) {
    const rsiRows = rows
      .filter((r) => typeof r.change_24h === "number" && typeof r.market_cap === "number")
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 200);
    const labelSet = new Set([
      ...rsiRows.slice(0, 5).map((r) => r.ticker),
      ...gainers.slice(0, 4).map((r) => r.ticker),
      ...losers.slice(0, 4).map((r) => r.ticker),
    ]);
    rsiMap.innerHTML = rsiRows.length
      ? rsiRows
        .map((r, idx) => {
          const score = rsiScore(r);
          const left = rsiRows.length <= 1 ? 50 : 5 + idx * (90 / (rsiRows.length - 1));
          const tone = score >= 70 ? "hot" : score <= 30 ? "cold" : "mid";
          const size = idx < 20 ? "large" : idx < 80 ? "medium" : "small";
          return `<span class="rsi-dot ${tone} ${size}" title="${escapeHtml(r.ticker)} ${score}" style="left:${left.toFixed(2)}%; bottom:${score}%"><b>${score}</b>${labelSet.has(r.ticker) ? `<em>${r.ticker}</em>` : ""}</span>`;
        })
        .join("")
      : `<div class="crypto-empty-state">RSI 산점도는 시총 상위 200 데이터가 로딩되면 표시됩니다.</div>`;
  }

  if (chainFlow) {
    const groups = aggregateCryptoGroups(rows, CRYPTO_CHAIN_BY_SYMBOL, "미분류")
      .map((x) => ({ ...x, pressure: x.volume * (x.avgChange / 100) }));
    const knownChains = groups.filter((x) => x.label !== "미분류");
    const unknownChains = groups.find((x) => x.label === "미분류");
    const totalCount = groups.reduce((sum, x) => sum + x.count, 0);
    const knownCount = knownChains.reduce((sum, x) => sum + x.count, 0);
    const totalVolume = groups.reduce((sum, x) => sum + x.volume, 0);
    const coverage = totalCount ? Math.round((knownCount / totalCount) * 100) : 0;
    const positiveChains = knownChains.filter((x) => x.pressure > 0).sort((a, b) => b.pressure - a.pressure);
    const negativeChains = knownChains.filter((x) => x.pressure < 0).sort((a, b) => a.pressure - b.pressure);
    const rankedChains = [...knownChains].sort((a, b) => Math.abs(b.pressure) - Math.abs(a.pressure)).slice(0, 8);
    const maxAbsPressure = Math.max(1, ...knownChains.map((x) => Math.abs(x.pressure)));
    const rowWidth = (value) => Math.max(14, Math.min(100, (Math.abs(value) / maxAbsPressure) * 100));
    const laneRows = (items, kind) => {
      const selected = items.slice(0, 5);
      if (!selected.length) return `<div class="chain-flow-empty">관측된 ${kind === "inflow" ? "순유입" : "순유출"} 체인이 없습니다.</div>`;
      return selected.map((x) => `
        <div class="chain-flow-row ${kind}">
          <span><b>${escapeHtml(x.label)}</b><small>${x.count}개 · ${formatCompactUsd(x.volume)}</small></span>
          <div class="chain-flow-bar" style="--w:${rowWidth(x.pressure).toFixed(1)}%"><i></i></div>
          <em>${formatSignedCompactUsd(x.pressure)}</em>
        </div>
      `).join("");
    };
    const topInflow = positiveChains[0];
    const topOutflow = negativeChains[0];
    chainFlow.innerHTML = `
      <div class="chain-flow-board">
        <div class="chain-flow-summary">
          <article class="chain-flow-stat inflow">
            <span>순유입 1위</span>
            <b>${topInflow ? escapeHtml(topInflow.label) : "관측 없음"}</b>
            <em>${topInflow ? formatSignedCompactUsd(topInflow.pressure) : "$0"}</em>
          </article>
          <article class="chain-flow-stat outflow">
            <span>순유출 1위</span>
            <b>${topOutflow ? escapeHtml(topOutflow.label) : "관측 없음"}</b>
            <em>${topOutflow ? formatSignedCompactUsd(topOutflow.pressure) : "$0"}</em>
          </article>
          <article class="chain-flow-stat">
            <span>총 관측 거래대금</span>
            <b>${formatCompactUsd(totalVolume)}</b>
            <em>${totalCount.toLocaleString()}개 코인</em>
          </article>
          <article class="chain-flow-stat neutral">
            <span>분류 커버리지</span>
            <b>${coverage}%</b>
            <em>미분류 ${unknownChains ? unknownChains.count : 0}개</em>
          </article>
        </div>
        <div class="chain-flow-lanes">
          <section class="chain-flow-lane outflow">
            <div class="chain-flow-lane-head"><span>순유출</span><b>${negativeChains.length}개 체인</b></div>
            ${laneRows(negativeChains, "outflow")}
          </section>
          <section class="chain-flow-lane inflow">
            <div class="chain-flow-lane-head"><span>순유입</span><b>${positiveChains.length}개 체인</b></div>
            ${laneRows(positiveChains, "inflow")}
          </section>
        </div>
        <div class="chain-flow-table">
          <table>
            <thead><tr><th>체인</th><th>코인</th><th>거래대금</th><th>24h 평균</th><th>압력</th></tr></thead>
            <tbody>
              ${rankedChains.map((x) => `
                <tr>
                  <td>${escapeHtml(x.label)}</td>
                  <td>${x.count}개</td>
                  <td>${formatCompactUsd(x.volume)}</td>
                  <td class="${toneClass(x.avgChange, 0.1)}">${formatPct(x.avgChange, 2)}</td>
                  <td class="${toneClass(x.pressure, 1)}">${formatSignedCompactUsd(x.pressure)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        ${unknownChains ? `<div class="chain-flow-unknown">미분류 ${unknownChains.count}개 · ${formatCompactUsd(unknownChains.volume)} · 메인 flow lane에서는 제외</div>` : ""}
      </div>
    `;
  }

  if (sideHot) {
    sideHot.innerHTML = sortedMovers.slice(0, 5).map((r, idx) => `<p><b>${idx + 1}</b><span>${r.ticker} ${r.name || ""}</span><em class="${toneClass(r.change_24h)}">${formatPct(r.change_24h, 1)}</em></p>`).join("");
  }

  if (tagCloud) {
    const tags = new Map();
    rows.forEach((r) => (r.tags || []).forEach((tag) => tags.set(tag, (tags.get(tag) || 0) + 1)));
    tagCloud.innerHTML = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([tag, count]) => `<span>#${tag} <b>${count}</b></span>`).join("");
  }

  if (sideNews) {
    sideNews.innerHTML = cryptoNews.slice(0, 4).map((n, idx) => `<p><b>${idx + 1}</b><span>${localizeNewsTitle(n.title, "크립토") || "뉴스 수집 대기"}</span></p>`).join("");
  }

  if (rightNews) {
    const top = cryptoNews[0];
    rightNews.innerHTML = top
      ? `<article><strong>${localizeNewsTitle(top.title, "크립토")}</strong><p>${top.summary || newsImpactText(top.title, "크립토")}</p><span>${top.source || "Google News"}</span></article>`
      : `<article><strong>뉴스 수집 대기</strong><p>크립토 주요 헤드라인이 수집되면 이 영역에 표시됩니다.</p><span>Google News</span></article>`;
  }
}

function renderCryptoOverview() {
  const lead = document.getElementById("cryptoLeadCard");
  const quick = document.getElementById("cryptoQuickStrip");
  if (!lead && !quick) return;

  const rows = state.cryptoUniverse.filter((r) => typeof r.market_cap === "number");
  const btc = rows.find((r) => r.ticker === "BTC");
  const eth = rows.find((r) => r.ticker === "ETH");
  const btcDom = getBtcDominance();
  const ethDom = getEthDominance();
  const fearGreed = getFearGreedValue();
  const total = getTotalMarketCapUsd();
  const premium = getCoinbasePremiumPct();
  const regime = typeof fearGreed === "number" && fearGreed < 30 ? "방어적 심리 우세" : typeof fearGreed === "number" && fearGreed > 60 ? "위험 선호 우세" : "중립 구간";
  const regimeBody = typeof fearGreed === "number" && fearGreed < 30
    ? "심리 지표는 방어 구간입니다. 반등 신호보다 유동성, ETF 수급, BTC 도미넌스 변화를 먼저 확인하는 구간입니다."
    : typeof fearGreed === "number" && fearGreed > 60
      ? "위험 선호가 살아난 구간입니다. 추세 지속 여부는 거래량과 스테이블 시총 흐름으로 확인합니다."
      : "방향성은 중립입니다. BTC 주도권과 알트 확산 여부를 함께 확인해야 합니다.";

  if (lead) {
    lead.innerHTML = `
      <p class="page-lead-kicker">Daily Crypto Briefing</p>
      <h2>${regime}</h2>
      <p class="page-lead-body">${regimeBody}</p>
      <div class="page-lead-meta">
        <span>BTC ${typeof btc?.price === "number" ? formatUsd(btc.price, 0) : "—"}</span>
        <span>ETH ${typeof eth?.price === "number" ? formatUsd(eth.price, 0) : "—"}</span>
        <span>BTC.D ${typeof btcDom === "number" ? `${btcDom.toFixed(2)}%` : "—"}</span>
      </div>
    `;
  }

  if (quick) {
    const items = [
      { label: "TOTAL", value: formatBigNumber(total), meta: "CoinGecko global" },
      { label: "심리 지수", value: typeof fearGreed === "number" ? `${fearGreed}` : "—", meta: "Fear & Greed" },
      { label: "BTC 도미넌스", value: typeof btcDom === "number" ? `${btcDom.toFixed(2)}%` : "—", meta: `ETH.D ${typeof ethDom === "number" ? `${ethDom.toFixed(2)}%` : "—"}` },
      { label: "코인베이스 프리미엄", value: formatPct(premium, 2), meta: "BTC 기준" },
    ];
    quick.innerHTML = items.map((item) => `<article class="page-quick-card"><p>${item.label}</p><strong>${item.value}</strong><span>${item.meta}</span></article>`).join("");
  }

  renderCryptoBriefingExtras();
}

function renderDominanceHybrid() {
  const btcEl = document.getElementById("btcDomNum");
  const ethEl = document.getElementById("ethDomNum");
  const srcEl = document.getElementById("domSource");
  if (!btcEl || !ethEl) return;

  const btcDom = getBtcDominance();
  const ethDom = getEthDominance();
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
    const target = state.cryptoUniverseMeta?.target || 200;
    const source = state.cryptoUniverseMeta?.source || "market data";
    head.innerHTML = `
      <div class="crypto-filter-summary">
        <span>대상 <b>시총 상위 ${target}</b></span>
        <span>표시 <b>${rows.length}</b></span>
        <span>상승 <b class="up">${gainers}</b></span>
        <span>하락 <b class="down">${losers}</b></span>
        <span>급등락 <b class="flat">${movers}</b></span>
        <span>소스 <b>${source}</b></span>
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
        <td><span class="rank-badge">${r.rank_in_custom}</span></td>
        <td><strong class="ticker-badge">${r.ticker || "—"}</strong></td>
        <td><b class="asset-name">${r.name}</b><small>${(r.tags || []).slice(0, 2).join(" · ")}</small></td>
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

  const smartTabs = document.getElementById("smartMoneyTabs");
  if (smartTabs && !smartTabs.dataset.bound) {
    smartTabs.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-smart-tab]");
      if (!button) return;
      uiState.smartMoneyTab = button.dataset.smartTab || "buy";
      smartTabs.querySelectorAll("button").forEach((tab) => tab.classList.toggle("active", tab === button));
      renderCryptoBriefingExtras();
    });
    smartTabs.dataset.bound = "1";
  }
}

function renderStockMarketPage() {
  if (!document.getElementById("rateCards")) return;
  const macro = state.macroSnapshot || fallbackMacro;
  const macroAgeHours = hoursSince(macro.as_of);
  const vixMetric = macro.indices?.vix || fallbackMacro.indices.vix;
  const curve = (toNumSafe(macro.rates?.us10y?.value) ?? 0) - (toNumSafe(macro.rates?.us2y?.value) ?? 0);
  const dxyDelta = toNumSafe(macro.fx?.dxy?.delta) ?? 0;
  const rrpDelta = toNumSafe(macro.liquidity?.rrp?.delta) ?? 0;
  const equityBreadth = ((toNumSafe(macro.indices?.sp500?.delta) ?? 0) + (toNumSafe(macro.indices?.nasdaq?.delta) ?? 0)) / 2;
  const vixValue = metricIsCarry(vixMetric) ? null : (toNumSafe(vixMetric?.value) ?? toNumSafe(vixMetric?.display));
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
  const vixDisplay = verifiedMetricDisplay(vixMetric);
  const dxyDisplay = verifiedMetricDisplay(macro.fx?.dxy);
  const goldDisplay = verifiedMetricDisplay(macro.commodities?.gold);
  const silverDisplay = verifiedMetricDisplay(macro.commodities?.silver, silver.display);
  const wtiDisplay = verifiedMetricDisplay(macro.commodities?.wti);
  const copperDisplay = verifiedMetricDisplay(macro.commodities?.copper);
  const vixDelta = verifiedMetricDelta(vixMetric);
  const wtiDelta = verifiedMetricDelta(macro.commodities?.wti);
  const marketCard = (item) => `
    <article class="macro-mini-card market-metric-card">
      <p>${item.label}</p>
      <strong class="${item.tone || ""}">${item.value}</strong>
      <span class="metric-delta ${toneClass(item.delta)}">${item.rawDelta || formatPct(item.delta)}</span>
    </article>
  `;
  const renderMarketCards = (targetId, items) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = items.map(marketCard).join("");
  };

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
        value: vixValue === null ? "검증 필요" : vixValue >= 24 ? "고변동성 경계" : vixValue >= 18 ? "주의 구간" : "안정권",
        tone: vixValue === null ? "flat" : vixValue >= 24 ? "down" : vixValue >= 18 ? "flat" : "up",
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
    if (typeof macroAgeHours === "number" && macroAgeHours >= 24) {
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
      { label: "VIX", value: vixDisplay, delta: vixDelta },
      { label: "DXY", value: dxyDisplay, delta: macro.fx.dxy.delta },
      { label: "US10Y", value: macro.rates.us10y.display, delta: macro.rates.us10y.delta },
      { label: "RRP (bn)", value: macro.liquidity.rrp.display, delta: macro.liquidity.rrp.delta, rawDelta: formatBnDelta(macro.liquidity.rrp.delta) },
    ];
    strip.innerHTML = cells.map(marketCard).join("");
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

  renderMarketCards("rateCards", [
    { label: "US10Y", value: macro.rates.us10y.display, delta: macro.rates.us10y.delta },
    { label: "US2Y", value: macro.rates.us2y.display, delta: macro.rates.us2y.delta },
    { label: "SOFR", value: macro.rates.sofr.display, delta: macro.rates.sofr.delta },
    { label: "IORB", value: macro.rates.iorb.display, delta: macro.rates.iorb.delta },
  ]);

  renderMarketCards("fxCards", [
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
      ["VIX", vixDisplay, vixDelta],
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
    { label: "WTI", value: wtiDisplay, delta: wtiDelta },
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
  renderCommandShellClock();
  renderGlobalDataHealth();
  renderCommandRightTicker();
  renderHomeHub();
  renderNewsPage();
  renderNewsOverview();
  renderAiBriefPage();
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

function getBundledStaticData(key) {
  const bundle = window.__DASHBOARD_DATA__;
  if (!bundle || !Object.prototype.hasOwnProperty.call(bundle, key)) return undefined;
  return bundle[key];
}

function cloneStaticData(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

async function fetchStaticJson(url, key) {
  const bundled = getBundledStaticData(key);
  if (window.location.protocol === "file:" && bundled !== undefined) {
    return cloneStaticData(bundled);
  }
  try {
    return await fetchJson(url);
  } catch (error) {
    if (bundled !== undefined) return cloneStaticData(bundled);
    throw error;
  }
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
      totalMarketCapUsd: toNumSafe(payload?.market?.total_market_cap_usd) ?? toNumSafe(payload?.total_market_cap_usd),
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
  const [snapshot, news, etf, status, macro, universe, stocks, cryptoMarket] = await Promise.allSettled([
    fetchStaticJson("./data/snapshot.json", "snapshot"),
    fetchStaticJson("./data/news.json", "news"),
    fetchStaticJson("./data/etf.json", "etf"),
    fetchStaticJson("./data/status.json", "status"),
    fetchStaticJson("./data/macro_snapshot.json", "macro_snapshot"),
    fetchStaticJson("./data/crypto_custom_universe.json", "crypto_custom_universe"),
    fetchStaticJson("./data/stocks_watchlist.json", "stocks_watchlist"),
    fetchStaticJson("./data/crypto_market.json", "crypto_market"),
  ]);

  state.snapshot = snapshot.status === "fulfilled" ? snapshot.value : null;
  state.news = news.status === "fulfilled" ? news.value : { macro: [], crypto: [] };
  state.etf = etf.status === "fulfilled" ? etf.value : null;
  state.status = status.status === "fulfilled" ? status.value : null;
  state.macroSnapshot = macro.status === "fulfilled" ? macro.value : fallbackMacro;
  state.cryptoUniverse = universe.status === "fulfilled" ? normalizeCustomUniverse(universe.value.assets || []) : [];
  state.cryptoUniverseMeta = universe.status === "fulfilled"
    ? {
        universe: universe.value.universe,
        count: universe.value.universe_size || (universe.value.assets || []).length,
        target: universe.value.target_universe_size || 200,
        source: universe.value._health?.source || universe.value.universe || "market data",
        health: universe.value._health?.status || "unknown",
      }
    : null;
  state.cryptoStableMcap = universe.status === "fulfilled" ? universe.value.stablecoin_market_cap : 0;
  state.stocksWatchlist = stocks.status === "fulfilled" ? stocks.value.rows || [] : [];
  state.cryptoMarket = cryptoMarket.status === "fulfilled" ? cryptoMarket.value : null;
  if (!state.stablecoinSummary && state.cryptoMarket?.stablecoins) {
    state.stablecoinSummary = {
      total: toNumSafe(state.cryptoMarket.stablecoins.total_market_cap_usd),
      usdtMarketCap: toNumSafe(state.cryptoMarket.stablecoins.usdt_market_cap_usd),
      usdtDominance: toNumSafe(state.cryptoMarket.stablecoins.usdt_dominance),
      source: state.cryptoMarket.stablecoins.source || "DefiLlama",
    };
  }
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
      totalMarketCapUsd: toNumSafe(globalData?.data?.total_market_cap?.usd) ?? prevLive.totalMarketCapUsd,
      fearGreed: Number(fg?.data?.[0]?.value) || prevLive.fearGreed,
      upbitBtcKrw: Array.isArray(upbit) ? upbit[0]?.trade_price ?? prevLive.upbitBtcKrw : prevLive.upbitBtcKrw,
      coinbasePremiumPct,
    };
    if (globalR.status === "fulfilled") uiState.globalCryptoLastFetchTs = Date.now();

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

async function refreshStablecoinSummaryIfNeeded() {
  if (uiState.stablecoinLastFetchTs && Date.now() - uiState.stablecoinLastFetchTs < 15 * 60 * 1000) return;
  try {
    const payload = await fetchJson("https://stablecoins.llama.fi/stablecoins?includePrices=true");
    const assets = Array.isArray(payload?.peggedAssets) ? payload.peggedAssets : [];
    const total = assets.reduce((sum, asset) => sum + (toNumSafe(asset?.circulating?.peggedUSD) || 0), 0);
    const usdt = assets.find((asset) => String(asset?.symbol || "").toUpperCase() === "USDT");
    const usdtMarketCap = toNumSafe(usdt?.circulating?.peggedUSD);
    state.stablecoinSummary = {
      total,
      usdtMarketCap,
      usdtDominance: total > 0 && typeof usdtMarketCap === "number" ? (usdtMarketCap / total) * 100 : null,
      source: "DefiLlama",
    };
    uiState.stablecoinLastFetchTs = Date.now();
  } catch (error) {
    console.warn("stablecoin summary fetch failed", error);
  }
}

async function refreshGlobalCryptoStatsIfNeeded() {
  if (uiState.globalCryptoLastFetchTs && Date.now() - uiState.globalCryptoLastFetchTs < 5 * 60 * 1000) return;
  try {
    const payload = await fetchJson("https://api.coingecko.com/api/v3/global");
    const prevLive = state.live || fallbackLive;
    state.live = {
      ...prevLive,
      dominance: {
        btc: toNumSafe(payload?.data?.market_cap_percentage?.btc) ?? prevLive.dominance?.btc,
        eth: toNumSafe(payload?.data?.market_cap_percentage?.eth) ?? prevLive.dominance?.eth,
      },
      totalMarketCapUsd: toNumSafe(payload?.data?.total_market_cap?.usd) ?? prevLive.totalMarketCapUsd,
    };
    uiState.globalCryptoLastFetchTs = Date.now();
  } catch (error) {
    console.warn("global crypto stats fetch failed", error);
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
    totalMarketCapUsd: normalized.live.totalMarketCapUsd ?? prevLive.totalMarketCapUsd,
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

  await refreshStablecoinSummaryIfNeeded();
  await refreshGlobalCryptoStatsIfNeeded();

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
