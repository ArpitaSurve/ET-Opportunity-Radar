/* ════════════════════════════════════════
   ET OPPORTUNITY RADAR — dashboard.js
   Architecture: Flask API drives signal feed.
   Static data only used for prices/watchlist/charts.
════════════════════════════════════════ */

/* ═══════════════════════════════════
   1. PRICE ENGINE  (local simulation)
   Only used for watchlist & chart visuals.
   Signal data comes entirely from /api/signals.
═══════════════════════════════════ */
const STOCKS = {
    nifty:     { name: 'NIFTY 50',              base: 22847.35, vol: '₹24,310 Cr', exchange: 'NSE' },
    sensex:    { name: 'SENSEX',                base: 75234.12, vol: '₹31,220 Cr', exchange: 'BSE' },
    hdfcbank:  { name: 'HDFCBANK',              base: 1678.20,  vol: '₹3,891 Cr',  exchange: 'NSE' },
    infy:      { name: 'INFY',                  base: 1847.00,  vol: '₹2,104 Cr',  exchange: 'NSE' },
    reliance:  { name: 'RELIANCE',              base: 2934.75,  vol: '₹5,670 Cr',  exchange: 'NSE' },
    tcs:       { name: 'TCS',                   base: 3456.80,  vol: '₹2,980 Cr',  exchange: 'NSE' },
    icicibank: { name: 'ICICIBANK',             base: 1142.50,  vol: '₹3,210 Cr',  exchange: 'NSE' },
};

// Slug map: normalise any API stock name → STOCKS key
const STOCK_SLUG = {
    nifty: 'nifty', 'nifty 50': 'nifty', nifty50: 'nifty',
    sensex: 'sensex',
    hdfcbank: 'hdfcbank', hdfc: 'hdfcbank', 'hdfc bank': 'hdfcbank',
    infy: 'infy', infosys: 'infy',
    reliance: 'reliance', ril: 'reliance',
    tcs: 'tcs',
    icicibank: 'icicibank', icici: 'icicibank', 'icici bank': 'icicibank',
};

const livePrice   = {};
const priceHistory = {};

function initPrices() {
    Object.keys(STOCKS).forEach(k => {
        livePrice[k]    = { price: STOCKS[k].base, prev: STOCKS[k].base };
        priceHistory[k] = [STOCKS[k].base];
    });
}

function tickPrices() {
    Object.keys(livePrice).forEach(k => {
        const base      = STOCKS[k].base;
        const volatility = base * 0.0008;
        const delta     = (Math.random() - 0.485) * volatility;
        livePrice[k].prev  = livePrice[k].price;
        livePrice[k].price = Math.max(base * 0.92, Math.min(base * 1.08, livePrice[k].price + delta));
        const hist = priceHistory[k];
        hist.push(livePrice[k].price);
        if (hist.length > 200) hist.shift();
    });
}

function fmt(v) {
    return v >= 1000
        ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 })
        : v.toFixed(2);
}

/* Resolve API stock name to a known key, or return a fallback */
function resolveStockKey(rawName) {
    if (!rawName) return null;
    const slug = String(rawName).toLowerCase().trim();
    return STOCK_SLUG[slug] || (STOCKS[slug] ? slug : null);
}

/* ═══════════════════════════════════
   2. API SIGNAL FEED  ← THE MAIN SOURCE
═══════════════════════════════════ */
let liveSignals = [];   // cache for filter tabs
let currentFilter = 'all';

function loadSignals() {
    // Show shimmer while loading
    showShimmer();

    fetch('/api/signals')
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                showEmptyState();
                return;
            }

            // Map API fields → shape renderSignalFeed() expects
            liveSignals = data.map(s => mapApiSignal(s));

            // Update stats bar with real API data
            updateStatsBarsFromAPI(liveSignals);

            // Render the feed
            renderSignalFeed(liveSignals);
        })
        .catch(err => {
            console.error('Failed to load /api/signals:', err);
            showErrorState(err.message);
        });
}

/*
 * mapApiSignal — converts your Flask API response object
 * to the shape renderSignalFeed() and modals expect.
 *
 * Expected API fields (all optional except stock):
 *   stock, signal_type, message, confidence,
 *   backtest_accuracy, decision, detected, volume,
 *   is_new, details (object)
 */
function mapApiSignal(s) {
    const stockKey = resolveStockKey(s.stock) || 'nifty';
    const conf     = parseFloat(s.confidence) || 0;

    return {
        // identity
        id:              s.id || Math.random(),
        stock:           stockKey,
        badge:           String(s.stock || stockKey).toUpperCase(),

        // type/display
        type:            (s.signal_type || 'insider').toLowerCase(),
        typeLabel:       formatTypeLabel(s.signal_type),

        // confidence
        confidence:      conf,
        confidenceClass: getConfidenceClass(conf),
        level:           getLevel(conf),

        // content
        msg:             s.message || '—',
        detected:        s.detected || s.time || '—',
        backtest:        s.backtest_accuracy || '—',
        volumeX:         s.volume || '—',
        decision:        s.decision || '',

        // details panel
        details:         s.details || buildDetailsFromFlat(s),

        // badge
        isNew:           !!s.is_new,
    };
}

function formatTypeLabel(type) {
    const map = {
        insider:  'Insider Trade',
        bulk:     'Bulk Deal',
        promoter: 'Promoter Activity',
        volume:   'Unusual Volume',
        momentum: 'Momentum Signal',
    };
    const key = (type || '').toLowerCase();
    return map[key] || (type ? String(type) : 'Signal');
}

function getLevel(conf) {
    if (conf >= 80) return 'high';
    if (conf >= 65) return 'medium';
    return 'low';
}

function getConfidenceClass(conf) {
    if (conf >= 80) return '';       // green (default)
    if (conf >= 65) return 'mid';   // yellow
    return 'low-c';                  // dim
}

/* Build a details object from flat API fields (fallback when no details key) */
function buildDetailsFromFlat(s) {
    const d = {};
    if (s.signal_type)      d['Signal Type']  = formatTypeLabel(s.signal_type);
    if (s.decision)         d['Decision']     = s.decision;
    if (s.backtest_accuracy)d['Backtest']     = s.backtest_accuracy;
    if (s.volume)           d['Volume']       = s.volume;
    if (s.confidence)       d['Confidence']   = s.confidence + '%';
    return d;
}

/* ── Stats bar from real API data ── */
function updateStatsBarsFromAPI(signals) {
    const total      = signals.length;
    const highConf   = signals.filter(s => s.confidence >= 80).length;
    const byType     = { promoter: 0, insider: 0, bulk: 0, volume: 0 };

    signals.forEach(s => {
        const t = s.type;
        if (byType[t] !== undefined) byType[t]++;
        else byType.volume++; // catch-all
    });

    const totalBreakdown = Object.values(byType).reduce((a, b) => a + b, 0) || 1;

    // Signals count
    document.getElementById('signals-count').textContent = total;
    document.getElementById('signals-sub').textContent   = `${highConf} high-confidence signals`;

    // High confidence
    document.getElementById('high-conf').textContent = highConf;

    // Accuracy: average confidence
    if (signals.length > 0) {
        const avgConf = Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length);
        document.getElementById('accuracy-val').textContent = avgConf + '%';
    }

    // Breakdown bars
    Object.entries(byType).forEach(([type, count]) => {
        const bar = document.getElementById('bar-' + type);
        const val = document.getElementById('val-' + type);
        if (bar) bar.style.width = (count / totalBreakdown * 100) + '%';
        if (val) val.textContent = count;
    });

    // Accordion counts
    ['insider', 'bulk', 'promoter'].forEach(t => {
        const el = document.getElementById('acc-count-' + t);
        if (el) el.textContent = byType[t] || 0;
    });

    // Insider value — if API returns this, use it; otherwise just show count
    document.getElementById('insider-val').textContent = byType.insider + ' trades';
    document.getElementById('insider-sub').textContent = 'Across ' + Object.keys(
        signals.filter(s => s.type === 'insider').reduce((acc, s) => { acc[s.stock] = 1; return acc; }, {})
    ).length + ' stocks';
}

/* ── Feed rendering ── */
function filterSignals(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    if (type === 'all') {
        // Use cached API data — NO re-fetch, NO static data
        renderSignalFeed(liveSignals);
    } else if (['insider', 'bulk', 'promoter'].includes(type)) {
        // Show accordion modal for detail view
        openAccordionModal(type);
        // Also filter cards in the feed
        const filtered = liveSignals.filter(s => s.type === type);
        renderSignalFeed(filtered.length > 0 ? filtered : liveSignals);
    }
}

function renderSignalFeed(data) {
    const feed = document.getElementById('signal-feed');
    feed.innerHTML = '';

    if (!data || data.length === 0) {
        showEmptyState();
        return;
    }

    data.forEach((sig, i) => {
        const stockKey = sig.stock;
        const p        = livePrice[stockKey];
        const chg      = p ? ((p.price - STOCKS[stockKey].base) / STOCKS[stockKey].base * 100) : 0;
        const isUp     = chg >= 0;
        const priceStr = p ? ('₹' + fmt(p.price)) : '—';

        const div = document.createElement('div');
        div.className = `signal-card ${sig.level || ''}`;
        div.style.animationDelay = (i * 0.08) + 's';

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
                    ${p ? `<div class="meta-item">Live: <span style="color:${isUp ? 'var(--green)' : 'var(--red)'}">${isUp ? '▲' : '▼'} ${priceStr}</span></div>` : ''}
                    ${sig.decision ? `<div class="meta-item">Decision: <span style="color:var(--et-orange)">${sig.decision}</span></div>` : ''}
                </div>
                <button class="signal-action" onclick="openSignalDetailFromIndex(${i})">View Signal →</button>
            </div>`;
        feed.appendChild(div);
    });

    // Store current rendered set for button callbacks
    window._renderedSignals = data;
}

function openSignalDetailFromIndex(i) {
    const sig = (window._renderedSignals || liveSignals)[i];
    if (sig) openSignalDetailModal(sig);
}

/* ── Feed state helpers ── */
function showShimmer() {
    const feed = document.getElementById('signal-feed');
    feed.innerHTML = `
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>`;
}

function showEmptyState() {
    document.getElementById('signal-feed').innerHTML = `
        <div class="feed-empty">
            <div class="icon">📭</div>
            <p>No signals available right now.<br>Check back soon or refresh the page.</p>
        </div>`;
}

function showErrorState(msg) {
    document.getElementById('signal-feed').innerHTML = `
        <div class="feed-error">
            <div class="icon">⚠️</div>
            <p>Could not load signals from API.<br>
            <span style="color:var(--red);font-size:11px">${msg || 'Network error'}</span></p>
        </div>`;
}

/* ═══════════════════════════════════
   3. WATCHLIST
═══════════════════════════════════ */
const WATCHLIST = [
    { key: 'hdfcbank',  symbol: 'HDFCBANK',  name: 'HDFC Bank Ltd' },
    { key: 'infy',      symbol: 'INFY',      name: 'Infosys Ltd' },
    { key: 'reliance',  symbol: 'RELIANCE',  name: 'Reliance Industries' },
    { key: 'tcs',       symbol: 'TCS',       name: 'Tata Consultancy Services' },
    { key: 'icicibank', symbol: 'ICICIBANK', name: 'ICICI Bank Ltd' },
];

function renderWatchlist(filter = '') {
    const container = document.getElementById('watchlist-container');
    container.innerHTML = '';
    WATCHLIST
        .filter(w =>
            w.symbol.toLowerCase().includes(filter.toLowerCase()) ||
            w.name.toLowerCase().includes(filter.toLowerCase())
        )
        .forEach(w => {
            const p    = livePrice[w.key];
            const chg  = ((p.price - STOCKS[w.key].base) / STOCKS[w.key].base * 100);
            const isUp = p.price >= p.prev;

            const div = document.createElement('div');
            div.className = 'watchlist-item';
            div.id        = 'wl-' + w.key;
            div.onclick   = () => {
                // Open detail modal for the first signal matching this stock
                const sig = liveSignals.find(s => s.stock === w.key);
                if (sig) openSignalDetailModal(sig);
                else openSignalDetailModal({ stock: w.key, badge: w.symbol, typeLabel: 'Price Chart', confidence: 0, details: {} });
            };
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
        const p    = livePrice[w.key];
        const chg  = ((p.price - STOCKS[w.key].base) / STOCKS[w.key].base * 100);
        const isUp = p.price >= p.prev;
        const pe   = document.getElementById('wl-price-' + w.key);
        const ce   = document.getElementById('wl-chg-' + w.key);
        if (pe) { pe.textContent = '₹' + fmt(p.price); pe.style.color = isUp ? 'var(--green)' : 'var(--red)'; }
        if (ce) { ce.textContent = `${chg >= 0 ? '▲' : '▼'} ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`; ce.className = 'wl-change ' + (chg >= 0 ? 'up' : 'down'); }
    });
}

/* ═══════════════════════════════════
   4. TICKER
═══════════════════════════════════ */
function buildTicker() {
    const el     = document.getElementById('ticker');
    const stocks = ['nifty', 'sensex', 'hdfcbank', 'infy', 'reliance', 'tcs', 'icicibank'];
    let html = '';
    for (let rep = 0; rep < 2; rep++) {
        stocks.forEach(k => {
            const p    = livePrice[k];
            const chg  = ((p.price - STOCKS[k].base) / STOCKS[k].base * 100);
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
            const p    = livePrice[k];
            const chg  = ((p.price - STOCKS[k].base) / STOCKS[k].base * 100);
            const isUp = chg >= 0;
            const pe   = document.getElementById(`tick-${k}-${rep}`);
            const ce   = document.getElementById(`tick-chg-${k}-${rep}`);
            if (pe) pe.textContent = '₹' + fmt(p.price);
            if (ce) { ce.textContent = `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${chg.toFixed(2)}%`; ce.className = `ticker-chg ${isUp ? 'up' : 'down'}`; }
        });
    }
}

/* ═══════════════════════════════════
   5. STATS BAR — clock/market only
   Signal counts come from updateStatsBarsFromAPI()
═══════════════════════════════════ */
function updateStatsBarsUI() {
    // Only updates bars with simulated counts (safe fallback when API data is stale)
    // Does NOT overwrite values already set by updateStatsBarsFromAPI()
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 3600600);
    const h   = ist.getUTCHours(), m = ist.getUTCMinutes();
    const minutesSinceOpen = Math.max(0, (h - 9) * 60 + (m - 15));

    // Only touch the bars if API hasn't loaded yet
    if (liveSignals.length === 0) {
        document.getElementById('signals-count').textContent = Math.min(47 + Math.floor(minutesSinceOpen * 0.03), 60);
        document.getElementById('high-conf').textContent     = 12;
        document.getElementById('accuracy-val').textContent  = '73%';
        document.getElementById('insider-val').textContent   = '₹284 Cr';
        document.getElementById('insider-sub').textContent   = 'Across 18 stocks';
        ['promoter:18', 'insider:12', 'bulk:9', 'volume:8'].forEach(entry => {
            const [type, val] = entry.split(':');
            const el = document.getElementById('bar-' + type);
            const vl = document.getElementById('val-' + type);
            if (el) el.style.width = (parseInt(val) / 47 * 100) + '%';
            if (vl) vl.textContent = val;
        });
    }
}

/* ═══════════════════════════════════
   6. CHART ENGINE
═══════════════════════════════════ */
function generateCandles(basePrice, count, tf) {
    const candles = [];
    let price = basePrice * (0.92 + Math.random() * 0.02);
    const now = Math.floor(Date.now() / 1000);
    const intervalMap = { '1D': 900, '1W': 3600, '1M': 86400, '3M': 86400 * 3 };
    const intervalSeconds = intervalMap[tf] || 900;

    for (let i = count; i >= 0; i--) {
        const open  = price;
        const range = price * (tf === '1D' ? 0.006 : tf === '1W' ? 0.012 : 0.025);
        const high  = open + Math.random() * range;
        const low   = open - Math.random() * range;
        const close = low + Math.random() * (high - low);
        candles.push({
            time:   now - i * intervalSeconds,
            open:   parseFloat(open.toFixed(2)),
            high:   parseFloat(high.toFixed(2)),
            low:    parseFloat(low.toFixed(2)),
            close:  parseFloat(close.toFixed(2)),
            value:  Math.floor(Math.random() * 1000000 + 200000),
        });
        price = close;
    }
    // Snap last candle to current live price
    const last = candles[candles.length - 1];
    last.close = parseFloat(basePrice.toFixed(2));
    last.high  = Math.max(last.high, basePrice);
    last.low   = Math.min(last.low, basePrice);
    return candles;
}

function createCandleChart(containerId, stockKey, tf) {
    const container = document.getElementById(containerId);
    if (!container) return { chart: null, series: null };
    container.innerHTML = '';

    const h = container.offsetHeight > 50 ? container.offsetHeight : (containerId === 'candle-chart' ? 340 : 300);
    const w = container.offsetWidth  > 50 ? container.offsetWidth  : (container.parentElement ? container.parentElement.offsetWidth : 700) || 700;

    const chart = LightweightCharts.createChart(container, {
        width:  w,
        height: h,
        layout: { background: { color: 'transparent' }, textColor: '#6b6b80' },
        grid:   { vertLines: { color: 'rgba(255,102,0,0.06)' }, horzLines: { color: 'rgba(255,102,0,0.06)' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(255,102,0,0.15)' },
        timeScale:       { borderColor: 'rgba(255,102,0,0.15)', timeVisible: true },
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor:        '#00e676', downColor:       '#ff1744',
        borderUpColor:  '#00e676', borderDownColor: '#ff1744',
        wickUpColor:    '#00e676', wickDownColor:   '#ff1744',
    });

    const counts = { '1D': 78, '1W': 120, '1M': 90, '3M': 90 };
    const base   = (livePrice[stockKey] && livePrice[stockKey].price) ? livePrice[stockKey].price : STOCKS[stockKey] ? STOCKS[stockKey].base : 1000;
    const candles = generateCandles(base, counts[tf] || 78, tf);
    candleSeries.setData(candles);
    chart.timeScale().fitContent();

    // Responsive
    const ro = new ResizeObserver(() => { chart.applyOptions({ width: container.offsetWidth }); chart.timeScale().fitContent(); });
    ro.observe(container);

    // Update OHLCV stat boxes if they exist
    const last = candles[candles.length - 1];
    if (document.getElementById('cs-open')) {
        document.getElementById('cs-open').textContent = '₹' + fmt(last.open);
        document.getElementById('cs-high').textContent = '₹' + fmt(Math.max(...candles.map(c => c.high)));
        document.getElementById('cs-low').textContent  = '₹' + fmt(Math.min(...candles.map(c => c.low)));
        document.getElementById('cs-vol').textContent  = (last.value / 100000).toFixed(1) + 'L';
    }

    return { chart, series: candleSeries };
}

let currentChartStock = 'nifty';
let currentChartTF    = '1D';
let currentDetailStock = 'hdfcbank';
let currentDetailTF    = '1D';

/* ═══════════════════════════════════
   7. MODAL: Signals Today
═══════════════════════════════════ */
function openSignalsTodayModal() {
    document.getElementById('signals-today-modal').classList.add('open');
    switchSignalsTab('nifty', document.querySelector('.signals-today-tab'));
}

function switchSignalsTab(stockKey, tabEl) {
    document.querySelectorAll('.signals-today-tab').forEach(t => t.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
    currentChartStock = stockKey;

    const p    = livePrice[stockKey];
    const chg  = ((p.price - STOCKS[stockKey].base) / STOCKS[stockKey].base * 100);
    const isUp = chg >= 0;

    document.getElementById('chart-current-price').textContent = '₹' + fmt(p.price);
    document.getElementById('modal-stock-badge').textContent   = STOCKS[stockKey].name;

    const badge = document.getElementById('chart-change-badge');
    badge.textContent      = `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${chg.toFixed(2)}%`;
    badge.style.background = isUp ? 'rgba(0,230,118,0.12)' : 'rgba(255,23,68,0.12)';
    badge.style.color      = isUp ? 'var(--green)' : 'var(--red)';

    setTimeout(() => { createCandleChart('candle-chart', stockKey, currentChartTF); }, 50);
}

function setChartTF(tf, btn) {
    currentChartTF = tf;
    document.querySelectorAll('#signals-today-modal .chart-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    switchSignalsTab(currentChartStock, null);
}

/* ═══════════════════════════════════
   8. MODAL: Signal Detail
═══════════════════════════════════ */
function openSignalDetailModal(sig) {
    document.getElementById('signal-detail-modal').classList.add('open');
    document.getElementById('detail-stock-badge').textContent  = sig.badge || sig.stock;
    document.getElementById('detail-signal-type').textContent  = sig.typeLabel || 'Price Chart';
    currentDetailStock = sig.stock;

    const stockKey = resolveStockKey(sig.stock) || sig.stock;
    const p        = livePrice[stockKey];
    const chg      = p ? ((p.price - STOCKS[stockKey].base) / STOCKS[stockKey].base * 100) : 0;
    const isUp     = chg >= 0;

    document.getElementById('detail-price').textContent = p ? ('₹' + fmt(p.price)) : '—';
    const changeEl  = document.getElementById('detail-change');
    changeEl.textContent  = p ? `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${chg.toFixed(2)}%` : '—';
    changeEl.style.color  = isUp ? 'var(--green)' : 'var(--red)';
    document.getElementById('detail-vol').textContent  = (STOCKS[stockKey] && STOCKS[stockKey].vol) ? STOCKS[stockKey].vol : '—';
    document.getElementById('detail-conf').textContent = sig.confidence !== undefined ? sig.confidence + '%' : '—';

    // Details grid
    const grid = document.getElementById('detail-info-grid');
    grid.innerHTML = '';
    const details = sig.details || {};
    Object.entries(details).forEach(([k, v]) => {
        grid.innerHTML += `<div class="detail-item">
            <div class="detail-label">${k}</div>
            <div class="detail-value" style="color:var(--et-orange)">${v}</div>
        </div>`;
    });

    // Add decision if present and not already in details
    if (sig.decision && !details['Decision']) {
        grid.innerHTML += `<div class="detail-item">
            <div class="detail-label">Decision</div>
            <div class="detail-value" style="color:var(--et-orange)">${sig.decision}</div>
        </div>`;
    }

    setTimeout(() => { createCandleChart('detail-candle-chart', stockKey || 'nifty', currentDetailTF); }, 50);
}

function setDetailTF(tf, btn) {
    currentDetailTF = tf;
    document.querySelectorAll('#signal-detail-modal .chart-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    createCandleChart('detail-candle-chart', currentDetailStock, tf);
}

/* ═══════════════════════════════════
   9. MODAL: Accordion (Live Deal Activity)
   Populated from liveSignals (API data).
   Falls back to sample rows if API returned no data of that type.
═══════════════════════════════════ */
// Sample fallback rows (only shown if no API signals of that type exist)
const SAMPLE_INSIDER  = [['INFY','Nilanjan Roy (CFO)','Buy','50,000','₹9.24 Cr','11:12'],['HDFCBANK','Srini Vasan (Dir)','Buy','25,000','₹4.19 Cr','10:30']];
const SAMPLE_BULK     = [['HDFCBANK','HDFC Mutual Fund','Buy','5.31','₹890 Cr','13:45'],['TCS','Morgan Stanley Asia','Sell','1.30','₹450 Cr','09:30']];
const SAMPLE_PROMOTER = [['RELIANCE','Petroleum Trust','Buy','+0.12%','₹280 Cr','12:45'],['HDFCBANK','HDFC Ltd','Sell','-0.08%','₹180 Cr','11:30']];

function openAccordionModal(openSection) {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 3600000);
    const hh  = ist.getUTCHours().toString().padStart(2,'0');
    const mm  = ist.getUTCMinutes().toString().padStart(2,'0');
    const ss  = ist.getUTCSeconds().toString().padStart(2,'0');
    document.getElementById('acc-modal-time').textContent = `As of ${hh}:${mm}:${ss} IST`;

    // Market badges
    const badges = document.getElementById('acc-market-badges');
    badges.innerHTML = '';
    ['nifty', 'sensex'].forEach(k => {
        const p    = livePrice[k];
        const chg  = ((p.price - STOCKS[k].base) / STOCKS[k].base * 100);
        const isUp = chg >= 0;
        badges.innerHTML += `<div class="index-badge">
            <span style="color:var(--et-orange);font-weight:700">${STOCKS[k].name}</span>
            <span>₹${fmt(p.price)}</span>
            <span style="color:${isUp ? 'var(--green)' : 'var(--red)'}">${isUp ? '▲' : '▼'}${isUp ? '+' : ''}${chg.toFixed(2)}%</span>
        </div>`;
    });

    // Build accordion rows from API signals where possible
    populateAccordionTable('insider',  ['Stock','Person/Entity','Type','Qty','Value','Time'],
        liveSignals.filter(s => s.type === 'insider').map(s => [s.badge, s.details['Person'] || '—', s.decision || '—', s.details['Quantity'] || '—', s.details['Value'] || '—', s.detected]),
        SAMPLE_INSIDER);

    populateAccordionTable('bulk',     ['Stock','Client','Type','Qty (Lakh)','Value (Cr)','Time'],
        liveSignals.filter(s => s.type === 'bulk').map(s => [s.badge, s.details['Client'] || '—', s.details['Deal Type'] || s.decision || '—', s.details['Quantity'] || '—', s.details['Value'] || '—', s.detected]),
        SAMPLE_BULK);

    populateAccordionTable('promoter', ['Stock','Promoter','Action','Stake Δ','Value (Cr)','Time'],
        liveSignals.filter(s => s.type === 'promoter').map(s => [s.badge, s.details['Promoter'] || '—', s.decision || '—', s.details['Stake Δ'] || '—', s.details['Value'] || '—', s.detected]),
        SAMPLE_PROMOTER);

    document.getElementById('accordion-modal').classList.add('open');

    if (openSection) {
        setTimeout(() => {
            const el = document.getElementById('acc-' + openSection);
            if (el && !el.classList.contains('open')) toggleAccordion('acc-' + openSection);
        }, 100);
    }
}

function populateAccordionTable(type, headers, apiRows, fallbackRows) {
    const tbody = document.querySelector(`#acc-table-${type} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';
    const rows = (apiRows && apiRows.length > 0) ? apiRows : fallbackRows;
    rows.forEach(row => {
        const isBuy = String(row[2]).toLowerCase().includes('buy');
        tbody.innerHTML += `<tr>
            <td><span style="color:var(--et-orange);font-weight:700">${row[0]}</span></td>
            <td>${row[1]}</td>
            <td class="${isBuy ? 'buy' : 'sell'}">${row[2]}</td>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
            <td>${row[5]} IST</td>
        </tr>`;
    });
}

function toggleAccordion(id) {
    document.getElementById(id).classList.toggle('open');
}

/* ═══════════════════════════════════
   10. MODAL CLOSE
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
   11. CLOCK + MARKET STATUS
═══════════════════════════════════ */
function updateTime() {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 3600000);
    const h   = ist.getUTCHours();
    const m   = ist.getUTCMinutes();
    const s   = ist.getUTCSeconds();
    document.getElementById('market-time').textContent =
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} IST`;

    const badge = document.getElementById('market-status-badge');
    if ((h > 9 || (h === 9 && m >= 15)) && (h < 15 || (h === 15 && m <= 30))) {
        badge.textContent = 'MARKET OPEN';   badge.className = 'market-status open';
    } else if (h === 9 && m < 15) {
        badge.textContent = 'PRE-MARKET';    badge.className = 'market-status pre';
    } else {
        badge.textContent = 'MARKET CLOSED'; badge.className = 'market-status closed';
    }
}

/* ═══════════════════════════════════
   12. SINGLE window.onload  ← only one
═══════════════════════════════════ */
window.onload = function () {
    // 1. Initialise price engine
    initPrices();
    for (let i = 0; i < 20; i++) tickPrices();   // seed variance

    // 2. Static UI
    buildTicker();
    renderWatchlist();
    updateStatsBarsUI();   // shows placeholder stats while API loads
    updateTime();

    // 3. Load signal feed from Flask API  ← this is the ONLY source of signal cards
    loadSignals();

    // 4. Live update intervals
    setInterval(() => {
        tickPrices();
        updateWatchlistPrices();
        updateTicker();
    }, 1500);

    setInterval(updateTime, 1000);

    // Periodically re-fetch signals (every 60s) to stay live
    setInterval(loadSignals, 60000);
};
