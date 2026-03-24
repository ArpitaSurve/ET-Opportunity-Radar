// ── FILTER TABS ──
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

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
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 100);
    });
}, 500);
