require('dotenv').config();

const { App } = require('@slack/bolt');
const { registerCommands } = require('./commands');
const { registerEvents } = require('./events');
const { startScheduler } = require('./scheduler');

// ─── Boot ──────────────────────────────────────────────
console.log(`
  ☁️  NimbusBot — CLOUDxAI Community Slack Bot
  ─────────────────────────────────────────────
  Conference: March 14, 2026 — Bengaluru, India
  https://cloudconf.ai
  ─────────────────────────────────────────────
`);

// ─── Validate env ──────────────────────────────────────
const required = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'SLACK_APP_TOKEN'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    console.error('Copy config.env.example to .env and fill in your Slack credentials.');
    process.exit(1);
  }
}

// ─── Initialize Slack Bolt ─────────────────────────────
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: parseInt(process.env.PORT) || 3000
});

// ─── Register features ─────────────────────────────────
registerCommands(app);
registerEvents(app);

// ─── Start ─────────────────────────────────────────────
(async () => {
  try {
    await app.start();
    console.log('⚡ NimbusBot is running!');
    console.log(`   Socket Mode: enabled`);
    console.log(`   Timezone: ${process.env.TZ || 'Asia/Kolkata'}`);
    console.log(`   Daily channel: #${process.env.DAILY_BUZZ_CHANNEL || 'daily-buzz'}`);
    console.log('');

    // Start scheduled daily posts
    startScheduler(app);

    console.log('✅ All systems nominal. That\'s a 200 OK. ☁️');
  } catch (err) {
    console.error('Failed to start NimbusBot:', err);
    process.exit(1);
  }
})();
