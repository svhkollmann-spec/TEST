// ============================================================
//  MARKET BRIEFING — CONFIGURATION
//  Edit this file to control what gets scraped and who gets it
// ============================================================

module.exports = {
  // ----------------------------------------------------------
  // TICKERS
  // Yahoo Finance symbols.
  // ASX stocks: append ".AX" suffix (e.g. PLS.AX, LTR.AX)
  // ----------------------------------------------------------
  tickers: [
    { symbol: 'PLS.AX',  name: 'Pilbara Minerals'   },
    { symbol: 'LTR.AX',  name: 'Liontown Resources'  },
    // Market context benchmarks
    { symbol: 'GC=F',    name: 'Gold (Front Month)'  },
    { symbol: 'CL=F',    name: 'WTI Crude Oil'        },
    { symbol: 'DX=F',    name: 'US Dollar Index'      },
    { symbol: 'AUDUSD=X',name: 'AUD/USD'              },
  ],

  // ----------------------------------------------------------
  // TOPICS
  // Keywords used to score & surface the "biggest overnight event".
  // Headlines containing these terms rank higher.
  // ----------------------------------------------------------
  topics: [
    // Core lithium chemicals
    'Lithium Carbonate', 'Lithium Hydroxide', 'Spodumene',
    'lithium', 'Li2CO3', 'LiOH',
    // Market drivers
    'CATL', 'BYD', 'battery', 'EV', 'electric vehicle',
    'hard rock', 'brine', 'lepidolite',
    'Pilbara', 'Liontown', 'Greenbushes', 'Mt Holland',
    'China lithium', 'GFEX', 'LC futures',
    // Macro / sector
    'critical minerals', 'battery metals', 'mining',
    'OPEC', 'gold', 'AUD', 'US dollar',
  ],

  // ----------------------------------------------------------
  // CUSTOM NEWS SOURCES
  // Add any website you want headlines scraped from.
  // selector: CSS selector for individual headline links/text.
  // limit:    max headlines to pull per source.
  // ----------------------------------------------------------
  customSources: [
    {
      name:     'Reuters Markets',
      url:      'https://www.reuters.com/markets/',
      selector: 'a[data-testid="Heading"]',
      limit:    8,
    },
    {
      name:     'Benchmark Mineral Intelligence',
      url:      'https://www.benchmarkminerals.com/news/',
      selector: 'h2.entry-title a, h3.entry-title a',
      limit:    6,
    },
    {
      name:     'Mining.com',
      url:      'https://www.mining.com/category/lithium/',
      selector: 'h2.entry-title a, h3.entry-title a',
      limit:    8,
    },
    {
      name:     'FastMarkets Battery',
      url:      'https://www.fastmarkets.com/commodities/battery-raw-materials/',
      selector: 'a.article-card__link, h2 a, h3 a',
      limit:    6,
    },
    // Add your own:
    // {
    //   name:     'My Source',
    //   url:      'https://example.com/news',
    //   selector: 'h2 a',
    //   limit:    5,
    // },
  ],

  // ----------------------------------------------------------
  // GFEX LITHIUM CARBONATE FUTURES
  // Scraped via headless browser (Playwright/Chromium).
  // Contracts from front month (LC2604) through LC2703.
  // Run `npm run install-browsers` once before first use.
  // ----------------------------------------------------------
  gfex: {
    url:           'http://www.gfex.com.cn/en/LithiumCarbonate/LithiumCarbonate.shtml',
    // Regex to match contract codes we care about (LC2604–LC2703)
    contractRange: /^LC2(6(0[4-9]|1[0-2])|703?)$/,
    timeoutMs:     20000,
  },

  // ----------------------------------------------------------
  // EMAIL
  // ----------------------------------------------------------
  email: {
    recipients: ['team@yourcompany.com'],
    from:       'Market Briefing <briefing@yourcompany.com>',
    subjectTemplate: 'Morning Lithium Briefing – {date}',
    // Cron: 7 am, Monday–Friday (Sydney/AEST — adjust timezone below)
    scheduleTime: '0 7 * * 1-5',
    timezone:     'Australia/Sydney',
  },
};
