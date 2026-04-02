/**
 * dashboard.js — generate today's lithium briefing dashboard
 *
 *   node dashboard.js          → fetches live data, writes dashboard.html
 *   node dashboard.js --fast   → skips GFEX (no Chromium needed)
 */

require('dotenv').config();

const fs                    = require('fs');
const path                  = require('path');
const config                = require('./config');
const { fetchAllQuotes }    = require('./src/fetchQuotes');
const { fetchAllHeadlines } = require('./src/fetchHeadlines');
const { fetchSMMPrices }    = require('./src/fetchSMM');
const { buildDashboard }    = require('./src/buildDashboard');

const FAST = process.argv.includes('--fast');

async function run() {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Australia/Sydney',
  });

  console.log(`\nLithium Dashboard — ${dateStr}`);
  console.log('─'.repeat(55));

  // Run quotes + headlines + SMM in parallel
  console.log('\n[1] Fetching quotes, headlines & SMM prices in parallel...');

  const configForHeadlines = FAST
    ? { ...config, gfex: null }  // skip Playwright in --fast mode
    : config;

  const [quotes, headlineData, smmData] = await Promise.all([
    fetchAllQuotes(config.tickers),
    fetchAllHeadlines(configForHeadlines),
    fetchSMMPrices(),
  ]);

  const { topEvent, bySource, gfexContracts } = headlineData;

  console.log('\n[2] Building dashboard HTML...');
  const html = buildDashboard({
    quotes,
    topEvent,
    bySource,
    smmData,
    gfexContracts: gfexContracts ?? [],
    dateStr,
  });

  const outPath = path.join(__dirname, 'dashboard.html');
  fs.writeFileSync(outPath, html, 'utf8');

  console.log(`\n✓ Dashboard written → ${outPath}`);
  console.log('  Open it in a browser to view.\n');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
