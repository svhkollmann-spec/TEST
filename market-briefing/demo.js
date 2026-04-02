/**
 * demo.js — generates dashboard.html with realistic mock data.
 * Use this to preview the layout; run `node dashboard.js` for live data.
 */

const fs   = require('fs');
const path = require('path');
const { buildDashboard } = require('./src/buildDashboard');

const dateStr = new Date().toLocaleDateString('en-AU', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  timeZone: 'Australia/Sydney',
});

// ── Mock ticker quotes ────────────────────────────────────────────────────
const quotes = [
  { symbol: 'PLS.AX',   name: 'Pilbara Minerals',  price: 2.64,  prevClose: 2.78,  change: -0.14, changePct: -5.04, direction: 'down' },
  { symbol: 'LTR.AX',   name: 'Liontown Resources', price: 0.97,  prevClose: 0.93,  change:  0.04, changePct:  4.30, direction: 'up'   },
  { symbol: 'GC=F',     name: 'Gold (Front Month)', price: 3148.20, prevClose: 3111.50, change: 36.70, changePct: 1.18, direction: 'up' },
  { symbol: 'CL=F',     name: 'WTI Crude Oil',      price: 71.34, prevClose: 72.10,  change: -0.76, changePct: -1.05, direction: 'down' },
  { symbol: 'DX=F',     name: 'US Dollar Index',    price: 104.22, prevClose: 104.71, change: -0.49, changePct: -0.47, direction: 'down' },
  { symbol: 'AUDUSD=X', name: 'AUD/USD',            price: 0.6287, prevClose: 0.6241, change: 0.0046, changePct: 0.74, direction: 'up' },
];

// ── Mock GFEX LC futures ──────────────────────────────────────────────────
const gfexContracts = [
  { contract: 'LC2604', prevSettle: '76,380', open: '76,040', high: '76,540', low: '75,920', settle: '76,250', change: '-130', changePct: '-0.17%', volume: '48,210', openInterest: '124,580', date: '2026-04-02' },
  { contract: 'LC2605', prevSettle: '76,880', open: '76,500', high: '77,050', low: '76,420', settle: '76,730', change: '-150', changePct: '-0.19%', volume: '32,440', openInterest: '98,210',  date: '2026-04-02' },
  { contract: 'LC2606', prevSettle: '77,250', open: '76,980', high: '77,400', low: '76,800', settle: '77,100', change: '-150', changePct: '-0.19%', volume: '18,760', openInterest: '74,330',  date: '2026-04-02' },
  { contract: 'LC2607', prevSettle: '77,540', open: '77,200', high: '77,700', low: '77,100', settle: '77,420', change: '-120', changePct: '-0.15%', volume: '11,230', openInterest: '52,110',  date: '2026-04-02' },
  { contract: 'LC2608', prevSettle: '77,800', open: '77,550', high: '78,000', low: '77,400', settle: '77,720', change: '-80',  changePct: '-0.10%', volume:  '8,450', openInterest: '38,870',  date: '2026-04-02' },
  { contract: 'LC2609', prevSettle: '78,100', open: '77,900', high: '78,250', low: '77,780', settle: '78,050', change: '-50',  changePct: '-0.06%', volume:  '5,680', openInterest: '27,440',  date: '2026-04-02' },
  { contract: 'LC2610', prevSettle: '78,350', open: '78,200', high: '78,500', low: '78,100', settle: '78,320', change: '-30',  changePct: '-0.04%', volume:  '3,210', openInterest: '19,920',  date: '2026-04-02' },
  { contract: 'LC2611', prevSettle: '78,500', open: '78,350', high: '78,650', low: '78,300', settle: '78,500', change:   '0',  changePct:  '0.00%', volume:  '1,870', openInterest: '13,560',  date: '2026-04-02' },
  { contract: 'LC2612', prevSettle: '78,700', open: '78,600', high: '78,850', low: '78,500', settle: '78,700', change:   '0',  changePct:  '0.00%', volume:    '940', openInterest:  '8,720',  date: '2026-04-02' },
  { contract: 'LC2701', prevSettle: '78,900', open: '78,800', high: '79,000', low: '78,750', settle: '78,920', change:  '+20', changePct: '+0.03%', volume:    '480', openInterest:  '5,310',  date: '2026-04-02' },
  { contract: 'LC2702', prevSettle: '79,100', open: '79,000', high: '79,200', low: '78,950', settle: '79,100', change:   '0',  changePct:  '0.00%', volume:    '210', openInterest:  '2,880',  date: '2026-04-02' },
  { contract: 'LC2703', prevSettle: '79,200', open: '79,150', high: '79,300', low: '79,100', settle: '79,200', change:   '0',  changePct:  '0.00%', volume:     '80', openInterest:  '1,450',  date: '2026-04-02' },
];

// ── Mock headlines ────────────────────────────────────────────────────────
const topEvent = {
  text:   'China lithium carbonate spot price falls 0.2% to ¥76,100/t as oversupply concerns persist despite improved EV demand data',
  source: 'Benchmark Mineral Intelligence',
  link:   'https://www.benchmarkminerals.com',
};

const bySource = {
  'Mining.com': [
    { text: 'Pilbara Minerals flags potential offtake renegotiation as spodumene spot softens to $780/t CIF China', link: '#' },
    { text: 'Liontown Resources secures A$400m project financing for Kathleen Valley Stage 2 expansion', link: '#' },
    { text: 'CATL signals Q2 battery-grade lithium carbonate procurement will remain below spot amid inventory drawdown', link: '#' },
    { text: 'Australian critical minerals strategy update: government backs new lithium processing facilities', link: '#' },
  ],
  'Reuters Markets': [
    { text: 'Global EV sales up 34% YoY in February as China rebounds; lithium demand outlook revised higher for H2 2026', link: '#' },
    { text: 'Albemarle raises FY26 lithium revenue guidance on stronger-than-expected offtake volumes from South America', link: '#' },
    { text: 'OPEC+ maintains output cuts through June; energy market volatility drives commodity fund inflows', link: '#' },
    { text: 'Fed holds rates steady; dollar softens as markets price in 2 cuts by year-end', link: '#' },
  ],
  'Benchmark Mineral Intelligence': [
    { text: 'Spodumene 6% SC CIF China: $778/t (-$12 WoW) — downstream conversion margins remain under pressure', link: '#' },
    { text: 'Lithium hydroxide monohydrate battery grade: $11,800/t FOB China, stable vs last week', link: '#' },
    { text: 'Hard rock vs brine cost curve shifts as Chilean SQM ramps; all-in sustaining costs diverge', link: '#' },
  ],
  'FastMarkets Battery': [
    { text: 'Battery-grade lithium carbonate CIF North Asia assessed at $11,450/t, down $100 on the week', link: '#' },
    { text: 'LFP cathode prices edge lower as lithium carbonate feedstock weakens; NMC remains supported', link: '#' },
    { text: 'South Korean battery makers lock in Q2 hydroxide volumes at fixed price, bypassing spot market', link: '#' },
  ],
};

// ── SMM data fallback (using GFEX since SMM is paywalled) ────────────────
const smmData = { prices: [], source: null };

// ── Build & save ──────────────────────────────────────────────────────────
const html = buildDashboard({
  quotes,
  topEvent,
  bySource,
  smmData,
  gfexContracts,
  dateStr,
});

const outPath = path.join(__dirname, 'dashboard.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`\nDemo dashboard written → ${outPath}\n`);
