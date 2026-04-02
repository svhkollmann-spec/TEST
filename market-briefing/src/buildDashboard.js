/**
 * buildDashboard.js
 * Generates a standalone dashboard.html matching the 3-panel layout:
 *
 *   ┌─────────────────────┬─────────────────────────────────┐
 *   │   TICKERS           │                                 │
 *   │   PLS / LTR +       │  Biggest Overnight Events       │
 *   │   benchmarks        │  (scored headlines)             │
 *   ├─────────────────────│                                 │
 *   │   SMM SPOT PRICES   │                                 │
 *   │   + GFEX LC Curve   │                                 │
 *   └─────────────────────┴─────────────────────────────────┘
 */

const PANEL_BG = '#1a6b8a';

function fmt(n, dp = 2) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}
function dirColor(dir) {
  return dir === 'up' ? '#4ade80' : dir === 'down' ? '#f87171' : 'rgba(255,255,255,0.55)';
}
function dirArrow(dir) {
  return dir === 'up' ? '▲' : dir === 'down' ? '▼' : '';
}
function numColor(val) {
  const n = parseFloat(String(val).replace(/[^0-9.\-+]/g, ''));
  if (isNaN(n) || n === 0) return 'rgba(255,255,255,0.55)';
  return n > 0 ? '#4ade80' : '#f87171';
}
function numArrow(val) {
  const n = parseFloat(String(val).replace(/[^0-9.\-+]/g, ''));
  if (isNaN(n) || n === 0) return '';
  return n > 0 ? '▲' : '▼';
}

// ---------------------------------------------------------------------------
// Panel: Tickers
// ---------------------------------------------------------------------------
function tickerPanel(quotes) {
  const rows = quotes.map(q => {
    const col   = dirColor(q.direction);
    const arrow = dirArrow(q.direction);
    const pct   = q.changePct !== null ? fmtPct(q.changePct) : '—';
    const price = q.price     !== null ? fmt(q.price)        : '—';
    return `
      <div class="ticker-row">
        <div class="ticker-left">
          <span class="ticker-symbol">${q.symbol.replace('.AX','')}</span>
          <span class="ticker-name">${q.name}</span>
        </div>
        <div class="ticker-right">
          <span class="ticker-price">${price}</span>
          <span class="ticker-chg" style="color:${col}">${arrow} ${pct}</span>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="panel" id="panel-tickers">
      <div class="panel-header">TICKERS</div>
      <div class="ticker-list">${rows}</div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Panel: SMM Spot Prices + GFEX Futures Curve
// ---------------------------------------------------------------------------
function smmPanel(smmData, gfexContracts) {
  // ── Spot price rows ───────────────────────────────────────────────────────
  let spotSection = '';
  if (smmData && smmData.prices.length > 0) {
    const rows = smmData.prices.map(p => {
      const col = p.changeType === 'up' ? '#4ade80' : p.changeType === 'down' ? '#f87171' : 'rgba(255,255,255,0.55)';
      const arr = p.changeType === 'up' ? '▲'       : p.changeType === 'down' ? '▼'       : '';
      return `
        <div class="price-row">
          <span class="price-label">${p.label}</span>
          <div class="price-right">
            <span class="price-value">${p.price}${p.unit ? ` <small>${p.unit}</small>` : ''}</span>
            ${p.change ? `<span class="price-chg" style="color:${col}">${arr} ${p.change}</span>` : ''}
          </div>
        </div>`;
    }).join('');
    spotSection = `
      <div class="smm-source">Source: ${smmData.source} · as of ${new Date().toLocaleDateString('en-AU',{timeZone:'Australia/Sydney'})}</div>
      <div class="price-list">${rows}</div>`;
  } else {
    spotSection = `
      <div class="smm-source">SMM spot data inaccessible (paywalled) — see
        <a href="https://www.metal.com/Lithium" style="color:rgba(255,255,255,0.55);">metal.com/Lithium</a>
      </div>`;
  }

  // ── GFEX futures table ────────────────────────────────────────────────────
  let gfexSection = '';
  if (gfexContracts && gfexContracts.length > 0) {
    const rows = gfexContracts.map(c => {
      const col = numColor(c.change);
      const arr = numArrow(c.change);
      // Highlight front month
      const isFront = c === gfexContracts[0];
      const rowStyle = isFront ? 'background:rgba(255,255,255,0.1);' : '';
      return `
        <tr style="${rowStyle}">
          <td class="ft-contract">${c.contract}${isFront ? ' <span class="front-tag">FM</span>' : ''}</td>
          <td class="ft-num">${c.settle}</td>
          <td class="ft-chg" style="color:${col}">${arr} ${c.change}</td>
          <td class="ft-num ft-muted">${c.volume}</td>
          <td class="ft-num ft-muted">${c.openInterest}</td>
        </tr>`;
    }).join('');

    gfexSection = `
      <div class="gfex-header">
        <span>GFEX LC FUTURES CURVE</span>
        <a href="http://www.gfex.com.cn/en/LithiumCarbonate/LithiumCarbonate.shtml"
           class="gfex-link" target="_blank">gfex.com.cn ↗</a>
      </div>
      <div class="gfex-table-wrap">
        <table class="gfex-table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Settle (CNY/t)</th>
              <th>Chg</th>
              <th>Volume</th>
              <th>OI</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  return `
    <div class="panel" id="panel-smm">
      <div class="panel-header">SMM LITHIUM PRICE UPDATE</div>
      ${spotSection}
      ${gfexSection}
    </div>`;
}

// ---------------------------------------------------------------------------
// Panel: Biggest Overnight Events
// ---------------------------------------------------------------------------
function eventsPanel(topEvent, bySource) {
  const top = topEvent ? `
    <div class="top-event">
      <div class="top-event-label">⚡ TOP STORY</div>
      <div class="top-event-text">${topEvent.text}</div>
      <div class="top-event-meta">
        ${topEvent.source}${topEvent.link ? ` — <a href="${topEvent.link}" class="ev-link" target="_blank">Read more ↗</a>` : ''}
      </div>
    </div>` : '';

  const cols = Object.entries(bySource).slice(0, 4).map(([src, items]) => `
    <div class="source-col">
      <div class="source-label">${src}</div>
      ${items.slice(0, 4).map(h => `
        <div class="headline-item">
          ${h.link && h.link !== '#'
            ? `<a href="${h.link}" class="ev-link" target="_blank">${h.text}</a>`
            : h.text}
        </div>`).join('')}
    </div>`).join('');

  return `
    <div class="panel" id="panel-events">
      <div class="panel-header">BIGGEST OVERNIGHT PUBLISHED EVENTS</div>
      ${top}
      <div class="sources-grid">${cols}</div>
      ${!topEvent && !Object.keys(bySource).length
        ? '<p class="empty-msg">No headlines fetched — check sources in config.js</p>'
        : ''}
    </div>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function buildDashboard({ quotes, topEvent, bySource, smmData, gfexContracts, dateStr }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Lithium Morning Briefing — ${dateStr}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #eef0f3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #fff;
      min-height: 100vh;
      padding: 28px 32px;
    }

    /* ── Page header ── */
    .page-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 22px;
    }
    .page-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -.02em;
    }
    .page-subtitle {
      font-size: 13px;
      color: #64748b;
    }

    /* ── Grid ── */
    .dashboard {
      display: grid;
      grid-template-columns: 42% 1fr;
      gap: 20px;
      align-items: start;
    }
    .left-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Panel base ── */
    .panel {
      background: ${PANEL_BG};
      border-radius: 12px;
      padding: 22px 24px 26px;
    }
    #panel-events {
      grid-column: 2;
      grid-row: 1 / span 2;
    }
    .panel-header {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      padding-bottom: 12px;
      margin-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    /* ── Tickers ── */
    .ticker-list { display: flex; flex-direction: column; gap: 5px; }
    .ticker-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(0,0,0,0.13);
    }
    .ticker-left  { display: flex; flex-direction: column; gap: 2px; }
    .ticker-symbol{ font-size: 14px; font-weight: 700; }
    .ticker-name  { font-size: 11px; color: rgba(255,255,255,0.55); }
    .ticker-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .ticker-price { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .ticker-chg   { font-size: 11px; font-weight: 700; }

    /* ── SMM spot prices ── */
    .smm-source {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      margin-bottom: 10px;
    }
    .price-list { display: flex; flex-direction: column; gap: 5px; margin-bottom: 20px; }
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-radius: 7px;
      background: rgba(0,0,0,0.13);
      gap: 8px;
    }
    .price-label { font-size: 12px; color: rgba(255,255,255,0.8); flex: 1; }
    .price-right { display: flex; align-items: center; gap: 10px; }
    .price-value { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .price-value small { font-size: 10px; color: rgba(255,255,255,0.45); margin-left: 2px; }
    .price-chg   { font-size: 11px; font-weight: 700; min-width: 52px; text-align: right; }

    /* ── GFEX futures table ── */
    .gfex-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
      margin-bottom: 8px;
    }
    .gfex-link {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
      text-decoration: none;
      letter-spacing: 0;
      text-transform: none;
    }
    .gfex-link:hover { color: rgba(255,255,255,0.7); }

    .gfex-table-wrap { overflow-x: auto; }
    .gfex-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    .gfex-table thead tr {
      background: rgba(0,0,0,0.18);
    }
    .gfex-table th {
      padding: 6px 8px;
      text-align: right;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: .07em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
    }
    .gfex-table th:first-child { text-align: left; }
    .gfex-table td {
      padding: 5px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .gfex-table tbody tr:hover { background: rgba(255,255,255,0.04); }
    .ft-contract { font-weight: 600; font-size: 12px; }
    .ft-num      { text-align: right; font-variant-numeric: tabular-nums; }
    .ft-chg      { text-align: right; font-weight: 700; }
    .ft-muted    { color: rgba(255,255,255,0.45); }
    .front-tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      background: rgba(255,255,255,0.15);
      border-radius: 3px;
      padding: 1px 4px;
      margin-left: 4px;
      letter-spacing: .04em;
      vertical-align: middle;
    }

    /* ── Events panel ── */
    .top-event {
      background: rgba(0,0,0,0.18);
      border-left: 3px solid rgba(255,255,255,0.4);
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 22px;
    }
    .top-event-label {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
      margin-bottom: 7px;
    }
    .top-event-text {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.5;
      margin-bottom: 8px;
    }
    .top-event-meta {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
    }

    .sources-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    .source-col { display: flex; flex-direction: column; gap: 6px; }
    .source-label {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: .09em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      margin-bottom: 3px;
    }
    .headline-item {
      font-size: 12px;
      line-height: 1.5;
      padding: 7px 9px;
      border-radius: 6px;
      background: rgba(0,0,0,0.12);
      color: rgba(255,255,255,0.85);
    }
    .ev-link { color: rgba(255,255,255,0.85); text-decoration: none; }
    .ev-link:hover { text-decoration: underline; }

    .empty-msg { font-size: 13px; color: rgba(255,255,255,0.4); font-style: italic; padding: 16px 0; }

    @media (max-width: 960px) {
      body { padding: 16px; }
      .dashboard { grid-template-columns: 1fr; }
      #panel-events { grid-column: 1; grid-row: auto; }
      .sources-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="page-header">
    <div class="page-title">Lithium Morning Briefing</div>
    <div class="page-subtitle">${dateStr}</div>
  </div>
  <div class="dashboard">
    <div class="left-col">
      ${tickerPanel(quotes)}
      ${smmPanel(smmData, gfexContracts)}
    </div>
    ${eventsPanel(topEvent, bySource)}
  </div>
</body>
</html>`;
}

module.exports = { buildDashboard };
