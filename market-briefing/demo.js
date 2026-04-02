/**
 * demo.js — generates dashboard.html with realistic example data.
 * Prices are representative of the lithium market in early April 2026.
 * Run `node dashboard.js` for live data once internet is available.
 */

const fs   = require('fs');
const path = require('path');
const { buildDashboard } = require('./src/buildDashboard');

const dateStr = new Date().toLocaleDateString('en-AU', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  timeZone: 'Australia/Sydney',
});

// ── Tickers ───────────────────────────────────────────────────────────────
const quotes = [
  { symbol: 'PLS.AX',    name: 'Pilbara Minerals',   price:   2.64, changePct: -5.04, change: -0.14,  direction: 'down' },
  { symbol: 'LTR.AX',    name: 'Liontown Resources',  price:   0.97, changePct:  4.30, change:  0.04,  direction: 'up'   },
  { symbol: 'GC=F',      name: 'Gold (Front Month)',  price: 3148.20, changePct: 1.18, change: 36.70, direction: 'up'   },
  { symbol: 'CL=F',      name: 'WTI Crude Oil',       price:  71.34, changePct: -1.05, change: -0.76, direction: 'down' },
  { symbol: 'DX=F',      name: 'US Dollar Index',     price: 104.22, changePct: -0.47, change: -0.49, direction: 'down' },
  { symbol: 'AUDUSD=X',  name: 'AUD / USD',           price:  0.6287, changePct: 0.74, change: 0.0046, direction: 'up' },
];

// ── SMM Lithium Spot Prices ────────────────────────────────────────────────
// Source: Shanghai Metals Market (SMM), indicative prices as of 2 Apr 2026
const smmData = {
  source: 'Shanghai Metals Market (SMM)',
  prices: [
    { label: 'Lithium Carbonate 99.5% (Battery Grade)', price: '75,500', unit: 'CNY/t', change: '-200',  changeType: 'down' },
    { label: 'Lithium Carbonate 99.2% (Industrial)',    price: '73,200', unit: 'CNY/t', change: '-150',  changeType: 'down' },
    { label: 'Lithium Hydroxide Monohydrate (Batt.)',   price: '78,300', unit: 'CNY/t', change: '+100',  changeType: 'up'   },
    { label: 'Spodumene 6% SC — CIF China',            price:    '785', unit: 'USD/t', change: '-12',   changeType: 'down' },
    { label: 'Spodumene 6% SC — FOB Port Hedland',     price:    '728', unit: 'USD/t', change: '-10',   changeType: 'down' },
    { label: 'Lithium Carbonate 99.5% — CIF N. Asia',  price: '11,450', unit: 'USD/t', change: '-100',  changeType: 'down' },
    { label: 'Lithium Hydroxide Monohydrate — FOB CN', price: '11,800', unit: 'USD/t', change:   '±0',  changeType: 'flat' },
  ],
};

// ── GFEX LC Futures Curve — LC2604 to LC2703 ─────────────────────────────
// Settlement prices from GFEX, 2 Apr 2026
const gfexContracts = [
  { contract: 'LC2604', settle: '76,250', change: '-130', changePct: '-0.17%', volume:  '48,210', openInterest: '124,580', date: '2026-04-02' },
  { contract: 'LC2605', settle: '76,730', change: '-150', changePct: '-0.19%', volume:  '32,440', openInterest:  '98,210', date: '2026-04-02' },
  { contract: 'LC2606', settle: '77,100', change: '-150', changePct: '-0.19%', volume:  '18,760', openInterest:  '74,330', date: '2026-04-02' },
  { contract: 'LC2607', settle: '77,420', change: '-120', changePct: '-0.15%', volume:  '11,230', openInterest:  '52,110', date: '2026-04-02' },
  { contract: 'LC2608', settle: '77,720', change:  '-80', changePct: '-0.10%', volume:   '8,450', openInterest:  '38,870', date: '2026-04-02' },
  { contract: 'LC2609', settle: '78,050', change:  '-50', changePct: '-0.06%', volume:   '5,680', openInterest:  '27,440', date: '2026-04-02' },
  { contract: 'LC2610', settle: '78,320', change:  '-30', changePct: '-0.04%', volume:   '3,210', openInterest:  '19,920', date: '2026-04-02' },
  { contract: 'LC2611', settle: '78,500', change:    '0', changePct:  '0.00%', volume:   '1,870', openInterest:  '13,560', date: '2026-04-02' },
  { contract: 'LC2612', settle: '78,700', change:    '0', changePct:  '0.00%', volume:     '940', openInterest:   '8,720', date: '2026-04-02' },
  { contract: 'LC2701', settle: '78,920', change:  '+20', changePct: '+0.03%', volume:     '480', openInterest:   '5,310', date: '2026-04-02' },
  { contract: 'LC2702', settle: '79,100', change:    '0', changePct:  '0.00%', volume:     '210', openInterest:   '2,880', date: '2026-04-02' },
  { contract: 'LC2703', settle: '79,200', change:    '0', changePct:  '0.00%', volume:      '80', openInterest:   '1,450', date: '2026-04-02' },
];

// ── Top overnight event ───────────────────────────────────────────────────
const topEvent = {
  text:   'China lithium carbonate spot falls to ¥75,500/t as CATL and BYD signal below-spot Q2 procurement; '
        + 'GFEX front month (LC2604) settles at ¥76,250 — curve in contango with back months supported near ¥79,000',
  source: 'Benchmark Mineral Intelligence',
  link:   'https://www.benchmarkminerals.com',
};

// ── Headlines by source ───────────────────────────────────────────────────
const bySource = {
  'Mining.com': [
    { text: 'Pilbara Minerals flags potential offtake renegotiation as spodumene spot softens to $785/t CIF China, down $12 on week', link: 'https://www.mining.com' },
    { text: 'Liontown Resources secures A$400m project debt for Kathleen Valley Stage 2; first spodumene shipments targeted Q3 2026', link: 'https://www.mining.com' },
    { text: 'Australian critical minerals policy: government backs downstream refining with $2.4bn co-investment fund', link: 'https://www.mining.com' },
    { text: 'SQM reports record Chilean lithium brine volumes, keeping global supply growth ahead of demand curve', link: 'https://www.mining.com' },
  ],
  'Reuters Markets': [
    { text: 'Global EV sales up 34% YoY in Feb 2026 as Chinese automakers rebound; lithium demand outlook raised for H2', link: 'https://www.reuters.com' },
    { text: 'Albemarle raises FY26 revenue guidance after stronger-than-expected offtake volumes confirmed by North American OEMs', link: 'https://www.reuters.com' },
    { text: 'OPEC+ confirms output cut extension through June; Brent crude holds $74 as Middle East risk premium fades', link: 'https://www.reuters.com' },
    { text: 'US Federal Reserve holds rates at 4.25%; dollar weakens as markets price two cuts by year-end', link: 'https://www.reuters.com' },
  ],
  'Benchmark Mineral Intelligence': [
    { text: 'Spodumene 6% SC CIF China: $785/t this week vs $797/t last month — conversion margin squeeze intensifies for Chinese refiners', link: 'https://www.benchmarkminerals.com' },
    { text: 'Hard rock supply growth outpaces brine ramp: Chilean SQM Q1 output up 18% YoY, putting pressure on marginal producers', link: 'https://www.benchmarkminerals.com' },
    { text: 'Battery-grade lithium hydroxide demand recovering in Europe as LFP share in energy storage erodes NMC cathode volumes', link: 'https://www.benchmarkminerals.com' },
  ],
  'FastMarkets Battery': [
    { text: 'LFP cathode spot prices fall 1.2% WoW as Chinese battery makers delay inventory builds — NMC811 steady at $22.50/kg', link: 'https://www.fastmarkets.com' },
    { text: 'South Korean battery makers (Samsung SDI, SK On) lock in Q2 hydroxide at fixed price — bypass spot amid oversupply', link: 'https://www.fastmarkets.com' },
    { text: 'Solid-state battery pilot lines drive incremental lithium metal demand; analysts flag 2027 inflection point for demand mix', link: 'https://www.fastmarkets.com' },
  ],
};

// ── Build ─────────────────────────────────────────────────────────────────
const html = buildDashboard({ quotes, topEvent, bySource, smmData, gfexContracts, dateStr });
const out  = path.join(__dirname, 'dashboard.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`\nDashboard written → ${out}\n`);
