const db = require('./db');

const BADGES = {
  QUIZ_MASTER: 'Quiz Master 🧠',
  HOT_TAKE_ARTIST: 'Hot Take Artist 🔥',
  COMMUNITY_MVP: 'Community MVP 🏆',
  FIRST_RESPONDER: 'First Responder ⚡',
  MEME_LORD: 'Meme Lord 📸'
};

const BADGE_THRESHOLDS = {
  QUIZ_MASTER: { field: 'quiz_correct', min: 3 },
  HOT_TAKE_ARTIST: { field: 'hot_take_reactions', min: 10 },
  COMMUNITY_MVP: { field: 'messages_count', min: 50 },
};

function trackQuizAnswer(userId, quizId, answer, correctAnswer) {
  const isCorrect = answer === correctAnswer;
  db.recordQuizAnswer(quizId, userId, answer, isCorrect);

  if (isCorrect) {
    db.updateLeaderboard(userId, 'quiz_correct');
    checkBadges(userId);
  }

  return isCorrect;
}

function trackReaction(userId, contentId) {
  db.recordEngagement(userId, 'reaction', contentId);
  db.updateLeaderboard(userId, 'hot_take_reactions');
  checkBadges(userId);
}

function trackMessage(userId) {
  db.recordEngagement(userId, 'message', null);
  db.updateLeaderboard(userId, 'messages_count');
  checkBadges(userId);
}

function checkBadges(userId) {
  const stats = db.getLeaderboard(userId);
  if (!stats) return [];

  const newBadges = [];
  for (const [badgeKey, threshold] of Object.entries(BADGE_THRESHOLDS)) {
    if (stats[threshold.field] >= threshold.min) {
      const badge = BADGES[badgeKey];
      const currentBadges = JSON.parse(stats.badges || '[]');
      if (!currentBadges.includes(badge)) {
        db.addBadge(userId, badge);
        newBadges.push(badge);
      }
    }
  }
  return newBadges;
}

function getWeeklyLeaderboard() {
  return db.getTopMembers(10);
}

function getWeeklyStats() {
  return db.getWeeklyStats();
}

module.exports = {
  BADGES,
  trackQuizAnswer,
  trackReaction,
  trackMessage,
  checkBadges,
  getWeeklyLeaderboard,
  getWeeklyStats
};
