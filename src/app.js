require('dotenv').config();

const http = require('http');
const { App } = require('@slack/bolt');
const { registerCommands } = require('./commands');
const { registerEvents } = require('./events');
const { startScheduler } = require('./scheduler');

// ─── Boot ──────────────────────────────────────────────
console.log(`
  ☁️  PennyworthBot — CLOUDxAI Community Slack Bot
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

// ─── Health check server for Cloud Run ─────────────────
const PORT = parseInt(process.env.PORT) || 8080;
let healthy = false;

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    if (healthy) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', bot: 'PennyworthBot', uptime: process.uptime() }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'starting' }));
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(PORT, () => {
  console.log(`[Health] Listening on port ${PORT}`);
});

// ─── Initialize Slack Bolt (Socket Mode) ───────────────
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// ─── Register features ─────────────────────────────────
registerCommands(app);
registerEvents(app);

// ─── Start ─────────────────────────────────────────────
(async () => {
  try {
    await app.start();
    healthy = true;

    console.log('⚡ PennyworthBot is running!');
    console.log(`   Socket Mode: enabled`);
    console.log(`   Health check: port ${PORT}`);
    console.log(`   Timezone: ${process.env.TZ || 'Asia/Kolkata'}`);
    console.log(`   Daily channel: #${process.env.DAILY_BUZZ_CHANNEL || 'daily-buzz'}`);
    console.log('');

    // Start scheduled daily posts
    startScheduler(app);

    console.log('✅ All systems nominal. That\'s a 200 OK. ☁️');
  } catch (err) {
    console.error('Failed to start PennyworthBot:', err);
    process.exit(1);
  }
})();

// ─── Graceful shutdown ─────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('[Shutdown] SIGTERM received. Shutting down gracefully...');
  healthy = false;
  healthServer.close();
  await app.stop();
  process.exit(0);
});
