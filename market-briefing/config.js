// ============================================================
//  MARKET BRIEFING — CONFIGURATION
//  Edit this file to control what gets scraped and who gets it
// ============================================================

module.exports = {
  // ----------------------------------------------------------
  // TICKERS
  // Yahoo Finance symbols. Use =F suffix for futures.
  // ----------------------------------------------------------
  tickers: [
    { symbol: 'SPY',   name: 'S&P 500 ETF'     },
    { symbol: 'QQQ',   name: 'Nasdaq 100 ETF'   },
    { symbol: 'DIA',   name: 'Dow Jones ETF'     },
    { symbol: 'GC=F',  name: 'Gold (Front Month)'},
    { symbol: 'CL=F',  name: 'WTI Crude Oil'     },
    { symbol: 'BZ=F',  name: 'Brent Crude'       },
    { symbol: 'NG=F',  name: 'Natural Gas'       },
    { symbol: 'SI=F',  name: 'Silver'            },
    { symbol: 'HG=F',  name: 'Copper'            },
    { symbol: 'DX=F',  name: 'US Dollar Index'   },
  ],

  // ----------------------------------------------------------
  // TOPICS  (used to score & highlight the "biggest" event)
  // Headlines containing these keywords get a relevance boost
  // ----------------------------------------------------------
  topics: [
    'OPEC', 'oil', 'crude', 'gold', 'commodities', 'inflation',
    'Federal Reserve', 'Fed', 'interest rates', 'S&P 500',
    'earnings', 'recession', 'GDP', 'jobs report', 'CPI',
    'natural gas', 'energy', 'copper', 'dollar',
  ],

  // ----------------------------------------------------------
  // CUSTOM NEWS SOURCES
  // Add any website you want headlines scraped from.
  // selector: CSS selector that wraps individual headline links.
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
      name:     'MarketWatch',
      url:      'https://www.marketwatch.com/latest-news',
      selector: '.article__headline a',
      limit:    8,
    },
    {
      name:     'Financial Times Markets',
      url:      'https://www.ft.com/markets',
      selector: 'a.js-teaser-heading-link',
      limit:    6,
    },
    // Add your own sources here, for example:
    // {
    //   name:     'My Sector Blog',
    //   url:      'https://example.com/news',
    //   selector: 'h2.post-title a',
    //   limit:    5,
    // },
  ],

  // ----------------------------------------------------------
  // EMAIL
  // ----------------------------------------------------------
  email: {
    // Recipients — can be a single address or an array
    recipients: ['team@yourcompany.com'],

    from: 'Market Briefing <briefing@yourcompany.com>',

    subjectTemplate: 'Morning Market Briefing – {date}',

    // Cron schedule (default: 7 am, Monday–Friday)
    // See https://crontab.guru for syntax help
    scheduleTime: '0 7 * * 1-5',

    // SMTP credentials come from .env (see .env.example)
  },
};
