/**
 * fetchGFEX.js
 * Scrapes the GFEX Lithium Carbonate futures table using a headless
 * Chromium browser (Playwright).  Plain HTTP requests return 403.
 *
 * Prerequisites (one-time setup):
 *   npm run install-browsers   →   playwright install chromium
 *
 * Returns an array of contract objects:
 *   [{ contract, prevSettle, open, high, low, settle, change, changePct,
 *      volume, openInterest, date }, ...]
 *
 * If scraping fails the function returns [] so the rest of the email
 * still sends cleanly.
 */

const { chromium } = require('playwright');

// Contract codes we want: LC2604 … LC2703
// Generated dynamically so the range stays correct regardless of month.
function buildContractRange() {
  const contracts = [];
  // 2026: months 4–12
  for (let m = 4; m <= 12; m++) {
    contracts.push(`LC26${String(m).padStart(2, '0')}`);
  }
  // 2027: months 1–3
  for (let m = 1; m <= 3; m++) {
    contracts.push(`LC27${String(m).padStart(2, '0')}`);
  }
  return new Set(contracts);
}

async function fetchGFEXTable(gfexConfig) {
  const { url, timeoutMs = 20000 } = gfexConfig;
  const wantedContracts = buildContractRange();

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'Asia/Shanghai',
      viewport: { width: 1280, height: 900 },
    });

    const page = await context.newPage();

    // Suppress images/fonts to speed up load
    await page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf}', r => r.abort());

    console.log('  [gfex] Navigating to GFEX...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs });

    // Wait for the data table to appear — it's rendered by JS
    // GFEX uses a table with contract codes like "LC2604" in the first column
    await page.waitForSelector('table', { timeout: timeoutMs });

    // Give JS a moment to populate all rows
    await page.waitForTimeout(2000);

    // Extract all table rows
    const rows = await page.evaluate(() => {
      const results = [];
      const tables  = document.querySelectorAll('table');

      for (const table of tables) {
        const trs = table.querySelectorAll('tr');
        for (const tr of trs) {
          const cells = Array.from(tr.querySelectorAll('td, th')).map(c =>
            c.innerText?.trim().replace(/\s+/g, ' ') ?? ''
          );
          if (cells.length >= 6) results.push(cells);
        }
      }
      return results;
    });

    // Filter to only the LC contract rows we want
    const contracts = [];
    for (const cells of rows) {
      // First cell should be the contract code (e.g. "LC2604")
      const code = cells[0].replace(/\s/g, '').toUpperCase();
      if (!wantedContracts.has(code)) continue;

      // GFEX English page column order (typical):
      // [0] Contract  [1] Prev.Settle  [2] Open  [3] High  [4] Low
      // [5] Settle    [6] Change       [7] Chg%  [8] Volume [9] Open Interest [10] Date
      // Column count can vary — store by index defensively
      contracts.push({
        contract:     code,
        prevSettle:   cells[1]  ?? '—',
        open:         cells[2]  ?? '—',
        high:         cells[3]  ?? '—',
        low:          cells[4]  ?? '—',
        settle:       cells[5]  ?? '—',
        change:       cells[6]  ?? '—',
        changePct:    cells[7]  ?? '—',
        volume:       cells[8]  ?? '—',
        openInterest: cells[9]  ?? '—',
        date:         cells[10] ?? '—',
      });
    }

    // Sort by contract code chronologically
    contracts.sort((a, b) => a.contract.localeCompare(b.contract));

    console.log(`  [gfex] Scraped ${contracts.length} LC contracts`);
    return contracts;

  } catch (err) {
    console.warn(`  [gfex] Failed: ${err.message}`);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { fetchGFEXTable };
