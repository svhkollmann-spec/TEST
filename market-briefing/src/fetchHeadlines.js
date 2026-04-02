/**
 * fetchHeadlines.js
 * 1. Scrapes custom news sources (config.customSources) using cheerio.
 * 2. Pulls Yahoo Finance RSS headlines for each ticker.
 * 3. Scores every headline against config.topics and surfaces the
 *    single "biggest overnight event".
 */

const axios   = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// ---------------------------------------------------------------------------
// Scrape a single custom source
// ---------------------------------------------------------------------------
async function scrapeSource({ name, url, selector, limit = 8 }) {
  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 12000 });
    const $         = cheerio.load(data);
    const headlines = [];

    $(selector).each((i, el) => {
      if (headlines.length >= limit) return false;
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      const href = $(el).attr('href') ?? '';
      const link = href.startsWith('http') ? href : new URL(href, url).href;
      if (text.length > 10) headlines.push({ text, link, source: name });
    });

    console.log(`  [headlines] ${name}: ${headlines.length} headlines`);
    return headlines;
  } catch (err) {
    console.warn(`  [headlines] Failed to scrape ${name}: ${err.message}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Yahoo Finance RSS for a ticker
// ---------------------------------------------------------------------------
async function fetchYahooRSS(symbol, limit = 5) {
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
  try {
    const { data } = await axios.get(url, {
      headers: { ...HEADERS, Accept: 'application/rss+xml, application/xml' },
      timeout: 10000,
    });

    const $         = cheerio.load(data, { xmlMode: true });
    const headlines = [];

    $('item').each((i, el) => {
      if (headlines.length >= limit) return false;
      const text = $('title', el).text().trim();
      const link = $('link', el).text().trim() || $('guid', el).text().trim();
      if (text && text.length > 10) headlines.push({ text, link, source: `Yahoo Finance (${symbol})` });
    });

    return headlines;
  } catch (err) {
    console.warn(`  [rss] Failed ${symbol}: ${err.message}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Score a headline against topic keywords (higher = more relevant)
// ---------------------------------------------------------------------------
function scoreHeadline(text, topics) {
  const lower = text.toLowerCase();
  return topics.reduce((score, topic) => {
    return lower.includes(topic.toLowerCase()) ? score + 1 : score;
  }, 0);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
async function fetchAllHeadlines(config) {
  const { customSources, tickers, topics } = config;
  let all = [];

  // 1. Custom sources
  for (const source of customSources) {
    const items = await scrapeSource(source);
    all = all.concat(items);
    await sleep(500);
  }

  // 2. Yahoo Finance RSS (first 5 tickers to avoid hammering)
  const rssSymbols = tickers.slice(0, 5).map(t => t.symbol);
  for (const symbol of rssSymbols) {
    const items = await fetchYahooRSS(symbol, 5);
    all = all.concat(items);
    await sleep(300);
  }

  // Deduplicate by headline text
  const seen = new Set();
  const deduped = all.filter(h => {
    const key = h.text.slice(0, 80).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Score & sort
  const scored = deduped.map(h => ({ ...h, score: scoreHeadline(h.text, topics) }));
  scored.sort((a, b) => b.score - a.score);

  // Biggest overnight event = highest-scored headline
  const topEvent = scored[0] ?? null;

  // Group remaining by source for the full digest
  const bySource = {};
  for (const h of scored) {
    if (!bySource[h.source]) bySource[h.source] = [];
    bySource[h.source].push(h);
  }

  console.log(`  [headlines] Total unique: ${deduped.length}`);
  return { topEvent, bySource, all: scored };
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { fetchAllHeadlines };
