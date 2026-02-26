const cron = require('node-cron');
const blocks = require('../utils/blocks');
const tracking = require('../utils/tracking');
const db = require('../utils/db');

// Content banks
const hotTakes = require('../content/hot-takes.json');
const thisOrThat = require('../content/this-or-that.json');
const quizzes = require('../content/quizzes.json');
const polls = require('../content/polls.json');
const icebreakers = require('../content/icebreakers.json');
const memes = require('../content/memes.json');

/**
 * Pick the next unposted item from a content array.
 * Falls back to random if all have been posted (cycle reset).
 */
function pickNext(items, contentType) {
  const postedIds = db.getPostedContentIds(contentType);
  const unposted = items.filter(item => !postedIds.includes(item.id));

  if (unposted.length === 0) {
    // All content posted — pick random (content cycles)
    return items[Math.floor(Math.random() * items.length)];
  }

  return unposted[0];
}

/**
 * Post a message and track it in the DB.
 */
async function postToChannel(client, channel, blocksFn, contentItem, contentType) {
  try {
    const channelId = await resolveChannel(client, channel);
    if (!channelId) {
      console.error(`Channel #${channel} not found. Skipping scheduled post.`);
      return null;
    }

    const messageBlocks = blocksFn(contentItem);
    const result = await client.chat.postMessage({
      channel: channelId,
      blocks: messageBlocks,
      text: extractFallbackText(messageBlocks)
    });

    db.markContentPosted(contentItem.id, contentType, channel, result.ts);
    console.log(`[Scheduler] Posted ${contentType}: ${contentItem.id} to #${channel}`);

    return result;
  } catch (err) {
    console.error(`[Scheduler] Failed to post ${contentType}:`, err.message);
    return null;
  }
}

/**
 * Resolve a channel name to its ID.
 */
async function resolveChannel(client, channelName) {
  try {
    const result = await client.conversations.list({
      types: 'public_channel',
      limit: 1000
    });
    const channel = result.channels.find(c => c.name === channelName);
    return channel?.id || null;
  } catch (err) {
    console.error('Failed to resolve channel:', err.message);
    return null;
  }
}

/**
 * Extract plain text fallback from blocks.
 */
function extractFallbackText(messageBlocks) {
  for (const block of messageBlocks) {
    if (block.type === 'section' && block.text) {
      return block.text.text.replace(/[*_~`]/g, '').substring(0, 200);
    }
  }
  return 'New post from NimbusBot ☁️';
}

function startScheduler(app) {
  const client = app.client;
  const channel = process.env.DAILY_BUZZ_CHANNEL || 'daily-buzz';

  console.log('[Scheduler] Starting scheduled posts...');
  console.log(`[Scheduler] Target channel: #${channel}`);
  console.log(`[Scheduler] Timezone: ${process.env.TZ || 'Asia/Kolkata'}`);

  const tz = process.env.TZ || 'Asia/Kolkata';

  // ── Monday 9:30 AM — Icebreaker (odd weeks) or Meme (even weeks)
  cron.schedule('30 9 * * 1', async () => {
    const weekNum = getWeekNumber();
    if (weekNum % 2 === 1) {
      // Icebreaker
      const item = pickNext(icebreakers, 'icebreaker');
      await postToChannel(client, channel, blocks.icebreakerBlocks, item, 'icebreaker');
    } else {
      // Meme Monday
      const item = pickNext(memes, 'meme');
      await postToChannel(client, channel, blocks.memeBlocks, item, 'meme');
    }
  }, { timezone: tz });

  // ── Tuesday 9:30 AM — Hot Take
  cron.schedule('30 9 * * 2', async () => {
    const item = pickNext(hotTakes, 'hot-take');
    await postToChannel(client, channel, blocks.hotTakeBlocks, item, 'hot-take');
  }, { timezone: tz });

  // ── Wednesday 9:30 AM — This or That
  cron.schedule('30 9 * * 3', async () => {
    const item = pickNext(thisOrThat, 'this-or-that');
    await postToChannel(client, channel, blocks.thisOrThatBlocks, item, 'this-or-that');
  }, { timezone: tz });

  // ── Thursday 9:30 AM — Quiz (with answer reveal at 1:30 PM)
  cron.schedule('30 9 * * 4', async () => {
    const item = pickNext(quizzes, 'quiz');
    const result = await postToChannel(client, channel, blocks.quizBlocks, item, 'quiz');

    if (result) {
      // Schedule answer reveal in thread after configured delay
      const revealHours = parseInt(process.env.QUIZ_REVEAL_DELAY_HOURS) || 4;
      setTimeout(async () => {
        try {
          await client.chat.postMessage({
            channel: result.channel,
            thread_ts: result.ts,
            blocks: blocks.quizRevealBlocks(item),
            text: `Answer: ${item.options[item.answer]}`
          });
          console.log(`[Scheduler] Quiz answer revealed for: ${item.id}`);
        } catch (err) {
          console.error('[Scheduler] Failed to reveal quiz answer:', err.message);
        }
      }, revealHours * 60 * 60 * 1000);
    }
  }, { timezone: tz });

  // ── Friday 9:30 AM — Poll
  cron.schedule('30 9 * * 5', async () => {
    const item = pickNext(polls, 'poll');
    await postToChannel(client, channel, blocks.pollBlocks, item, 'poll');
  }, { timezone: tz });

  // ── Saturday 11:00 AM — Weekly Wrap
  cron.schedule('0 11 * * 6', async () => {
    try {
      const stats = tracking.getWeeklyStats();
      const channelId = await resolveChannel(client, channel);
      if (channelId) {
        await client.chat.postMessage({
          channel: channelId,
          blocks: blocks.weeklyWrapBlocks(stats),
          text: 'Weekly wrap-up from NimbusBot ☁️'
        });
        console.log('[Scheduler] Posted weekly wrap');
      }
    } catch (err) {
      console.error('[Scheduler] Failed to post weekly wrap:', err.message);
    }
  }, { timezone: tz });

  console.log('[Scheduler] All cron jobs registered.');
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  return Math.floor(diff / oneWeek);
}

module.exports = { startScheduler };
