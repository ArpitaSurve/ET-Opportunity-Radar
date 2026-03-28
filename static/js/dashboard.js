const API_BASE = "";  // empty because same server
/* ═══════════════════════════════════
   DATA STORE
═══════════════════════════════════ */
const STOCKS = {
    nifty: { name: 'NIFTY 50', base: 22847.35, vol: '₹24,310 Cr', exchange: 'NSE' },
    sensex: { name: 'SENSEX', base: 75234.12, vol: '₹31,220 Cr', exchange: 'BSE' },
    hdfcbank: { name: 'HDFCBANK', base: 1678.20, vol: '₹3,891 Cr', exchange: 'NSE' },
    infy: { name: 'INFY', base: 1847.00, vol: '₹2,104 Cr', exchange: 'NSE' },
    reliance: { name: 'RELIANCE', base: 2934.75, vol: '₹5,670 Cr', exchange: 'NSE' },
    tcs: { name: 'TCS', base: 3456.80, vol: '₹2,980 Cr', exchange: 'NSE' },
    icicibank: { name: 'ICICIBANK', base: 1142.50, vol: '₹3,210 Cr', exchange: 'NSE' },
};

const livePrice = {};
const priceHistory = {};

/* Seed live prices with tiny random walk */
function initPrices() {
    Object.keys(STOCKS).forEach(k => {
        livePrice[k] = { price: STOCKS[k].base, prev: STOCKS[k].base };
        priceHistory[k] = [STOCKS[k].base];
    });
}

function tickPrices() {
    Object.keys(livePrice).forEach(k => {
        const base = STOCKS[k].base;
        const volatility = base * 0.0008;
        const delta = (Math.random() - 0.485) * volatility;
        livePrice[k].prev = livePrice[k].price;
        livePrice[k].price = Math.max(base * 0.92, Math.min(base * 1.08, livePrice[k].price + delta));
        const hist = priceHistory[k];
        hist.push(livePrice[k].price);
        if (hist.length > 200) hist.shift();
    });
}

function fmt(v) { return v >= 1000 ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : v.toFixed(2); }

/* ═══════════════════════════════════
   SIGNALS DATA
═══════════════════════════════════ */
const SIGNALS_DATA = [
    {
        id: 2, stock: 'hdfcbank', badge: 'HDFCBANK', type: 'bulk', typeLabel: 'Bulk Deal', level: 'medium',
        confidence: 71, confidenceClass: 'mid', msg: '📦 Mutual fund placed bulk buy order of ₹890 Cr in HDFCBANK. Institutional accumulation at this scale signals strong conviction — historically leads to <strong style="color:var(--yellow)">+22% gain</strong> over 60 days.',
        detected: '13:45 IST', backtest: '18/25 accurate', volumeX: '2.8x avg',
        details: { Client: 'HDFC Mutual Fund', 'Deal Type': 'Bulk Buy', 'Quantity': '5,31,000', 'Price': '₹1,676.80', 'Value': '₹890 Cr', 'Exchange': 'NSE' }
    },
    {
        id: 3, stock: 'infy', badge: 'INFY', type: 'insider', typeLabel: 'Insider Trade', level: 'low',
        confidence: 65, confidenceClass: 'low-c', msg: '👤 CFO purchased 50,000 shares of INFY at ₹1,847. C-suite insider buying before quarterly results historically signals management confidence — <strong style="color:var(--green)">+18% avg gain</strong> in 45 days.',
        detected: '11:12 IST', backtest: '14/22 accurate', volumeX: '1.9x avg',
        details: { Person: 'Nilanjan Roy (CFO)', 'Transaction': 'Purchase', 'Quantity': '50,000', 'Price': '₹1,847.00', 'Value': '₹9.24 Cr', 'Relation': 'Key Managerial Person' }
    },
    {
        id: 4, stock: 'reliance', badge: 'RELIANCE', type: 'promoter', typeLabel: 'Unusual Volume', level: 'high',
        confidence: 79, msg: '📊 RELIANCE trading at <strong style="color:var(--et-orange)">6.7x normal volume</strong> with no news catalyst. Historically this precedes a major announcement within 48 hours — avg move of <strong style="color:var(--green)">±15%</strong>.',
        detected: '10:55 IST', backtest: '21/27 accurate', volumeX: '6.7x avg',
        details: { 'Volume': '6.7x 30-day avg', 'Price': '₹2,934.75', 'News Catalyst': 'None detected', 'Pattern': 'Pre-announcement accumulation', 'Historical Accuracy': '77.8%', 'Last Occurrence': 'Jan 14, 2025' }
    },
    {
        id: 5, stock: 'tcs', badge: 'TCS', type: 'bulk', typeLabel: 'Bulk Deal', level: 'medium',
        confidence: 68, confidenceClass: 'mid', msg: '📦 FII placed bulk sell order of ₹450 Cr in TCS — FII outflows in IT sector following global rate signals. Watch for support at ₹3,380.',
        detected: '09:30 IST', backtest: '12/18 accurate', volumeX: '3.1x avg',
        details: { Client: 'Morgan Stanley Asia', 'Deal Type': 'Bulk Sell', 'Quantity': '1,30,000', 'Price': '₹3,461.00', 'Value': '₹450 Cr', 'Exchange': 'NSE' }
    },
    {
        id: 6, stock: 'icicibank', badge: 'ICICIBANK', type: 'promoter', typeLabel: 'Bulk Deal', level: 'medium',
        confidence: 74, confidenceClass: 'mid', msg: '📦 Domestic institution accumulated ₹620 Cr in ICICIBANK in a single session. Strong FII + DII confluence signals high conviction accumulation — historically leads to <strong style="color:var(--yellow)">+26% gain</strong> in 60 days.',
        detected: '12:15 IST', backtest: '16/22 accurate', volumeX: '3.8x avg',
        details: { Client: 'LIC of India', 'Deal Type': 'Bulk Buy', 'Quantity': '5,42,000', 'Price': '₹1,143.20', 'Value': '₹620 Cr', 'Exchange': 'NSE' }
    },
];

/* ═══════════════════════════════════
   WATCHLIST
═══════════════════════════════════ */
const WATCHLIST = [
    { key: 'hdfcbank', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd' },
    { key: 'infy', symbol: 'INFY', name: 'Infosys Ltd' },
    { key: 'reliance', symbol: 'RELIANCE', name: 'Reliance Industries' },
    { key: 'tcs', symbol: 'TCS', name: 'Tata Consultancy Services' },
    { key: 'icicibank', symbol: 'ICICIBANK', name: 'ICICI Bank Ltd' },
];

function renderWatchlist(filter = '') {
    const container = document.getElementById('watchlist-container');
    container.innerHTML = '';
    WATCHLIST.filter(w => w.symbol.toLowerCase().includes(filter.toLowerCase()) || w.name.toLowerCase().includes(filter.toLowerCase()))
        .forEach(w => {
            const p = livePrice[w.key];
            const chg = ((p.price - STOCKS[w.key].base) / STOCKS[w.key].base * 100);
            const isUp = p.price >= p.prev;
            const flashClass = isUp ? 'wl-flash-up' : 'wl-flash-down';
            const div = document.createElement('div');
            div.className = 'watchlist-item';
            div.id = 'wl-' + w.key;
            div.onclick = () => openSignalDetailModal(SIGNALS_DATA.find(s => s.stock === w.key) || { stock: w.key, badge: w.symbol, typeLabel: 'Price Chart', confidence: '—', details: {} });
            div.innerHTML = `
            <div class="wl-left">
                <div class="wl-symbol">${w.symbol}</div>
                <div class="wl-name">${w.name}</div>
            </div>
            <div class="wl-right">
                <div class="wl-price" style="color:${isUp ? 'var(--green)' : 'var(--red)'}" id="wl-price-${w.key}">₹${fmt(p.price)}</div>
                <div class="wl-change ${chg >= 0 ? 'up' : 'down'}" id="wl-chg-${w.key}">${chg >= 0 ? '▲' : '▼'} ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</div>
            </div>`;
            container.appendChild(div);
        });
}

function filterWatchlist(val) { renderWatchlist(val); }

function updateWatchlistPrices() {
    WATCHLIST.forEach(w => {
        const p = livePrice[w.key];
        const chg = ((p.price - STOCKS[w.key].base) / STOCKS[w.key].base * 100);
        const isUp = p.price >= p.prev;
        const priceEl = document.getElementById('wl-price-' + w.key);
        const chgEl = document.getElementById('wl-chg-' + w.key);
        if (priceEl) {
            priceEl.textContent = '₹' + fmt(p.price);
            priceEl.style.color = isUp ? 'var(--green)' : 'var(--red)';
        }
        if (chgEl) {
            chgEl.textContent = `${chg >= 0 ? '▲' : '▼'} ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`;
            chgEl.className = 'wl-change ' + (chg >= 0 ? 'up' : 'down');
        }
    });
}

/* ═══════════════════════════════════
   TICKER
═══════════════════════════════════ */
function buildTicker() {
    const el = document.getElementById('ticker');
    const stocks = ['nifty', 'sensex', 'hdfcbank', 'infy', 'reliance', 'tcs', 'icicibank'];
    let html = '';
    for (let rep = 0; rep < 2; rep++) {
        stocks.forEach(k => {
            const p = livePrice[k];
            const chg = ((p.price - STOCKS[k].base) / STOCKS[k].base * 100);
            const isUp = chg >= 0;
            html += `<div class="ticker-item">
                <span class="ticker-symbol">${STOCKS[k].name}</span>
                <span class="ticker-price" id="tick-${k}-${rep}">₹${fmt(p.price)}</span>
                <span class="ticker-chg ${isUp ? 'up' : 'down'}" id="tick-chg-${k}-${rep}">${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${chg.toFixed(2)}%</span>
            </div>`;
        });
    }
    el.innerHTML = html;
}

function updateTicker() {
    const stocks = ['nifty', 'sensex', 'hdfcbank', 'infy', 'reliance', 'tcs', 'icicibank'];
    for (let rep = 0; rep < 2; rep++) {
        stocks.forEach(k => {
            const p = livePrice[k];
            const chg = ((p.price - STOCKS[k].base) / STOCKS[k].base * 100);
            const isUp = chg >= 0;
            const pe = document.getElementById(`tick-${k}-${rep}`);
            const ce = document.getElementById(`tick-chg-${k}-${rep}`);
            if (pe) pe.textContent = '₹' + fmt(p.price);
            if (ce) { ce.textContent = `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${chg.toFixed(2)}%`; ce.className = `ticker-chg ${isUp ? 'up' : 'down'}`; }
        });
    }
}

/* ═══════════════════════════════════
   STATS BAR live values
═══════════════════════════════════ */
function updateStatsBars() {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 3600000);
    const h = ist.getUTCHours(), m = ist.getUTCMinutes();
    // Count signals detected up to current time (simulate)
    const minutesSinceOpen = Math.max(0, (h - 9) * 60 + (m - 15));
    const signalsNow = Math.min(47 + Math.floor(minutesSinceOpen * 0.03), 60);
    document.getElementById('signals-count').textContent = signalsNow;
    document.getElementById('signals-sub').textContent = `↑ ${Math.floor(signalsNow * 0.25)} from yesterday`;

    // Insider value fluctuates
    const insiderVal = 284 + Math.floor(Math.random() * 20 - 5);
    document.getElementById('insider-val').textContent = `₹${insiderVal} Cr`;

    // High confidence
    const hc = 12 + Math.floor(Math.random() * 3 - 1);
    document.getElementById('high-conf').textContent = Math.max(10, hc);

    // Breakdown bars
    const promoterCount = 18 + Math.floor(Math.random() * 3);
    const insiderCount = 12 + Math.floor(Math.random() * 2);
    const bulkCount = 9 + Math.floor(Math.random() * 2);
    const volumeCount = 8 + Math.floor(Math.random() * 2);
    const total = promoterCount + insiderCount + bulkCount + volumeCount;
    document.getElementById('bar-promoter').style.width = (promoterCount / total * 100) + '%';
    document.getElementById('bar-insider').style.width = (insiderCount / total * 100) + '%';
    document.getElementById('bar-bulk').style.width = (bulkCount / total * 100) + '%';
    document.getElementById('bar-volume').style.width = (volumeCount / total * 100) + '%';
    document.getElementById('val-promoter').textContent = promoterCount;
    document.getElementById('val-insider').textContent = insiderCount;
    document.getElementById('val-bulk').textContent = bulkCount;
    document.getElementById('val-volume').textContent = volumeCount;
    document.getElementById('acc-count-insider').textContent = insiderCount;
    document.getElementById('acc-count-bulk').textContent = bulkCount;
    document.getElementById('acc-count-promoter').textContent = promoterCount;
}

/* ═══════════════════════════════════
   SIGNAL FEED RENDER
═══════════════════════════════════ */
let currentFilter = 'all';
function filterSignals(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    if (type === 'all') {
        renderSignalFeed(SIGNALS_DATA);
    } else if (type === 'insider') {
        openAccordionModal('insider');
    } else if (type === 'bulk') {
        openAccordionModal('bulk');
    } else if (type === 'promoter') {
        openAccordionModal('promoter');
    }
}

function renderSignalFeed(data) {
    const feed = document.getElementById('signal-feed');
    feed.innerHTML = '';
    data.forEach((sig, i) => {
        const p = livePrice[sig.stock];
        const chg = ((p.price - STOCKS[sig.stock].base) / STOCKS[sig.stock].base * 100);
        const isUp = chg >= 0;
        const div = document.createElement('div');
        div.className = `signal-card ${sig.level}`;
        div.style.animationDelay = (i * 0.1) + 's';
        div.innerHTML = `
            <div class="signal-top">
                <div class="signal-stock">
                    <div class="stock-badge">${sig.badge}</div>
                    <div class="signal-type-tag">${sig.typeLabel} ${sig.isNew ? '<span class="new-badge">NEW</span>' : ''}</div>
                </div>
                <div class="confidence-badge">
                    <div class="confidence-num ${sig.confidenceClass || ''}">${sig.confidence}%</div>
                    <div class="confidence-label">Confidence</div>
                </div>
            </div>
            <div class="signal-message">${sig.msg}</div>
            <div class="signal-bottom">
                <div class="signal-meta">
                    <div class="meta-item">Detected: <span>${sig.detected}</span></div>
                    <div class="meta-item">Backtest: <span>${sig.backtest}</span></div>
                    <div class="meta-item">Volume: <span>${sig.volumeX}</span></div>
                    <div class="meta-item">Live: <span style="color:${isUp ? 'var(--green)' : 'var(--red)'}">${isUp ? '▲' : '▼'} ₹${fmt(p.price)}</span></div>
                </div>
                <button class="signal-action" onclick="openSignalDetailModal(window.SIGS[${i}])">View Signal →</button>
            </div>`;
        feed.appendChild(div);
    });
    window.SIGS = data;
}

/* ═══════════════════════════════════
   CANDLE DATA GENERATOR
═══════════════════════════════════ */
function generateCandles(basePrice, count, tf) {
    const candles = [];
    let price = basePrice * (0.92 + Math.random() * 0.02);
    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds = tf === '1D' ? 900 : tf === '1W' ? 3600 : tf === '1M' ? 86400 : 86400 * 3;
    for (let i = count; i >= 0; i--) {
        const open = price;
        const range = price * (tf === '1D' ? 0.006 : tf === '1W' ? 0.012 : 0.025);
        const high = open + Math.random() * range;
        const low = open - Math.random() * range;
        const close = low + Math.random() * (high - low);
        const volume = Math.floor(Math.random() * 1000000 + 200000);
        candles.push({ time: now - i * intervalSeconds, open: parseFloat(open.toFixed(2)), high: parseFloat(high.toFixed(2)), low: parseFloat(low.toFixed(2)), close: parseFloat(close.toFixed(2)), value: volume });
        price = close;
    }
    // Last candle at current price
    const lastCandle = candles[candles.length - 1];
    lastCandle.close = parseFloat(basePrice.toFixed(2));
    lastCandle.high = Math.max(lastCandle.high, basePrice);
    lastCandle.low = Math.min(lastCandle.low, basePrice);
    return candles;
}

/* ═══════════════════════════════════
   CHART INSTANCES
═══════════════════════════════════ */
let mainChartInstance = null, mainSeries = null, mainVolSeries = null;
let detailChartInstance = null, detailSeries = null;
let currentChartStock = 'nifty';
let currentChartTF = '1D';
let currentDetailStock = 'hdfcbank';
let currentDetailTF = '1D';

function createCandleChart(containerId, stockKey, tf) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const h = container.offsetHeight > 50 ? container.offsetHeight : (containerId === 'candle-chart' ? 340 : 300);
    const w = container.offsetWidth > 50 ? container.offsetWidth : container.parentElement.offsetWidth || 700;
    const chart = LightweightCharts.createChart(container, {
        width: w,
        height: h,
        layout: { background: { color: 'transparent' }, textColor: '#6b6b80' },
        grid: { vertLines: { color: 'rgba(255,102,0,0.06)' }, horzLines: { color: 'rgba(255,102,0,0.06)' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(255,102,0,0.15)' },
        timeScale: { borderColor: 'rgba(255,102,0,0.15)', timeVisible: true },
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#00e676', downColor: '#ff1744',
        borderUpColor: '#00e676', borderDownColor: '#ff1744',
        wickUpColor: '#00e676', wickDownColor: '#ff1744',
    });

    const counts = { '1D': 78, '1W': 120, '1M': 90, '3M': 90 };
    const candles = generateCandles(livePrice[stockKey].price, counts[tf] || 78, tf);
    candleSeries.setData(candles);
    chart.timeScale().fitContent();
    // Responsive resize
    const ro = new ResizeObserver(() => { chart.applyOptions({ width: container.offsetWidth }); chart.timeScale().fitContent(); });
    ro.observe(container);

    // Update OHLCV stats
    const last = candles[candles.length - 1];
    const first = candles[0];
    if (document.getElementById('cs-open')) {
        document.getElementById('cs-open').textContent = '₹' + fmt(last.open);
        document.getElementById('cs-high').textContent = '₹' + fmt(Math.max(...candles.map(c => c.high)));
        document.getElementById('cs-low').textContent = '₹' + fmt(Math.min(...candles.map(c => c.low)));
        document.getElementById('cs-vol').textContent = (last.value / 100000).toFixed(1) + 'L';
    }

    return { chart, series: candleSeries };
}

/* ═══════════════════════════════════
   SIGNALS TODAY MODAL
═══════════════════════════════════ */
function openSignalsTodayModal() {
    document.getElementById('signals-today-modal').classList.add('open');
    switchSignalsTab('nifty', document.querySelector('.signals-today-tab'));
}

function switchSignalsTab(stockKey, tabEl) {
    document.querySelectorAll('.signals-today-tab').forEach(t => t.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
    currentChartStock = stockKey;

    // Update price info
    const p = livePrice[stockKey];
    const chg = ((p.price - STOCKS[stockKey].base) / STOCKS[stockKey].base * 100);
    const isUp = chg >= 0;
    document.getElementById('chart-current-price').textContent = '₹' + fmt(p.price);
    document.getElementById('modal-stock-badge').textContent = STOCKS[stockKey].name;
    const badge = document.getElementById('chart-change-badge');
    badge.textContent = `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${chg.toFixed(2)}%`;
    badge.style.background = isUp ? 'rgba(0,230,118,0.12)' : 'rgba(255,23,68,0.12)';
    badge.style.color = isUp ? 'var(--green)' : 'var(--red)';

    // Draw chart
    setTimeout(() => {
        const result = createCandleChart('candle-chart', stockKey, currentChartTF);
        mainChartInstance = result.chart;
        mainSeries = result.series;
    }, 50);
}

function setChartTF(tf, btn) {
    currentChartTF = tf;
    document.querySelectorAll('#signals-today-modal .chart-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    switchSignalsTab(currentChartStock, null);
}

/* ═══════════════════════════════════
   SIGNAL DETAIL MODAL
═══════════════════════════════════ */
function openSignalDetailModal(sig) {
    document.getElementById('signal-detail-modal').classList.add('open');
    document.getElementById('detail-stock-badge').textContent = sig.badge || STOCKS[sig.stock].name;
    document.getElementById('detail-signal-type').textContent = sig.typeLabel || 'Price Chart';
    currentDetailStock = sig.stock;

    const p = livePrice[sig.stock];
    const chg = ((p.price - STOCKS[sig.stock].base) / STOCKS[sig.stock].base * 100);
    const isUp = chg >= 0;
    document.getElementById('detail-price').textContent = '₹' + fmt(p.price);
    const changeEl = document.getElementById('detail-change');
    changeEl.textContent = `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${chg.toFixed(2)}%`;
    changeEl.style.color = isUp ? 'var(--green)' : 'var(--red)';
    document.getElementById('detail-vol').textContent = STOCKS[sig.stock].vol;
    document.getElementById('detail-conf').textContent = sig.confidence !== undefined ? sig.confidence + '%' : '—';

    // Details grid
    const grid = document.getElementById('detail-info-grid');
    grid.innerHTML = '';
    if (sig.details) {
        Object.entries(sig.details).forEach(([k, v]) => {
            grid.innerHTML += `<div class="detail-item"><div class="detail-label">${k}</div><div class="detail-value" style="color:var(--et-orange)">${v}</div></div>`;
        });
    }

    setTimeout(() => {
        const result = createCandleChart('detail-candle-chart', sig.stock, currentDetailTF);
        detailChartInstance = result.chart;
        detailSeries = result.series;
    }, 50);
}

function setDetailTF(tf, btn) {
    currentDetailTF = tf;
    document.querySelectorAll('#signal-detail-modal .chart-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const result = createCandleChart('detail-candle-chart', currentDetailStock, tf);
    detailChartInstance = result.chart;
    detailSeries = result.series;
}

/* ═══════════════════════════════════
   ACCORDION MODAL (Live Deal Activity)
═══════════════════════════════════ */
const INSIDER_TRADES = [
    ['INFY', 'Nilanjan Roy (CFO)', 'Buy', '50,000', '₹9.24 Cr', '11:12'],
    ['HDFCBANK', 'Srini Vasan (Dir)', 'Buy', '25,000', '₹4.19 Cr', '10:30'],
    ['TCS', 'N Ganapathy Subramaniam', 'Sell', '40,000', '₹13.84 Cr', '09:45'],
    ['RELIANCE', 'Hital R Meswani (Dir)', 'Buy', '15,000', '₹4.40 Cr', '13:00'],
    ['ICICIBANK', 'Sandeep Bakhshi (MD&CEO)', 'Buy', '20,000', '₹2.29 Cr', '12:45'],
];
const BULK_DEALS = [
    ['HDFCBANK', 'HDFC Mutual Fund', 'Buy', '5.31', '₹890 Cr', '13:45'],
    ['TCS', 'Morgan Stanley Asia', 'Sell', '1.30', '₹450 Cr', '09:30'],
    ['RELIANCE', 'Goldman Sachs India', 'Buy', '3.20', '₹940 Cr', '11:00'],
    ['INFY', 'Vanguard Group', 'Sell', '2.80', '₹517 Cr', '10:15'],
    ['ICICIBANK', 'LIC of India', 'Buy', '5.42', '₹620 Cr', '12:15'],
];
const PROMOTER_ACTIVITY = [
    ['RELIANCE', 'Petroleum Trust', 'Buy', '+0.12%', '₹280 Cr', '12:45'],
    ['HDFCBANK', 'HDFC Ltd', 'Sell', '-0.08%', '₹180 Cr', '11:30'],
    ['INFY', 'NR Narayana Murthy', 'Sell', '-0.05%', '₹72 Cr', '10:00'],
    ['TCS', 'Tata Sons Pvt Ltd', 'Buy', '+0.10%', '₹345 Cr', '09:50'],
    ['ICICIBANK', 'ICICI Bank Promoter Grp', 'Buy', '+0.15%', '₹218 Cr', '11:50'],
];

function openAccordionModal(openSection) {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 3600000);
    const h = ist.getUTCHours().toString().padStart(2, '0');
    const m = ist.getUTCMinutes().toString().padStart(2, '0');
    const s = ist.getUTCSeconds().toString().padStart(2, '0');
    document.getElementById('acc-modal-time').textContent = `As of ${h}:${m}:${s} IST`;

    // Market badges
    const badges = document.getElementById('acc-market-badges');
    const mkts = ['nifty', 'sensex'];
    badges.innerHTML = '';
    mkts.forEach(k => {
        const p = livePrice[k];
        const chg = ((p.price - STOCKS[k].base) / STOCKS[k].base * 100);
        const isUp = chg >= 0;
        badges.innerHTML += `<div class="index-badge">
            <span style="color:var(--et-orange);font-weight:700">${STOCKS[k].name}</span>
            <span>₹${fmt(p.price)}</span>
            <span style="color:${isUp ? 'var(--green)' : 'var(--red)'}">${isUp ? '▲' : '▼'}${isUp ? '+' : ''}${chg.toFixed(2)}%</span>
        </div>`;
    });

    // Insider table
    const insiderTbody = document.querySelector('#acc-table-insider tbody');
    insiderTbody.innerHTML = '';
    INSIDER_TRADES.forEach(row => {
        const isBuy = row[2] === 'Buy';
        insiderTbody.innerHTML += `<tr>
            <td><span style="color:var(--et-orange);font-weight:700">${row[0]}</span></td>
            <td>${row[1]}</td>
            <td class="${isBuy ? 'buy' : 'sell'}">${row[2]}</td>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
            <td>${row[5]} IST</td>
        </tr>`;
    });

    // Bulk table
    const bulkTbody = document.querySelector('#acc-table-bulk tbody');
    bulkTbody.innerHTML = '';
    BULK_DEALS.forEach(row => {
        const isBuy = row[2] === 'Buy';
        bulkTbody.innerHTML += `<tr>
            <td><span style="color:var(--et-orange);font-weight:700">${row[0]}</span></td>
            <td>${row[1]}</td>
            <td class="${isBuy ? 'buy' : 'sell'}">${row[2]}</td>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
            <td>${row[5]} IST</td>
        </tr>`;
    });

    // Promoter table
    const promTbody = document.querySelector('#acc-table-promoter tbody');
    promTbody.innerHTML = '';
    PROMOTER_ACTIVITY.forEach(row => {
        const isBuy = row[2] === 'Buy';
        promTbody.innerHTML += `<tr>
            <td><span style="color:var(--et-orange);font-weight:700">${row[0]}</span></td>
            <td>${row[1]}</td>
            <td class="${isBuy ? 'buy' : 'sell'}">${row[2]}</td>
            <td style="color:${isBuy ? 'var(--green)' : 'var(--red)'}">${row[3]}</td>
            <td>${row[4]}</td>
            <td>${row[5]} IST</td>
        </tr>`;
    });

    document.getElementById('accordion-modal').classList.add('open');

    // Auto-open the requested section
    if (openSection) {
        setTimeout(() => {
            const el = document.getElementById('acc-' + openSection);
            if (el && !el.classList.contains('open')) toggleAccordion('acc-' + openSection);
        }, 100);
    }
}

function toggleAccordion(id) {
    const el = document.getElementById(id);
    el.classList.toggle('open');
}

/* ═══════════════════════════════════
   MODAL CLOSE
═══════════════════════════════════ */
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

/* ═══════════════════════════════════
   CLOCK + MARKET STATUS
═══════════════════════════════════ */
function updateTime() {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 3600000);
    const h = ist.getUTCHours(), m = ist.getUTCMinutes(), s = ist.getUTCSeconds();
    document.getElementById('market-time').textContent =
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} IST`;

    const badge = document.getElementById('market-status-badge');
    if ((h > 9 || (h === 9 && m >= 15)) && (h < 15 || (h === 15 && m <= 30))) {
        badge.textContent = 'MARKET OPEN'; badge.className = 'market-status open';
    } else if (h === 9 && m < 15) {
        badge.textContent = 'PRE-MARKET'; badge.className = 'market-status pre';
    } else {
        badge.textContent = 'MARKET CLOSED'; badge.className = 'market-status closed';
    }
}

/* ═══════════════════════════════════
   BOOT
═══════════════════════════════════ */
initPrices();
// Initial tick to add variance
for (let i = 0; i < 20; i++) tickPrices();

buildTicker();
renderWatchlist();
renderSignalFeed(SIGNALS_DATA);
updateStatsBars();
updateTime();

// Live ticks
setInterval(() => {
    tickPrices();
    updateWatchlistPrices();
    updateTicker();
}, 1500);

setInterval(updateTime, 1000);
setInterval(updateStatsBars, 8000);

// Bars animate on load
setTimeout(() => {
    updateStatsBars();
}, 500);
