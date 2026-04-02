/**
 * fetchQuotes.js
 * Fetches latest price + overnight change for each ticker via
 * the Yahoo Finance chart API (no API key required).
 */

const axios = require('axios');

const BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

/**
 * Fetch quote data for a single symbol.
 * Returns { symbol, name, price, prevClose, change, changePct, direction }
 */
async function fetchQuote({ symbol, name }) {
  try {
    const url = `${BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 10000 });

    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No chart result');

    const meta      = result.meta;
    const price     = meta.regularMarketPrice ?? meta.previousClose;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose;
    const change    = price - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;

    return {
      symbol,
      name,
      price:     round(price, 2),
      prevClose: round(prevClose, 2),
      change:    round(change, 2),
      changePct: round(changePct, 2),
      direction: change >= 0 ? 'up' : 'down',
      currency:  meta.currency ?? 'USD',
    };
  } catch (err) {
    console.warn(`  [quotes] Failed to fetch ${symbol}: ${err.message}`);
    return { symbol, name, price: null, change: null, changePct: null, direction: 'flat' };
  }
}

/**
 * Fetch all tickers with a small delay between requests to avoid rate-limiting.
 */
async function fetchAllQuotes(tickers) {
  const results = [];
  for (const ticker of tickers) {
    const quote = await fetchQuote(ticker);
    results.push(quote);
    await sleep(300); // 300 ms between requests
  }
  return results;
}

function round(n, dp) {
  return Math.round(n * 10 ** dp) / 10 ** dp;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { fetchAllQuotes };
