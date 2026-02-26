const blocks = require('../utils/blocks');
const tracking = require('../utils/tracking');

const KEYWORD_RESPONSES = {
  ticket: {
    pattern: /\b(ticket|register|registration|sign up|signup)\b/i,
    response: '🎟️ Grab your ticket here: <https://cloudconf.ai|cloudconf.ai> — Early bird might still be open!'
  },
  schedule: {
    pattern: /\b(schedule|agenda|timetable|sessions)\b/i,
    response: '📋 Check the full schedule and sessions at <https://cloudconf.ai|cloudconf.ai>'
  },
  when: {
    pattern: /when\s+(is|the)\s+(the\s+)?(conference|event|cloudxai)/i,
    response: '📅 March 14, 2026 — NIMHANS Convention Centre, Bengaluru. Doors open at 8:50 AM ☁️'
  },
  where: {
    pattern: /where\s+(is|the)\s+(the\s+)?(conference|event|cloudxai|venue)/i,
    response: '📍 NIMHANS Convention Centre, Bengaluru, India. March 14, 2026. See you there! ☁️'
  }
};

function registerEvents(app) {
  // Welcome message for new team members
  app.event('team_join', async ({ event, client }) => {
    try {
      await client.chat.postMessage({
        channel: event.user.id,
        blocks: blocks.welcomeBlocks(),
        text: 'Welcome to the CLOUDxAI community! 🚀'
      });
      console.log(`Sent welcome DM to ${event.user.id}`);
    } catch (err) {
      console.error('Failed to send welcome DM:', err.message);
    }
  });

  // Keyword auto-responses (thread replies only, specific channels only)
  app.event('message', async ({ event, client, say }) => {
    // Ignore bot messages, message edits, thread replies
    if (event.bot_id || event.subtype || event.thread_ts) return;

    // Only respond in configured channels
    const keywordChannels = (process.env.KEYWORD_CHANNELS || '').split(',').map(c => c.trim());
    let channelName;
    try {
      const info = await client.conversations.info({ channel: event.channel });
      channelName = info.channel.name;
    } catch {
      return; // Can't determine channel, skip
    }

    if (!keywordChannels.includes(channelName)) return;

    const text = event.text || '';

    // Check each keyword pattern — only trigger the first match
    for (const [key, config] of Object.entries(KEYWORD_RESPONSES)) {
      if (config.pattern.test(text)) {
        try {
          await client.chat.postMessage({
            channel: event.channel,
            thread_ts: event.ts, // Reply in thread, not channel
            text: config.response
          });
        } catch (err) {
          console.error(`Failed to send keyword response (${key}):`, err.message);
        }
        break; // Only one response per message
      }
    }

    // Track engagement
    if (event.user) {
      tracking.trackMessage(event.user);
    }
  });

  // Track emoji reactions for engagement
  app.event('reaction_added', async ({ event }) => {
    if (event.user) {
      tracking.trackReaction(event.user, event.item?.ts);
    }
  });
}

module.exports = { registerEvents };
