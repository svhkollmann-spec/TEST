/**
 * mailer.js
 * Thin wrapper around nodemailer.
 * Reads SMTP credentials from environment variables (set in .env).
 */

const nodemailer = require('nodemailer');

function createTransport() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing  = required.filter(k => !process.env[k]);

  if (missing.length) {
    throw new Error(
      `Missing required env vars: ${missing.join(', ')}\n` +
      'Copy .env.example to .env and fill in your SMTP credentials.'
    );
  }

  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',  // true = TLS on port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send the briefing email.
 * @param {object} opts
 * @param {string}          opts.from       Sender address
 * @param {string|string[]} opts.to         Recipient(s)
 * @param {string}          opts.subject    Email subject
 * @param {string}          opts.html       HTML body
 * @param {string}          opts.text       Plain-text fallback
 */
async function sendBriefing({ from, to, subject, html, text }) {
  const transport = createTransport();

  const info = await transport.sendMail({
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text,
  });

  console.log(`  [mailer] Message sent: ${info.messageId}`);
  return info;
}

module.exports = { sendBriefing };
