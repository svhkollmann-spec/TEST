/**
 * fetchSMM.js
 * Attempts to retrieve SMM (Shanghai Metals Market) lithium spot prices.
 *
 * Tries multiple accessible endpoints in order:
 *   1. metal.com Lithium page (HTML scrape)
 *   2. smm.cn price centre (HTML scrape)
 *   3. TradingEconomics lithium commodity page
 *
 * Returns an array of { label, price, unit, change, changeType } objects,
 * or [] if all sources fail (dashboard renders a fallback message).
 */

const axios   = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

// ---------------------------------------------------------------------------
// Attempt 1: metal.com/Lithium — looks for price rows in the page
// ---------------------------------------------------------------------------
async function tryMetalCom() {
  const url = 'https://www.metal.com/Lithium';
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 12000 });
  const $      = cheerio.load(data);
  const prices = [];

  // metal.com uses various table/price-card structures; try common selectors
  $('table tr, .price-item, [class*="price-row"], [class*="commodity-row"]').each((_, el) => {
    const cells = $(el).find('td, [class*="cell"], [class*="col"]');
    if (cells.length >= 2) {
      const label = cells.eq(0).text().trim();
      const price = cells.eq(1).text().trim();
      if (label && price && /\d/.test(price) && label.length < 80) {
        prices.push({ label, price, unit: '', change: '', changeType: 'flat' });
      }
    }
  });

  return prices.filter(p =>
    /lithium|carbonate|hydroxide|spodumene|lepidolite/i.test(p.label)
  );
}

// ---------------------------------------------------------------------------
// Attempt 2: smm.cn metal price page (English landing)
// ---------------------------------------------------------------------------
async function trySmmCn() {
  const url = 'https://www.smm.cn/marketdata/metal/lithium';
  const { data } = await axios.get(url, {
    headers: { ...HEADERS, Referer: 'https://www.smm.cn/' },
    timeout: 12000,
  });
  const $      = cheerio.load(data);
  const prices = [];

  $('tr, .price-item').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (/lithium|carbonate|hydroxide|spodumene/i.test(text) && /\d{4,}/.test(text)) {
      const cells = $(el).find('td');
      if (cells.length >= 2) {
        prices.push({
          label:      cells.eq(0).text().trim(),
          price:      cells.eq(1).text().trim(),
          unit:       cells.eq(2)?.text().trim() ?? 'CNY/t',
          change:     cells.eq(3)?.text().trim() ?? '',
          changeType: 'flat',
        });
      }
    }
  });

  return prices;
}

// ---------------------------------------------------------------------------
// Attempt 3: TradingEconomics lithium carbonate commodity
// ---------------------------------------------------------------------------
async function tryTradingEconomics() {
  const url = 'https://tradingeconomics.com/commodity/lithium';
  const { data } = await axios.get(url, {
    headers: { ...HEADERS, Referer: 'https://tradingeconomics.com/' },
    timeout: 12000,
  });
  const $ = cheerio.load(data);

  // TE shows price in a large number block
  const priceEl = $('[id*="p"], .te-price, #aspnetForm').first();
  const priceText = priceEl.text().match(/[\d,]+\.?\d*/)?.[0];

  if (priceText) {
    return [{
      label:      'Lithium Carbonate (TE index)',
      price:      priceText,
      unit:       'USD/t',
      change:     '',
      changeType: 'flat',
    }];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Main export — tries sources in sequence, returns first non-empty result
// ---------------------------------------------------------------------------
async function fetchSMMPrices() {
  const attempts = [
    { name: 'metal.com',         fn: tryMetalCom          },
    { name: 'smm.cn',            fn: trySmmCn             },
    { name: 'TradingEconomics',  fn: tryTradingEconomics  },
  ];

  for (const { name, fn } of attempts) {
    try {
      const prices = await fn();
      if (prices.length > 0) {
        console.log(`  [smm] Got ${prices.length} prices from ${name}`);
        return { prices, source: name };
      }
      console.log(`  [smm] ${name}: no matching price rows found`);
    } catch (err) {
      console.warn(`  [smm] ${name} failed: ${err.message}`);
    }
  }

  console.warn('  [smm] All price sources failed — dashboard will show fallback');
  return { prices: [], source: null };
}

module.exports = { fetchSMMPrices };
