/**
 * buildDashboard.js
 * Generates a standalone dashboard.html matching the 3-panel layout:
 *
 *   ┌─────────────────────┬─────────────────────────────────┐
 *   │   TICKERS           │                                 │
 *   │   PLS / LTR +       │  Biggest Overnight Events       │
 *   │   benchmarks        │  (scored headlines)             │
 *   ├─────────────────────│                                 │
 *   │   SMM Lithium       │                                 │
 *   │   Price Update      │                                 │
 *   └─────────────────────┴─────────────────────────────────┘
 */

const PANEL_BG   = '#1a6b8a';
const PANEL_DARK = '#155a75';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n, dp = 2) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}

function chgColor(dir) {
  return dir === 'up' ? '#4ade80' : dir === 'down' ? '#f87171' : 'rgba(255,255,255,0.7)';
}

function chgArrow(dir) {
  return dir === 'up' ? '▲' : dir === 'down' ? '▼' : '';
}

// ---------------------------------------------------------------------------
// Panel: Tickers
// ---------------------------------------------------------------------------
function tickerPanel(quotes) {
  const rows = quotes.map(q => {
    const color = chgColor(q.direction);
    const arrow = chgArrow(q.direction);
    const pct   = q.changePct !== null ? fmtPct(q.changePct) : '—';
    const price = q.price     !== null ? fmt(q.price)        : '—';

    return `
      <div class="ticker-row">
        <div class="ticker-left">
          <span class="ticker-symbol">${q.symbol.replace('.AX', '')}</span>
          <span class="ticker-name">${q.name}</span>
        </div>
        <div class="ticker-right">
          <span class="ticker-price">${price}</span>
          <span class="ticker-chg" style="color:${color}">${arrow} ${pct}</span>
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
// Panel: SMM Lithium Price Update
// ---------------------------------------------------------------------------
function smmPanel(smmData, gfexContracts) {
  // If SMM scraping worked, show those prices
  if (smmData && smmData.prices.length > 0) {
    const rows = smmData.prices.slice(0, 8).map(p => `
      <div class="price-row">
        <span class="price-label">${p.label}</span>
        <span class="price-value">${p.price}${p.unit ? ' <small>' + p.unit + '</small>' : ''}</span>
      </div>`).join('');

    return `
      <div class="panel" id="panel-smm">
        <div class="panel-header">SMM LITHIUM PRICE UPDATE</div>
        <div class="smm-source">Source: ${smmData.source}</div>
        <div class="price-list">${rows}</div>
      </div>`;
  }

  // Fallback: show GFEX LC front months as a reference
  if (gfexContracts && gfexContracts.length > 0) {
    const front4 = gfexContracts.slice(0, 5);
    const rows   = front4.map(c => {
      const chg  = parseFloat((c.change || '').replace(/,/g, ''));
      const col  = isNaN(chg) ? 'rgba(255,255,255,0.7)' : chg > 0 ? '#4ade80' : chg < 0 ? '#f87171' : 'rgba(255,255,255,0.7)';
      const arr  = isNaN(chg) ? '' : chg > 0 ? '▲' : chg < 0 ? '▼' : '';
      return `
        <div class="price-row">
          <span class="price-label">${c.contract}</span>
          <span class="price-value">${c.settle} <small>CNY/t</small></span>
          <span class="price-chg" style="color:${col}">${arr} ${c.change ?? ''}</span>
        </div>`;
    }).join('');

    return `
      <div class="panel" id="panel-smm">
        <div class="panel-header">GFEX LC FUTURES</div>
        <div class="smm-source">Chinese Lithium Carbonate (GFEX settlement prices)</div>
        <div class="price-list">${rows}</div>
        <div class="smm-note">
          SMM spot data inaccessible — showing GFEX futures as reference.<br/>
          Full curve: <a href="http://www.gfex.com.cn/en/LithiumCarbonate/LithiumCarbonate.shtml"
            style="color:rgba(255,255,255,0.6);">gfex.com.cn</a>
        </div>
      </div>`;
  }

  // No data at all
  return `
    <div class="panel" id="panel-smm">
      <div class="panel-header">SMM LITHIUM PRICE UPDATE</div>
      <div class="smm-note" style="margin-top:24px;">
        Price data unavailable.<br/><br/>
        SMM and GFEX data require either a subscription or the Chromium
        browser (run <code>npm run install-browsers</code>).<br/><br/>
        <a href="https://www.metal.com/Lithium" style="color:rgba(255,255,255,0.6);">
          metal.com/Lithium
        </a>
      </div>
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
      <div class="top-event-source">
        ${topEvent.source}
        ${topEvent.link ? `— <a href="${topEvent.link}" class="event-link">Read more ↗</a>` : ''}
      </div>
    </div>` : '';

  const sourceBlocks = Object.entries(bySource)
    .slice(0, 4)
    .map(([src, items]) => {
      const headlines = items.slice(0, 4).map(h => `
        <div class="headline-item">
          ${h.link
            ? `<a href="${h.link}" class="event-link">${h.text}</a>`
            : h.text}
        </div>`).join('');
      return `
        <div class="source-block">
          <div class="source-label">${src}</div>
          ${headlines}
        </div>`;
    }).join('');

  const empty = !topEvent && Object.keys(bySource).length === 0
    ? '<div class="empty-msg">No headlines available — check news sources in config.js</div>'
    : '';

  return `
    <div class="panel" id="panel-events">
      <div class="panel-header">BIGGEST OVERNIGHT PUBLISHED EVENTS</div>
      ${top}
      <div class="sources-grid">${sourceBlocks}</div>
      ${empty}
    </div>`;
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------
function buildDashboard({ quotes, topEvent, bySource, smmData, gfexContracts, dateStr }) {
  const leftTop    = tickerPanel(quotes);
  const leftBottom = smmPanel(smmData, gfexContracts);
  const right      = eventsPanel(topEvent, bySource);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Lithium Morning Briefing — ${dateStr}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #f0f2f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #fff;
      min-height: 100vh;
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 20px;
    }
    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -.02em;
    }
    .page-date {
      font-size: 13px;
      color: #64748b;
    }

    /* ── Grid ── */
    .dashboard {
      display: grid;
      grid-template-columns: 44% 1fr;
      grid-template-rows: auto auto;
      gap: 18px;
      align-items: start;
    }

    .left-col {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    /* ── Panels ── */
    .panel {
      background: ${PANEL_BG};
      border-radius: 10px;
      padding: 22px 24px 24px;
      overflow: hidden;
    }

    #panel-events {
      grid-column: 2;
      grid-row: 1 / span 2;
      align-self: stretch;
    }

    .panel-header {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.55);
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }

    /* ── Tickers ── */
    .ticker-list { display: flex; flex-direction: column; gap: 4px; }

    .ticker-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 10px;
      border-radius: 6px;
      background: rgba(0,0,0,0.12);
      gap: 8px;
    }

    .ticker-left { display: flex; flex-direction: column; gap: 2px; }
    .ticker-symbol { font-size: 15px; font-weight: 700; }
    .ticker-name   { font-size: 11px; color: rgba(255,255,255,0.6); }

    .ticker-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .ticker-price { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .ticker-chg   { font-size: 12px; font-weight: 600; }

    /* ── SMM prices ── */
    .smm-source { font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 12px; }

    .price-list { display: flex; flex-direction: column; gap: 6px; }
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      border-radius: 6px;
      background: rgba(0,0,0,0.12);
      gap: 8px;
    }
    .price-label { font-size: 13px; color: rgba(255,255,255,0.85); flex: 1; }
    .price-value { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .price-value small { font-size: 10px; color: rgba(255,255,255,0.5); margin-left: 3px; }
    .price-chg   { font-size: 12px; font-weight: 600; width: 60px; text-align: right; }

    .smm-note {
      margin-top: 14px;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
      line-height: 1.6;
    }
    .smm-note code { background: rgba(0,0,0,0.2); padding: 1px 4px; border-radius: 3px; }

    /* ── Events panel ── */
    .top-event {
      background: rgba(0,0,0,0.18);
      border-left: 3px solid rgba(255,255,255,0.5);
      border-radius: 6px;
      padding: 14px 16px;
      margin-bottom: 20px;
    }
    .top-event-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.5);
      margin-bottom: 6px;
    }
    .top-event-text {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.45;
      margin-bottom: 8px;
    }
    .top-event-source {
      font-size: 11px;
      color: rgba(255,255,255,0.5);
    }

    .sources-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .source-block { display: flex; flex-direction: column; gap: 6px; }

    .source-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .07em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
      margin-bottom: 4px;
    }

    .headline-item {
      font-size: 12px;
      line-height: 1.45;
      color: rgba(255,255,255,0.85);
      padding: 6px 8px;
      border-radius: 5px;
      background: rgba(0,0,0,0.1);
    }

    .event-link {
      color: rgba(255,255,255,0.85);
      text-decoration: none;
    }
    .event-link:hover { text-decoration: underline; }

    .empty-msg {
      font-size: 13px;
      color: rgba(255,255,255,0.45);
      font-style: italic;
      padding: 20px 0;
    }

    @media (max-width: 900px) {
      .dashboard { grid-template-columns: 1fr; }
      #panel-events { grid-column: 1; grid-row: auto; }
      .sources-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="page-header">
    <div class="page-title">Lithium Morning Briefing</div>
    <div class="page-date">${dateStr}</div>
  </div>

  <div class="dashboard">
    <div class="left-col">
      ${leftTop}
      ${leftBottom}
    </div>
    ${right}
  </div>
</body>
</html>`;
}

module.exports = { buildDashboard };
