/**
 * scheduler.js — keeps running and fires the briefing on cron schedule
 *
 *   node scheduler.js
 *
 * Keep this process alive (e.g. via PM2, systemd, or a cloud runner).
 * The schedule is defined in config.js → email.scheduleTime
 */

require('dotenv').config();

const cron   = require('node-cron');
const config = require('./config');

// Lazy-require the run function so we reuse the same logic as index.js
const { execSync } = require('child_process');
const path         = require('path');

const schedule = config.email.scheduleTime;

console.log(`Scheduler started. Briefing will run on schedule: "${schedule}"`);
console.log('(Press Ctrl+C to stop)\n');

cron.schedule(schedule, async () => {
  console.log(`\n[${new Date().toISOString()}] Running scheduled briefing...`);
  try {
    // Spawn a fresh process each run so memory is clean
    execSync(`node ${path.join(__dirname, 'index.js')}`, { stdio: 'inherit' });
  } catch (err) {
    console.error('Scheduled run failed:', err.message);
  }
}, {
  timezone: 'America/New_York',
});
