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


// ── STORE ALL SIGNALS GLOBALLY (for filtering) ──
let allSignals = [];
let activeFilter = 'All';

// Map each filter tab label → which signal_type strings it matches
const FILTER_MAP = {
    'All':      null,   // null = show everything
    'Insider':  ['Insider Trading Detected'],
    'Bulk Deal':['Bulk Deal Alert'],
    'Promoter': ['Promoter Buying'],
};


// ── BUILD ONE SIGNAL CARD (returns a DOM element) ──
function buildCard(signal) {
    const card = document.createElement('div');

    let level = 'low';
    if (signal.confidence >= 80)      level = 'high';
    else if (signal.confidence >= 65)  level = 'medium';

    card.className = `signal-card ${level}`;
    // store signal_type on the element so filtering can read it
    card.dataset.signalType = signal.signal_type;

    card.innerHTML = `
        <div class="signal-top">
            <div class="signal-stock">
                <div class="stock-badge">${signal.stock}</div>
                <div class="signal-type-tag">${signal.signal_type}</div>
            </div>
            <div class="confidence-badge">
                <div class="confidence-num ${signal.confidence < 65 ? 'low-c' : signal.confidence < 80 ? 'mid' : ''}">${signal.confidence}%</div>
                <div class="confidence-label">Confidence</div>
            </div>
        </div>
        <div class="signal-message">${signal.message}</div>
        <div class="signal-bottom">
            <div class="signal-meta">
                <div class="meta-item">Detected: <span>Now</span></div>
            </div>
            <button class="signal-action">View Signal →</button>
        </div>
    `;

    return card;
}


// ── RENDER CARDS BASED ON ACTIVE FILTER ──
function renderSignals() {
    const container = document.getElementById('signal-feed');
    container.innerHTML = '';

    const filterTypes = FILTER_MAP[activeFilter];  // null or array

    const filtered = filterTypes
        ? allSignals.filter(s => filterTypes.includes(s.signal_type))
        : allSignals;

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color:var(--text-dim); font-family:'Space Mono',monospace; font-size:13px; padding:20px 0;">
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


// ── FETCH LIVE SIGNALS FROM BACKEND ──
async function loadSignals() {
    try {
        const response = await fetch('/api/signals');
        allSignals = await response.json();
        renderSignals();
    } catch (error) {
        console.error('Error loading signals:', error);
        document.getElementById('signal-feed').innerHTML =
            `<p style="color:var(--red); font-family:'Space Mono',monospace; font-size:13px;">
                Failed to load signals. Is the Flask server running?
            </p>`;
    }
}


// ── FILTER TABS — now actually filter the rendered cards ──
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.textContent.trim();
        renderSignals();   // re-render with new filter
    });
});


// ── KICK OFF ──
loadSignals();
setInterval(loadSignals, 15000);   // auto-refresh every 15 seconds
