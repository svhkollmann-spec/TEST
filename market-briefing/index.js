/**
 * index.js — run the briefing once immediately
 *
 *   node index.js           → fetch data, send email, write preview.html
 *   node index.js --preview → only write preview.html, no email sent
 */

require('dotenv').config();

const config              = require('./config');
const { fetchAllQuotes }  = require('./src/fetchQuotes');
const { fetchAllHeadlines } = require('./src/fetchHeadlines');
const { buildEmail }      = require('./src/buildEmail');
const { sendBriefing }    = require('./src/mailer');
const fs                  = require('fs');
const path                = require('path');

const PREVIEW_ONLY = process.argv.includes('--preview');

async function run() {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  console.log(`\nMarket Briefing — ${dateStr}`);
  console.log('─'.repeat(50));

  // 1. Fetch quotes
  console.log('\n[1/3] Fetching market quotes...');
  const quotes = await fetchAllQuotes(config.tickers);

  // 2. Fetch headlines
  console.log('\n[2/3] Fetching headlines...');
  const { topEvent, bySource } = await fetchAllHeadlines(config);

  // 3. Build email
  console.log('\n[3/3] Building email...');
  const { html, text } = buildEmail({ quotes, topEvent, bySource, dateStr });

  // Always write a local preview
  const previewPath = path.join(__dirname, 'preview.html');
  fs.writeFileSync(previewPath, html, 'utf8');
  console.log(`\n  Preview saved → ${previewPath}`);

  if (PREVIEW_ONLY) {
    console.log('  --preview flag set, skipping email send.\n');
    return;
  }

  // 4. Send email
  const subject = config.email.subjectTemplate.replace('{date}', dateStr);
  try {
    await sendBriefing({
      from:    config.email.from,
      to:      config.email.recipients,
      subject,
      html,
      text,
    });
    console.log('  Email sent successfully.\n');
  } catch (err) {
    console.error(`\n  Email send failed: ${err.message}`);
    console.error('  (Preview HTML was still saved locally.)\n');
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
