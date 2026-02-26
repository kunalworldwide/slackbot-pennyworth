/**
 * Block Kit message builders for PennyworthBot.
 * All functions return Slack Block Kit block arrays.
 */

function hotTakeBlocks(take) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🔥 Hot Take Tuesday', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${take.text}*`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'React: 🔥 = Agree  |  🧊 = Cold take  |  💀 = Terrible opinion'
        }
      ]
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '_Brought to you by PennyworthBot — your friendly neighborhood SRE who reads arxiv_ ☁️'
        }
      ]
    }
  ];
}

function thisOrThatBlocks(matchup) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '⚔️ This or That Wednesday', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${matchup.context}:*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `1️⃣  *${matchup.option_a}*\n\nvs.\n\n2️⃣  *${matchup.option_b}*`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'React with 1️⃣ or 2️⃣ to cast your vote. Spicy takes in the thread welcome.'
        }
      ]
    }
  ];
}

function quizBlocks(quiz) {
  const optionsText = Object.entries(quiz.options)
    .map(([key, val]) => {
      const emoji = { A: '🅰️', B: '🅱️', C: '🅲️', D: '🅳️' }[key];
      return `${emoji}  ${val}`;
    })
    .join('\n');

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🧠 Quiz Thursday', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${quiz.question}*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: optionsText
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'React with the emoji for your answer. Answer revealed in this thread in 4 hours ⏳'
        }
      ]
    }
  ];
}

function quizRevealBlocks(quiz) {
  const correctEmoji = { A: '🅰️', B: '🅱️', C: '🅲️', D: '🅳️' }[quiz.answer];
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `⏰ *Time's up!*\n\nThe correct answer is: ${correctEmoji} *${quiz.options[quiz.answer]}*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `💡 *Explanation:* ${quiz.explanation}`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'More quizzes every Thursday — or use `/cloudxai-quiz` for an on-demand question!'
        }
      ]
    }
  ];
}

function pollBlocks(poll) {
  const optionsText = poll.options
    .map(opt => `${opt.emoji}  ${opt.text}`)
    .join('\n');

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🗳️ Poll Friday', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${poll.question}*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: optionsText
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'React with the emoji that matches your pick!'
        }
      ]
    }
  ];
}

function icebreakerBlocks(icebreaker) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '💬 Monday Icebreaker', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${icebreaker.prompt}*`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Drop your answers in the thread. No wrong answers — only wrong infrastructure decisions. ☁️'
        }
      ]
    }
  ];
}

function memeBlocks(meme) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📸 Meme Monday', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: meme.prompt
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Best caption gets pinned. Bonus points if it\'s happened to you IRL.'
        }
      ]
    }
  ];
}

function welcomeBlocks() {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Welcome to CLOUDxAI! 🚀', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "You just joined *500+ engineers* who are building the future of intelligent infrastructure."
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "*Here's your quick start:*\n→ Introduce yourself in *#introductions* (name, role, one hot take about cloud)\n→ Check the schedule: <https://cloudconf.ai|cloudconf.ai>\n→ Jump into *#hallway-track* for daily tech debates, quizzes, and hot takes\n→ Try `/cloudxai-countdown` to see how close we are"
      }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "📅 *March 14, 2026* — NIMHANS Convention Centre, Bengaluru\n\nSee you there? 🎟️"
      }
    }
  ];
}

function scheduleBlocks(schedule) {
  const hallEmojis = { 'Hall A': '🅰️', 'Hall B': '🅱️', 'Hall C': '🅲️', 'Board Room': '🏠' };
  const hallsText = (schedule.halls || [])
    .map(h => `${hallEmojis[h] || '📍'} *${h}*`)
    .join('  |  ');

  // Group talks by time slot, limit to keep under Slack's block limits
  const talksText = schedule.talks
    .filter(t => t.title !== 'Coming Soon')
    .map(t => {
      const hall = t.hall ? ` _(${t.hall})_` : '';
      const speaker = t.speaker && t.speaker !== 'TBA' ? ` — ${t.speaker}` : '';
      return `*${t.time}* ${t.title}${speaker}${hall}`;
    })
    .join('\n');

  // Slack has a 3000 char limit per text block, so split if needed
  const chunks = splitText(talksText, 2800);

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📋 CLOUDxAI 2026 Schedule', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📅 *${schedule.conference.date}*\n📍 ${schedule.conference.venue}\n🚪 Doors open: ${schedule.conference.doors_open}\n\n${hallsText}`
      }
    },
    { type: 'divider' }
  ];

  for (const chunk of chunks) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: chunk }
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Full details & latest updates at <${schedule.conference.url}|cloudconf.ai> | _Data refreshed live from GitHub_ 🔄`
      }
    ]
  });

  return blocks;
}

function speakerBlocks(speakers, url) {
  const featured = speakers.filter(s => s.isFeatured || s.isHeroFeature);
  const others = speakers.filter(s => !s.isFeatured && !s.isHeroFeature);

  const featuredLines = featured
    .map(s => `⭐ *${s.name}* — _${s.role}_`)
    .join('\n');

  const otherLines = others
    .map(s => `• *${s.name}* — _${s.role}_`)
    .join('\n');

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🎤 CLOUDxAI 2026 Speakers', emoji: true }
    },
    { type: 'divider' }
  ];

  if (featuredLines) {
    // Split if needed
    const fChunks = splitText(`*Featured Speakers:*\n${featuredLines}`, 2800);
    for (const chunk of fChunks) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: chunk } });
    }
  }

  if (otherLines) {
    blocks.push({ type: 'divider' });
    const oChunks = splitText(`*All Speakers:*\n${otherLines}`, 2800);
    for (const chunk of oChunks) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: chunk } });
    }
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `${speakers.length} speakers confirmed. More at <${url || 'https://cloudconf.ai'}|cloudconf.ai> | _Data refreshed live from GitHub_ 🔄`
      }
    ]
  });

  return blocks;
}

/** Split long text into chunks at newline boundaries */
function splitText(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if ((current + '\n' + line).length > maxLen && current) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + '\n' + line : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function countdownBlocks(conferenceDate) {
  const now = new Date();
  const conf = new Date(conferenceDate);
  const diff = conf - now;

  if (diff <= 0) {
    return [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: "🎉 *CLOUDxAI 2026 is happening RIGHT NOW!* See you at NIMHANS Convention Centre, Bengaluru!" }
      }
    ];
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '⏳ CLOUDxAI Countdown', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${days} days, ${hours} hours, and ${minutes} minutes* until CLOUDxAI 2026! 🚀\n\n📅 March 14, 2026\n📍 NIMHANS Convention Centre, Bengaluru\n🚪 Doors open at 8:50 AM IST\n\n<https://cloudconf.ai|Grab your ticket before it's a 503 Service Unavailable situation 🎟️>`
      }
    }
  ];
}

function leaderboardBlocks(topMembers) {
  const medals = ['🥇', '🥈', '🥉'];
  const lines = topMembers.map((m, i) => {
    const medal = medals[i] || `${i + 1}.`;
    const score = (m.quiz_correct || 0) * 3 + (m.hot_take_reactions || 0) + (m.messages_count || 0);
    const badgeArr = Array.isArray(m.badges) ? m.badges : JSON.parse(m.badges || '[]');
    const badges = badgeArr.join(' ');
    return `${medal} <@${m.user_id}> — ${score} pts ${badges}`;
  });

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🏆 Community Leaderboard', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: lines.length > 0 ? lines.join('\n') : '_No activity yet. Be the first!_'
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Scoring: Quiz correct = 3pts | Reactions = 1pt | Messages = 1pt'
        }
      ]
    }
  ];
}

function weeklyWrapBlocks(stats) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🏆 Weekly Wrap — This Week in #cloudxai', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📊 *${stats.totalEngagement} total interactions* this week\n\n*Top contributors:*\n${stats.topUsers.map((u, i) => `${i + 1}. <@${u.user_id}> — ${u.actions} actions`).join('\n') || '_Quiet week. Touch grass confirmed._'}`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'New week, new debates. See you Monday. ☁️'
        }
      ]
    }
  ];
}

// ─── Speaker Spotlight ──────────────────────────────────

const speakerIntroQuips = [
  "This one's going to be fire. Bookmark it.",
  "If you skip this talk, your kubectl will stop working. Probably.",
  "The kind of talk that makes you rethink your entire architecture on the cab ride home.",
  "Bring a notebook. Or just screenshot everything. We don't judge.",
  "This is not a drill. This is a must-attend session.",
  "Your future self will thank you for attending this one.",
  "Warning: may cause sudden urge to refactor everything on Monday.",
];

function speakerSpotlightBlocks(speaker) {
  const quip = speakerIntroQuips[Math.floor(Math.random() * speakerIntroQuips.length)];
  const linkedin = speaker.socials?.find(s => s.name === 'linkedin');
  const linkedinLine = linkedin ? `\n<${linkedin.url}|Connect on LinkedIn>` : '';
  const descLine = speaker.description ? `\n\n💬 _"${speaker.description.substring(0, 280)}${speaker.description.length > 280 ? '...' : ''}"_` : '';

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🎤 Speaker Spotlight', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `⭐ *${speaker.name}*\n_${speaker.role}_\n\n${speaker.bio}${descLine}${linkedinLine}`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${quip} | 📅 March 14, Bengaluru | <https://cloudconf.ai|Get your ticket>`
        }
      ]
    }
  ];
}

// ─── Talk Teaser ────────────────────────────────────────

const talkTeaserQuips = [
  "Clear your calendar for this one.",
  "This talk alone is worth the ticket price.",
  "The Slack thread after this talk is going to be legendary.",
  "Your architecture diagrams will never look the same after this.",
  "Pro tip: sit in the front row for this one.",
  "If this doesn't get you hyped, check your pulse.",
];

function talkTeaserBlocks(talk, speakerData) {
  const quip = talkTeaserQuips[Math.floor(Math.random() * talkTeaserQuips.length)];
  const hallEmoji = { 'Hall A': '🅰️', 'Hall B': '🅱️', 'Hall C': '🅲️', 'Board Room': '🏠' }[talk.hall] || '📍';

  let speakerInfo = `🎤 *${talk.speaker}*`;
  if (speakerData) {
    speakerInfo += `\n_${speakerData.role}_`;
  }

  const descLine = talk.description ? `\n\n${talk.description.substring(0, 300)}${talk.description.length > 300 ? '...' : ''}` : '';

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📢 Talk Teaser', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${talk.title}*\n\n${speakerInfo}\n${hallEmoji} ${talk.hall} | 🕐 ${talk.time}${descLine}`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${quip} | <https://cloudconf.ai|Register for CLOUDxAI 2026>`
        }
      ]
    }
  ];
}

// ─── Community Partner Shoutout ─────────────────────────

const partnerQuips = [
  "Building the CLOUDxAI ecosystem, one community at a time.",
  "The real cloud-native is the friends we made along the way.",
  "These communities are the backbone of Bengaluru's tech scene.",
  "Great conferences don't happen alone. Massive shoutout to our partners.",
  "If you're not already part of these communities, what are you even doing?",
];

function partnerShoutoutBlocks(partners) {
  const quip = partnerQuips[Math.floor(Math.random() * partnerQuips.length)];
  const partnerLines = partners
    .map(p => `• *<${p.link}|${p.name}>*`)
    .join('\n');

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🤝 Community Partner Shoutout', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Huge thanks to these amazing communities for supporting CLOUDxAI 2026!\n\n${partnerLines}\n\n${quip}`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Want your community featured? Reach out to the CLOUDxAI team! | <https://cloudconf.ai|cloudconf.ai>'
        }
      ]
    }
  ];
}

// ─── Countdown Hype Post ────────────────────────────────

const countdownQuips = [
  "Have you booked your Bengaluru cab yet? IYKYK.",
  "Your calendar already has a conflict? Cancel it. This is more important.",
  "Time to update your LinkedIn headline to 'Attending CLOUDxAI 2026'.",
  "The countdown is real. The FOMO will be realer.",
  "If you haven't registered yet, this is your sign.",
  "Fewer days than your average sprint. Let that sink in.",
];

function countdownHypeBlocks(conferenceDate) {
  const now = new Date();
  const conf = new Date(conferenceDate);
  const diff = conf - now;

  if (diff <= 0) {
    return [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: "🎉 *CLOUDxAI 2026 is happening RIGHT NOW!* Get to NIMHANS Convention Centre, Bengaluru!" }
      }
    ];
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const quip = countdownQuips[Math.floor(Math.random() * countdownQuips.length)];

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `⏳ ${days} Days to CLOUDxAI!`, emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${days} days and ${hours} hours* until 500+ engineers take over NIMHANS Convention Centre.\n\n📅 March 14, 2026 | 📍 Bengaluru\n4 Halls | 30+ Talks | Workshops | Panels\n\n${quip}\n\n<https://cloudconf.ai|🎟️ Register now>`
      }
    }
  ];
}

// ─── LinkedIn-style Announcement Post ───────────────────

function linkedInAnnouncementBlocks(announcement) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📣 From the CLOUDxAI Feed', emoji: true }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: announcement.text
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `via <https://www.linkedin.com/company/cloud-x-ai/|CLOUDxAI on LinkedIn> | Give us a follow if you haven't already!`
        }
      ]
    }
  ];
}

module.exports = {
  hotTakeBlocks,
  thisOrThatBlocks,
  quizBlocks,
  quizRevealBlocks,
  pollBlocks,
  icebreakerBlocks,
  memeBlocks,
  welcomeBlocks,
  scheduleBlocks,
  speakerBlocks,
  countdownBlocks,
  leaderboardBlocks,
  weeklyWrapBlocks,
  speakerSpotlightBlocks,
  talkTeaserBlocks,
  partnerShoutoutBlocks,
  countdownHypeBlocks,
  linkedInAnnouncementBlocks
};
