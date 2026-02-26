const blocks = require('../utils/blocks');
const fetcher = require('../utils/fetcher');

const quizzes = require('../content/quizzes.json');

function registerCommands(app) {
  // /cloudxai-schedule — Conference schedule (live from GitHub)
  app.command('/cloudxai-schedule', async ({ command, ack, respond }) => {
    await ack();
    try {
      const schedule = await fetcher.getLiveSchedule();
      await respond({
        blocks: blocks.scheduleBlocks(schedule),
        response_type: 'ephemeral'
      });
    } catch (err) {
      console.error('Schedule command error:', err.message);
      await respond({
        text: `Failed to fetch schedule. Check <https://cloudconf.ai|cloudconf.ai> for the latest.`,
        response_type: 'ephemeral'
      });
    }
  });

  // /cloudxai-speakers — Live speakers list from GitHub
  app.command('/cloudxai-speakers', async ({ command, ack, respond }) => {
    await ack();
    try {
      const speakers = await fetcher.getLiveSpeakers();
      const url = process.env.CONFERENCE_URL || 'https://cloudconf.ai';
      await respond({
        blocks: blocks.speakerBlocks(speakers, url),
        response_type: 'ephemeral'
      });
    } catch (err) {
      console.error('Speakers command error:', err.message);
      await respond({
        text: `Failed to fetch speakers. Check <https://cloudconf.ai|cloudconf.ai> for the latest.`,
        response_type: 'ephemeral'
      });
    }
  });

  // /cloudxai-ticket — Registration link
  app.command('/cloudxai-ticket', async ({ command, ack, respond }) => {
    await ack();
    const url = process.env.CONFERENCE_URL || 'https://cloudconf.ai';
    await respond({
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🎟️ *Grab your CLOUDxAI 2026 ticket!*\n\n' +
              '📅 March 14, 2026 — NIMHANS Convention Centre, Bengaluru\n\n' +
              `<${url}|→ Register now at cloudconf.ai>\n\n` +
              '_Secure your spot before it returns a 503._'
          }
        }
      ]
    });
  });

  // /cloudxai-countdown — Days until conference
  app.command('/cloudxai-countdown', async ({ command, ack, respond }) => {
    await ack();
    const conferenceDate = process.env.CONFERENCE_DATE || '2026-03-14T08:50:00+05:30';
    await respond({
      blocks: blocks.countdownBlocks(conferenceDate),
      response_type: 'ephemeral'
    });
  });

  // /cloudxai-quiz — On-demand quiz question
  app.command('/cloudxai-quiz', async ({ command, ack, respond, client }) => {
    await ack();

    const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];

    await respond({
      blocks: blocks.quizBlocks(quiz),
      response_type: 'in_channel'
    });

    // Schedule answer reveal in thread
    const revealDelay = (parseInt(process.env.QUIZ_REVEAL_DELAY_HOURS) || 4) * 60 * 60 * 1000;
    setTimeout(async () => {
      try {
        const channelId = command.channel_id;
        const history = await client.conversations.history({
          channel: channelId,
          limit: 10
        });
        const quizMessage = history.messages.find(m =>
          m.bot_id && m.text && m.text.includes(quiz.question)
        );
        if (quizMessage) {
          await client.chat.postMessage({
            channel: channelId,
            thread_ts: quizMessage.ts,
            blocks: blocks.quizRevealBlocks(quiz),
            text: `Answer: ${quiz.options[quiz.answer]}`
          });
        }
      } catch (err) {
        console.error('Failed to reveal quiz answer:', err.message);
      }
    }, revealDelay);
  });

  // /cloudxai-randomtalk — Random talk from live schedule
  app.command('/cloudxai-randomtalk', async ({ command, ack, respond }) => {
    await ack();

    try {
      const schedule = await fetcher.getLiveSchedule();
      const realTalks = schedule.talks.filter(t =>
        t.title !== 'Coming Soon' && t.speaker !== 'TBA' && t.speaker
      );

      if (realTalks.length === 0) {
        await respond({
          text: 'No talks available yet. Check back soon!',
          response_type: 'ephemeral'
        });
        return;
      }

      const talk = realTalks[Math.floor(Math.random() * realTalks.length)];
      const hallEmoji = { 'Hall A': '🅰️', 'Hall B': '🅱️', 'Hall C': '🅲️', 'Board Room': '🏠' }[talk.hall] || '🎤';

      await respond({
        response_type: 'ephemeral',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🎲 *Random talk suggestion for you:*\n\n` +
                `${hallEmoji} *${talk.title}*\n` +
                `🎤 ${talk.speaker}\n` +
                `🕐 ${talk.time} — _${talk.hall}_\n\n` +
                `_That's a 200 OK recommendation right there._`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '🎲 Another one', emoji: true },
                action_id: 'random_talk_again'
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: '📋 Full schedule', emoji: true },
                url: process.env.CONFERENCE_URL || 'https://cloudconf.ai'
              }
            ]
          }
        ]
      });
    } catch (err) {
      console.error('Random talk error:', err.message);
      await respond({
        text: `Couldn't fetch the schedule. Try again in a bit!`,
        response_type: 'ephemeral'
      });
    }
  });

  // Handle "Another one" button for random talk
  app.action('random_talk_again', async ({ ack, respond }) => {
    await ack();
    try {
      const schedule = await fetcher.getLiveSchedule();
      const realTalks = schedule.talks.filter(t =>
        t.title !== 'Coming Soon' && t.speaker !== 'TBA' && t.speaker
      );
      const talk = realTalks[Math.floor(Math.random() * realTalks.length)];
      const hallEmoji = { 'Hall A': '🅰️', 'Hall B': '🅱️', 'Hall C': '🅲️', 'Board Room': '🏠' }[talk.hall] || '🎤';

      const quips = [
        `_This opinion just got evicted from my cache and replaced with this gem._`,
        `_Randomly selected with more care than your last Terraform apply._`,
        `_The scheduler has spoken. No appeals._`,
        `_Pulled from the queue with O(1) confidence._`,
        `_Selected using a highly sophisticated Math.random() algorithm._`
      ];
      const quip = quips[Math.floor(Math.random() * quips.length)];

      await respond({
        replace_original: true,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🎲 *Random talk suggestion for you:*\n\n` +
                `${hallEmoji} *${talk.title}*\n` +
                `🎤 ${talk.speaker}\n` +
                `🕐 ${talk.time} — _${talk.hall}_\n\n` +
                quip
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '🎲 Another one', emoji: true },
                action_id: 'random_talk_again'
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: '📋 Full schedule', emoji: true },
                url: process.env.CONFERENCE_URL || 'https://cloudconf.ai'
              }
            ]
          }
        ]
      });
    } catch (err) {
      await respond({ text: 'Failed to fetch another talk. Try again!', replace_original: false });
    }
  });
}

module.exports = { registerCommands };
