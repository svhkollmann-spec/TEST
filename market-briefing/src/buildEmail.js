/**
 * buildEmail.js
 * Builds the HTML (and plain-text fallback) for the morning briefing email.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${Number(n).toFixed(2)}%`;
}

function dirColor(dir) {
  return dir === 'up' ? '#16a34a' : dir === 'down' ? '#dc2626' : '#6b7280';
}

function dirArrow(dir) {
  return dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—';
}

// Colour a GFEX change value (raw string, e.g. "-120" or "+80")
function changeColor(val) {
  if (!val || val === '—') return '#6b7280';
  const n = parseFloat(val.replace(/,/g, ''));
  if (isNaN(n)) return '#6b7280';
  return n > 0 ? '#16a34a' : n < 0 ? '#dc2626' : '#6b7280';
}

// ---------------------------------------------------------------------------
// Quote table rows
// ---------------------------------------------------------------------------
function quoteRows(quotes) {
  return quotes
    .map(q => {
      const color = dirColor(q.direction);
      const arrow = dirArrow(q.direction);
      return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 12px;font-weight:600;">${q.symbol}</td>
          <td style="padding:8px 12px;color:#374151;">${q.name}</td>
          <td style="padding:8px 12px;text-align:right;font-variant-numeric:tabular-nums;">
            ${q.price !== null ? fmt(q.price) : '—'}
          </td>
          <td style="padding:8px 12px;text-align:right;color:${color};font-weight:600;">
            ${arrow} ${fmtPct(q.changePct)}
          </td>
          <td style="padding:8px 12px;text-align:right;color:${color};">
            ${q.change !== null ? (q.change >= 0 ? '+' : '') + fmt(q.change) : '—'}
          </td>
        </tr>`;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// GFEX LC Futures table
// ---------------------------------------------------------------------------
function gfexTableHtml(contracts) {
  if (!contracts || contracts.length === 0) {
    return `
      <div style="margin-bottom:32px;">
        <h2 style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;
                   letter-spacing:.06em;margin:0 0 12px;">
          GFEX Lithium Carbonate Futures (CNY/t)
        </h2>
        <p style="font-size:13px;color:#9ca3af;font-style:italic;">
          Data unavailable — GFEX may have blocked the request or Chromium is not installed.<br/>
          Run <code>npm run install-browsers</code> then retry.
        </p>
      </div>`;
  }

  const rows = contracts.map(c => {
    const chgColor = changeColor(c.change);
    return `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:6px 10px;font-weight:600;color:#0f172a;">${c.contract}</td>
        <td style="padding:6px 10px;text-align:right;">${c.prevSettle}</td>
        <td style="padding:6px 10px;text-align:right;">${c.open}</td>
        <td style="padding:6px 10px;text-align:right;">${c.high}</td>
        <td style="padding:6px 10px;text-align:right;">${c.low}</td>
        <td style="padding:6px 10px;text-align:right;font-weight:600;">${c.settle}</td>
        <td style="padding:6px 10px;text-align:right;color:${chgColor};font-weight:600;">${c.change}</td>
        <td style="padding:6px 10px;text-align:right;color:${chgColor};">${c.changePct}</td>
        <td style="padding:6px 10px;text-align:right;color:#6b7280;">${c.volume}</td>
        <td style="padding:6px 10px;text-align:right;color:#6b7280;">${c.openInterest}</td>
      </tr>`;
  }).join('');

  return `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;
                 letter-spacing:.06em;margin:0 0 4px;">
        GFEX Lithium Carbonate Futures (CNY/t)
      </h2>
      <p style="font-size:11px;color:#9ca3af;margin:0 0 10px;">
        Source: <a href="http://www.gfex.com.cn/en/LithiumCarbonate/LithiumCarbonate.shtml"
                   style="color:#9ca3af;">gfex.com.cn</a>
        · ${contracts[0]?.date ?? ''}
      </p>
      <div style="overflow-x:auto;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="font-size:12px;border-collapse:collapse;min-width:580px;">
          <thead>
            <tr style="background:#f0fdf4;font-size:10px;color:#6b7280;text-transform:uppercase;">
              <th style="padding:6px 10px;text-align:left;">Contract</th>
              <th style="padding:6px 10px;text-align:right;">Prev.Settle</th>
              <th style="padding:6px 10px;text-align:right;">Open</th>
              <th style="padding:6px 10px;text-align:right;">High</th>
              <th style="padding:6px 10px;text-align:right;">Low</th>
              <th style="padding:6px 10px;text-align:right;">Settle</th>
              <th style="padding:6px 10px;text-align:right;">Chg</th>
              <th style="padding:6px 10px;text-align:right;">Chg%</th>
              <th style="padding:6px 10px;text-align:right;">Volume</th>
              <th style="padding:6px 10px;text-align:right;">OI</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Headlines section per source
// ---------------------------------------------------------------------------
function headlineSection(source, headlines) {
  const items = headlines
    .slice(0, 6)
    .map(h => `
      <li style="margin-bottom:6px;line-height:1.5;">
        <a href="${h.link}" style="color:#1d4ed8;text-decoration:none;">${h.text}</a>
      </li>`)
    .join('');

  return `
    <div style="margin-bottom:24px;">
      <h3 style="margin:0 0 8px;font-size:14px;color:#6b7280;text-transform:uppercase;
                 letter-spacing:.05em;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">
        ${source}
      </h3>
      <ul style="margin:0;padding-left:18px;font-size:14px;color:#374151;">
        ${items}
      </ul>
    </div>`;
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------
function buildEmail({ quotes, topEvent, bySource, gfexContracts, dateStr }) {
  const goodQuotes = quotes.filter(q => q.price !== null);
  const movers     = [...goodQuotes].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 3);

  // Top-event banner
  const topEventHtml = topEvent
    ? `
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 18px;
                border-radius:4px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;color:#b45309;text-transform:uppercase;
                  letter-spacing:.06em;margin-bottom:4px;">Biggest Overnight Event</div>
      <div style="font-size:15px;font-weight:600;color:#1c1917;line-height:1.4;">
        ${topEvent.text}
      </div>
      <div style="font-size:12px;color:#78716c;margin-top:4px;">
        Source: ${topEvent.source}
        ${topEvent.link ? `— <a href="${topEvent.link}" style="color:#92400e;">Read more</a>` : ''}
      </div>
    </div>`
    : '';

  // Top movers highlight bar
  const moversHtml = movers.length
    ? movers.map(q => `
        <div style="text-align:center;flex:1;min-width:80px;">
          <div style="font-size:11px;color:#6b7280;">${q.symbol}</div>
          <div style="font-size:13px;font-weight:700;color:${dirColor(q.direction)};">
            ${dirArrow(q.direction)} ${fmtPct(q.changePct)}
          </div>
          <div style="font-size:12px;color:#374151;">${fmt(q.price)}</div>
        </div>`).join('')
    : '';

  // Source sections
  const sourceHtml = Object.entries(bySource)
    .map(([src, items]) => headlineSection(src, items))
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Morning Lithium Briefing</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,
             'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
    <tr><td align="center">
      <table width="700" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;
                    box-shadow:0 1px 3px rgba(0,0,0,.1);max-width:700px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <div style="font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-.02em;">
              Morning Lithium Briefing
            </div>
            <div style="font-size:13px;color:#94a3b8;margin-top:4px;">${dateStr}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px;">

          ${topEventHtml}

          <!-- Top Movers -->
          ${movers.length ? `
          <div style="margin-bottom:28px;">
            <h2 style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;
                       letter-spacing:.06em;margin:0 0 12px;">Top Movers</h2>
            <div style="display:flex;gap:16px;background:#f8fafc;border-radius:6px;
                        padding:14px 16px;flex-wrap:wrap;">
              ${moversHtml}
            </div>
          </div>` : ''}

          <!-- Equity / FX Snapshot -->
          <div style="margin-bottom:32px;">
            <h2 style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;
                       letter-spacing:.06em;margin:0 0 12px;">Market Snapshot</h2>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="font-size:13px;border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc;font-size:11px;color:#6b7280;text-transform:uppercase;">
                  <th style="padding:8px 12px;text-align:left;">Symbol</th>
                  <th style="padding:8px 12px;text-align:left;">Name</th>
                  <th style="padding:8px 12px;text-align:right;">Price</th>
                  <th style="padding:8px 12px;text-align:right;">Chg %</th>
                  <th style="padding:8px 12px;text-align:right;">Chg</th>
                </tr>
              </thead>
              <tbody>${quoteRows(quotes)}</tbody>
            </table>
          </div>

          <!-- GFEX LC Futures Curve -->
          ${gfexTableHtml(gfexContracts)}

          <!-- News Headlines -->
          <div>
            <h2 style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;
                       letter-spacing:.06em;margin:0 0 16px;">Latest Headlines</h2>
            ${sourceHtml}
          </div>

        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e5e7eb;
                     padding:16px 32px;font-size:11px;color:#9ca3af;">
            Generated automatically · Equity data: Yahoo Finance · Futures: GFEX ·
            Prices may be delayed · Not financial advice
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Plain-text fallback
  const gfexText = gfexContracts && gfexContracts.length
    ? [
        '',
        'GFEX LC FUTURES (CNY/t)',
        '-'.repeat(70),
        'Contract  Prev.Settle  Open       High       Low        Settle     Chg',
        '-'.repeat(70),
        ...gfexContracts.map(c =>
          `${c.contract.padEnd(9)} ${String(c.prevSettle).padStart(11)} ${String(c.open).padStart(10)} ${String(c.high).padStart(10)} ${String(c.low).padStart(10)} ${String(c.settle).padStart(10)} ${String(c.change).padStart(6)}`
        ),
      ].join('\n')
    : '\nGFEX LC FUTURES: unavailable\n';

  const text = [
    `MORNING LITHIUM BRIEFING — ${dateStr}`,
    '='.repeat(60),
    '',
    topEvent ? `BIGGEST OVERNIGHT EVENT\n${topEvent.text}\n(${topEvent.source})\n` : '',
    'MARKET SNAPSHOT',
    '-'.repeat(60),
    ...quotes.map(q =>
      `${q.symbol.padEnd(10)} ${String(q.name).padEnd(22)} ${fmt(q.price).padStart(10)}  ${fmtPct(q.changePct).padStart(8)}`
    ),
    gfexText,
    '',
    'HEADLINES',
    '-'.repeat(60),
    ...Object.entries(bySource).flatMap(([src, items]) => [
      `\n[${src}]`,
      ...items.slice(0, 5).map(h => `  • ${h.text}`),
    ]),
  ].join('\n');

  return { html, text };
}

module.exports = { buildEmail };
