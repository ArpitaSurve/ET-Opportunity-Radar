// ── LIVE IST CLOCK ──
function updateTime() {
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const h = ist.getUTCHours().toString().padStart(2, '0');
    const m = ist.getUTCMinutes().toString().padStart(2, '0');
    const s = ist.getUTCSeconds().toString().padStart(2, '0');
    document.getElementById('market-time').textContent = `${h}:${m}:${s} IST`;
}
setInterval(updateTime, 1000);
updateTime();

// ── ANIMATE SIGNAL BREAKDOWN BARS ON LOAD ──
setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => { bar.style.width = targetWidth; }, 100);
    });
}, 500);


// ── GLOBAL STATE ──
let allSignals   = [];
let activeFilter = 'All';

const FILTER_MAP = {
    'All':       null,
    'Insider':   ['Insider Trading Detected'],
    'Bulk Deal': ['Bulk Deal Alert'],
    'Promoter':  ['Promoter Buying'],
};


// ── UPDATE STATS BAR FROM REAL DATA ──
function updateStatsBar(signals) {
    // Total signal count
    document.getElementById('signals-count').textContent = signals.length;

    // High confidence count (>=80%)
    const highConf = signals.filter(s => s.confidence >= 80).length;
    document.getElementById('high-conf').textContent = highConf;

    // Average backtest accuracy across signals that have it
    const withAcc = signals.filter(s => s.backtest_accuracy && s.backtest_accuracy !== 'N/A');
    if (withAcc.length > 0) {
        const avg = withAcc.reduce((sum, s) => sum + parseFloat(s.backtest_accuracy), 0) / withAcc.length;
        document.getElementById('accuracy-val').textContent = Math.round(avg) + '%';
    }

    // Signal breakdown bars
    const counts = {
        'Promoter Buying':           0,
        'Insider Trading Detected':  0,
        'Bulk Deal Alert':           0,
        'High Volume Alert':         0,
    };
    signals.forEach(s => {
        if (counts[s.signal_type] !== undefined) counts[s.signal_type]++;
    });

    const total  = signals.length || 1;
    const barKeys = [
        'Promoter Buying',
        'Insider Trading Detected',
        'Bulk Deal Alert',
        'High Volume Alert',
    ];

    document.querySelectorAll('.summary-bar').forEach((barEl, i) => {
        const fill  = barEl.querySelector('.bar-fill');
        const valEl = barEl.querySelector('.bar-val');
        if (!fill || !barKeys[i]) return;
        const cnt = counts[barKeys[i]] || 0;
        fill.style.width = Math.round((cnt / total) * 100) + '%';
        if (valEl) valEl.textContent = cnt;
    });
}


// ── ML BADGE CSS CLASS ──
function decisionClass(decision) {
    if (decision === 'BUY')   return 'decision-buy';
    if (decision === 'WATCH') return 'decision-watch';
    return 'decision-avoid';
}


// ── BUILD ONE SIGNAL CARD ──
function buildCard(signal) {
    const card = document.createElement('div');

    let level = 'low';
    if (signal.confidence >= 80)      level = 'high';
    else if (signal.confidence >= 65) level = 'medium';

    card.className          = `signal-card ${level}`;
    card.dataset.signalType = signal.signal_type;

    // Backtest row — only render if backend sent it
    const backtestHTML = (signal.backtest_accuracy && signal.backtest_accuracy !== 'N/A')
        ? `<div class="meta-item">Backtest: <span>${signal.backtest_accuracy} acc.</span></div>`
        : '';

    // ML decision badge — only render if backend sent it
    const decisionHTML = signal.decision
        ? `<span class="decision-badge ${decisionClass(signal.decision)}">${signal.decision}</span>`
        : '';

    // Confidence colour
    let confClass = '';
    if (signal.confidence < 65)       confClass = 'low-c';
    else if (signal.confidence < 80)  confClass = 'mid';

    card.innerHTML = `
        <div class="signal-top">
            <div class="signal-stock">
                <div class="stock-badge">${signal.stock}</div>
                <div class="signal-type-tag">${signal.signal_type}</div>
            </div>
            <div class="confidence-badge">
                <div class="confidence-num ${confClass}">${signal.confidence}%</div>
                <div class="confidence-label">Confidence</div>
            </div>
        </div>

        <div class="signal-message">${signal.message}</div>

        <div class="signal-bottom">
            <div class="signal-meta">
                <div class="meta-item">Detected: <span>Now</span></div>
                ${backtestHTML}
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                ${decisionHTML}
                <button class="signal-action">View Signal →</button>
            </div>
        </div>
    `;

    return card;
}


// ── RENDER CARDS ──
function renderSignals() {
    const container   = document.getElementById('signal-feed');
    container.innerHTML = '';

    const filterTypes = FILTER_MAP[activeFilter];
    const filtered    = filterTypes
        ? allSignals.filter(s => filterTypes.includes(s.signal_type))
        : allSignals;

    if (filtered.length === 0) {
        container.innerHTML = `
            <p style="color:var(--text-dim);font-family:'Space Mono',monospace;font-size:13px;padding:20px 0;">
                No ${activeFilter === 'All' ? '' : activeFilter} signals detected right now.
            </p>`;
        return;
    }

    filtered.forEach((signal, i) => {
        const card = buildCard(signal);
        card.style.animationDelay = `${i * 0.08}s`;
        container.appendChild(card);
    });
}


// ── FETCH SIGNALS FROM BACKEND ──
async function loadSignals() {
    try {
        const response = await fetch('/api/signals');
        allSignals     = await response.json();
        updateStatsBar(allSignals);
        renderSignals();
    } catch (error) {
        console.error('Error loading signals:', error);
        document.getElementById('signal-feed').innerHTML = `
            <p style="color:var(--red);font-family:'Space Mono',monospace;font-size:13px;">
                Failed to load signals. Is the Flask server running?
            </p>`;
    }
}


// ── FILTER TABS ──
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.textContent.trim();
        renderSignals();
    });
});


// ── START ──
loadSignals();
setInterval(loadSignals, 15000);
