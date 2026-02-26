const cron = require('node-cron');
const blocks = require('../utils/blocks');
const tracking = require('../utils/tracking');
const db = require('../utils/db');
const fetcher = require('../utils/fetcher');

// Static content banks
const hotTakes = require('../content/hot-takes.json');
const thisOrThat = require('../content/this-or-that.json');
const quizzes = require('../content/quizzes.json');
const polls = require('../content/polls.json');
const icebreakers = require('../content/icebreakers.json');
const memes = require('../content/memes.json');
const announcements = require('../content/announcements.json');

/**
 * Pick the next unposted item. Cycles when exhausted.
 */
function pickNext(items, contentType) {
  const postedIds = db.getPostedContentIds(contentType);
  const unposted = items.filter(item => !postedIds.includes(item.id));
  if (unposted.length === 0) {
    return items[Math.floor(Math.random() * items.length)];
  }
  return unposted[0];
}

/**
 * Post pre-built blocks to channel and track in DB.
 */
async function postBlocks(client, channel, messageBlocks, contentId, contentType) {
  try {
    const channelId = await resolveChannel(client, channel);
    if (!channelId) {
      console.error(`[Scheduler] Channel #${channel} not found.`);
      return null;
    }

    const result = await client.chat.postMessage({
      channel: channelId,
      blocks: messageBlocks,
      text: extractFallbackText(messageBlocks)
    });

    if (contentId) {
      db.markContentPosted(contentId, contentType, channel, result.ts);
    }
    console.log(`[Scheduler] Posted ${contentType}: ${contentId || 'dynamic'} → #${channel}`);
    return result;
  } catch (err) {
    console.error(`[Scheduler] Failed to post ${contentType}:`, err.message);
    return null;
  }
}

// Channel ID cache
const channelIdCache = {};

async function resolveChannel(client, channelName) {
  if (channelIdCache[channelName]) return channelIdCache[channelName];
  try {
    const result = await client.conversations.list({ types: 'public_channel', limit: 1000 });
    const ch = result.channels.find(c => c.name === channelName);
    if (ch) channelIdCache[channelName] = ch.id;
    return ch?.id || null;
  } catch (err) {
    console.error('[Scheduler] Resolve channel failed:', err.message);
    return null;
  }
}

function extractFallbackText(messageBlocks) {
  for (const block of messageBlocks) {
    if (block.type === 'section' && block.text) {
      return block.text.text.replace(/[*_~`]/g, '').substring(0, 200);
    }
  }
  return 'New post from PennyworthBot';
}

// ═══════════════════════════════════════════════════════════
// HYPER-ACTIVE DAILY SCHEDULE (4-5 posts/day Mon-Sat)
//
//   09:00  Morning Engagement (rotates: hot take, quiz, poll, etc.)
//   11:30  Speaker Spotlight (live from GitHub)
//   14:30  Talk Teaser / LinkedIn Announcement (alternates)
//   17:00  Partner Shoutout / Countdown Hype (alternates)
//   19:00  Evening Engagement (second community post)
//   Sat 11:00  Weekly Wrap
// ═══════════════════════════════════════════════════════════

function startScheduler(app) {
  const client = app.client;
  const channel = process.env.DAILY_BUZZ_CHANNEL || 'daily-buzz';
  const tz = process.env.TZ || 'Asia/Kolkata';

  console.log('[Scheduler] Starting hyper-active schedule...');
  console.log(`[Scheduler] Target: #${channel} | TZ: ${tz}`);

  // ── SLOT 1: 9:00 AM — Morning Engagement ─────────────

  cron.schedule('0 9 * * 1', async () => {
    const weekNum = getWeekNumber();
    if (weekNum % 2 === 1) {
      const item = pickNext(icebreakers, 'icebreaker');
      await postBlocks(client, channel, blocks.icebreakerBlocks(item), item.id, 'icebreaker');
    } else {
      const item = pickNext(memes, 'meme');
      await postBlocks(client, channel, blocks.memeBlocks(item), item.id, 'meme');
    }
  }, { timezone: tz });

  cron.schedule('0 9 * * 2', async () => {
    const item = pickNext(hotTakes, 'hot-take');
    await postBlocks(client, channel, blocks.hotTakeBlocks(item), item.id, 'hot-take');
  }, { timezone: tz });

  cron.schedule('0 9 * * 3', async () => {
    const item = pickNext(thisOrThat, 'this-or-that');
    await postBlocks(client, channel, blocks.thisOrThatBlocks(item), item.id, 'this-or-that');
  }, { timezone: tz });

  cron.schedule('0 9 * * 4', async () => {
    const item = pickNext(quizzes, 'quiz');
    const result = await postBlocks(client, channel, blocks.quizBlocks(item), item.id, 'quiz');
    if (result) {
      const revealMs = (parseInt(process.env.QUIZ_REVEAL_DELAY_HOURS) || 4) * 3600000;
      setTimeout(async () => {
        try {
          await client.chat.postMessage({
            channel: result.channel, thread_ts: result.ts,
            blocks: blocks.quizRevealBlocks(item),
            text: `Answer: ${item.options[item.answer]}`
          });
          console.log(`[Scheduler] Quiz answer revealed: ${item.id}`);
        } catch (err) { console.error('[Scheduler] Quiz reveal failed:', err.message); }
      }, revealMs);
    }
  }, { timezone: tz });

  cron.schedule('0 9 * * 5', async () => {
    const item = pickNext(polls, 'poll');
    await postBlocks(client, channel, blocks.pollBlocks(item), item.id, 'poll');
  }, { timezone: tz });

  cron.schedule('0 9 * * 6', async () => {
    // Saturday morning: LinkedIn announcement
    const item = pickNext(announcements, 'announcement-sat');
    await postBlocks(client, channel, blocks.linkedInAnnouncementBlocks(item), item.id, 'announcement-sat');
  }, { timezone: tz });

  // ── SLOT 2: 11:30 AM — Speaker Spotlight (daily) ─────

  cron.schedule('30 11 * * 1-6', async () => {
    try {
      const speaker = await fetcher.getRandomSpeaker();
      if (speaker) {
        await postBlocks(client, channel, blocks.speakerSpotlightBlocks(speaker), `spk-${speaker.id}`, 'speaker-spotlight');
      }
    } catch (err) { console.error('[Scheduler] Speaker spotlight failed:', err.message); }
  }, { timezone: tz });

  // ── SLOT 3: 2:30 PM — Talk Teaser / Announcement ─────

  cron.schedule('30 14 * * 1-6', async () => {
    const day = new Date().getDate();

    if (day % 2 === 1) {
      // Talk Teaser
      try {
        const talk = await fetcher.getRandomTalk();
        if (talk) {
          const speakerMap = await fetcher.getSpeakerMap();
          const firstName = talk.speaker?.split(', ')[0];
          const speakerData = Object.values(speakerMap).find(s => s.name === firstName) || null;
          await postBlocks(client, channel, blocks.talkTeaserBlocks(talk, speakerData), `talk-${day}`, 'talk-teaser');
        }
      } catch (err) { console.error('[Scheduler] Talk teaser failed:', err.message); }
    } else {
      // LinkedIn Announcement
      const item = pickNext(announcements, 'announcement');
      await postBlocks(client, channel, blocks.linkedInAnnouncementBlocks(item), item.id, 'announcement');
    }
  }, { timezone: tz });

  // ── SLOT 4: 5:00 PM — Partners / Countdown ───────────

  cron.schedule('0 17 * * 1,3,5', async () => {
    // Mon/Wed/Fri: Partner Shoutout
    try {
      const partners = await fetcher.getRandomPartners(3);
      if (partners.length > 0) {
        await postBlocks(client, channel, blocks.partnerShoutoutBlocks(partners), `partners-${Date.now()}`, 'partner-shoutout');
      }
    } catch (err) { console.error('[Scheduler] Partner shoutout failed:', err.message); }
  }, { timezone: tz });

  cron.schedule('0 17 * * 2,4,6', async () => {
    // Tue/Thu/Sat: Countdown Hype
    const confDate = process.env.CONFERENCE_DATE || '2026-03-14T08:50:00+05:30';
    await postBlocks(client, channel, blocks.countdownHypeBlocks(confDate), `cd-${Date.now()}`, 'countdown-hype');
  }, { timezone: tz });

  // ── SLOT 5: 7:00 PM — Evening Engagement ─────────────

  cron.schedule('0 19 * * 1', async () => {
    // Monday evening: Bonus quiz
    const item = pickNext(quizzes, 'quiz-eve');
    const result = await postBlocks(client, channel, blocks.quizBlocks(item), `eve-${item.id}`, 'quiz-eve');
    if (result) {
      setTimeout(async () => {
        try {
          await client.chat.postMessage({
            channel: result.channel, thread_ts: result.ts,
            blocks: blocks.quizRevealBlocks(item),
            text: `Answer: ${item.options[item.answer]}`
          });
        } catch (err) { console.error('[Scheduler] Eve quiz reveal failed:', err.message); }
      }, 2 * 3600000);
    }
  }, { timezone: tz });

  cron.schedule('0 19 * * 2', async () => {
    const item = pickNext(polls, 'poll-eve');
    await postBlocks(client, channel, blocks.pollBlocks(item), `eve-${item.id}`, 'poll-eve');
  }, { timezone: tz });

  cron.schedule('0 19 * * 3', async () => {
    const item = pickNext(hotTakes, 'hot-take-eve');
    await postBlocks(client, channel, blocks.hotTakeBlocks(item), `eve-${item.id}`, 'hot-take-eve');
  }, { timezone: tz });

  cron.schedule('0 19 * * 4', async () => {
    const item = pickNext(thisOrThat, 'tot-eve');
    await postBlocks(client, channel, blocks.thisOrThatBlocks(item), `eve-${item.id}`, 'tot-eve');
  }, { timezone: tz });

  cron.schedule('0 19 * * 5', async () => {
    const item = pickNext(icebreakers, 'icebreaker-eve');
    await postBlocks(client, channel, blocks.icebreakerBlocks(item), `eve-${item.id}`, 'icebreaker-eve');
  }, { timezone: tz });

  cron.schedule('0 19 * * 6', async () => {
    const item = pickNext(memes, 'meme-eve');
    await postBlocks(client, channel, blocks.memeBlocks(item), `eve-${item.id}`, 'meme-eve');
  }, { timezone: tz });

  // ── Weekly Wrap: Saturday 11:00 AM ────────────────────

  cron.schedule('0 11 * * 6', async () => {
    try {
      const stats = tracking.getWeeklyStats();
      const channelId = await resolveChannel(client, channel);
      if (channelId) {
        await client.chat.postMessage({
          channel: channelId,
          blocks: blocks.weeklyWrapBlocks(stats),
          text: 'Weekly wrap-up from PennyworthBot'
        });
        console.log('[Scheduler] Posted weekly wrap');
      }
    } catch (err) { console.error('[Scheduler] Weekly wrap failed:', err.message); }
  }, { timezone: tz });

  console.log('[Scheduler] Hyper-active schedule registered:');
  console.log('  09:00  Morning engagement (hot take/quiz/poll/icebreaker/meme)');
  console.log('  11:30  Speaker Spotlight (live from GitHub)');
  console.log('  14:30  Talk Teaser / LinkedIn Announcement');
  console.log('  17:00  Partner Shoutout / Countdown Hype');
  console.log('  19:00  Evening engagement (second community post)');
  console.log('  Sat    Weekly Wrap + LinkedIn Announcement');
  console.log(`  Total: ~5 posts/day, 30/week`);
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now - start) / 604800000);
}

module.exports = { startScheduler };
