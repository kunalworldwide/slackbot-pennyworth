const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.json');

const DEFAULT_DATA = {
  posted_content: {},     // { contentId: { type, posted_at, channel, message_ts } }
  quiz_answers: [],       // [{ quiz_id, user_id, answer, correct, answered_at }]
  engagement: [],         // [{ user_id, action_type, content_id, created_at }]
  leaderboard: {}         // { userId: { quiz_correct, hot_take_reactions, messages_count, badges } }
};

let data = null;

function load() {
  if (data) return data;
  try {
    if (fs.existsSync(DB_PATH)) {
      data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      // Ensure all keys exist (forward-compat)
      for (const key of Object.keys(DEFAULT_DATA)) {
        if (!(key in data)) data[key] = DEFAULT_DATA[key];
      }
    } else {
      data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  } catch {
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  return data;
}

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function markContentPosted(contentId, contentType, channel, messageTs) {
  load();
  data.posted_content[contentId] = {
    type: contentType,
    posted_at: new Date().toISOString(),
    channel,
    message_ts: messageTs
  };
  save();
}

function getPostedContentIds(contentType) {
  load();
  return Object.entries(data.posted_content)
    .filter(([, v]) => v.type === contentType)
    .map(([k]) => k);
}

function recordQuizAnswer(quizId, userId, answer, correct) {
  load();
  data.quiz_answers.push({
    quiz_id: quizId,
    user_id: userId,
    answer,
    correct,
    answered_at: new Date().toISOString()
  });
  save();
}

function recordEngagement(userId, actionType, contentId) {
  load();
  data.engagement.push({
    user_id: userId,
    action_type: actionType,
    content_id: contentId,
    created_at: new Date().toISOString()
  });
  // Trim to last 10k entries to prevent unbounded growth
  if (data.engagement.length > 10000) {
    data.engagement = data.engagement.slice(-5000);
  }
  save();
}

function getLeaderboard(userId) {
  load();
  return data.leaderboard[userId] || null;
}

function ensureLeaderboardEntry(userId) {
  load();
  if (!data.leaderboard[userId]) {
    data.leaderboard[userId] = {
      quiz_correct: 0,
      hot_take_reactions: 0,
      messages_count: 0,
      badges: []
    };
  }
  return data.leaderboard[userId];
}

function updateLeaderboard(userId, field, increment = 1) {
  const entry = ensureLeaderboardEntry(userId);
  entry[field] = (entry[field] || 0) + increment;
  save();
}

function addBadge(userId, badge) {
  const entry = ensureLeaderboardEntry(userId);
  if (!entry.badges.includes(badge)) {
    entry.badges.push(badge);
    save();
  }
}

function getTopMembers(limit = 10) {
  load();
  return Object.entries(data.leaderboard)
    .map(([userId, stats]) => ({
      user_id: userId,
      ...stats,
      _score: (stats.quiz_correct || 0) * 3 + (stats.hot_take_reactions || 0) + (stats.messages_count || 0)
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

function getWeeklyStats() {
  load();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentEngagement = data.engagement.filter(e => e.created_at > weekAgo);

  const userCounts = {};
  for (const e of recentEngagement) {
    userCounts[e.user_id] = (userCounts[e.user_id] || 0) + 1;
  }

  const topUsers = Object.entries(userCounts)
    .map(([user_id, actions]) => ({ user_id, actions }))
    .sort((a, b) => b.actions - a.actions)
    .slice(0, 5);

  return { totalEngagement: recentEngagement.length, topUsers };
}

module.exports = {
  load,
  markContentPosted,
  getPostedContentIds,
  recordQuizAnswer,
  recordEngagement,
  getLeaderboard,
  updateLeaderboard,
  addBadge,
  getTopMembers,
  getWeeklyStats
};
