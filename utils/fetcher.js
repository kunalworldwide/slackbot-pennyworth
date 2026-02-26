/**
 * Fetches live agenda and speaker data from the CLOUDxAI GitHub repo.
 * Falls back to cached data if fetch fails.
 */
const fs = require('fs');
const path = require('path');

const AGENDA_URL = 'https://raw.githubusercontent.com/kunalworldwide/cloudxai-fest-spark/main-live/app/assets/data/agenda.json';
const SPEAKERS_URL = 'https://raw.githubusercontent.com/kunalworldwide/cloudxai-fest-spark/main-live/app/assets/data/speakers.json';

const CACHE_DIR = path.join(__dirname, '..', '.cache');
const AGENDA_CACHE = path.join(CACHE_DIR, 'agenda.json');
const SPEAKERS_CACHE = path.join(CACHE_DIR, 'speakers.json');
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function isCacheFresh(cachePath) {
  try {
    const stat = fs.statSync(cachePath);
    return (Date.now() - stat.mtimeMs) < CACHE_TTL;
  } catch {
    return false;
  }
}

function readCache(cachePath) {
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(cachePath, data) {
  ensureCacheDir();
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function getAgenda() {
  if (isCacheFresh(AGENDA_CACHE)) {
    return readCache(AGENDA_CACHE);
  }
  try {
    const data = await fetchJson(AGENDA_URL);
    writeCache(AGENDA_CACHE, data);
    console.log('[Fetcher] Agenda refreshed from GitHub');
    return data;
  } catch (err) {
    console.warn('[Fetcher] Failed to fetch agenda, using cache:', err.message);
    return readCache(AGENDA_CACHE) || [];
  }
}

async function getSpeakers() {
  if (isCacheFresh(SPEAKERS_CACHE)) {
    return readCache(SPEAKERS_CACHE);
  }
  try {
    const data = await fetchJson(SPEAKERS_URL);
    writeCache(SPEAKERS_CACHE, data);
    console.log('[Fetcher] Speakers refreshed from GitHub');
    return data;
  } catch (err) {
    console.warn('[Fetcher] Failed to fetch speakers, using cache:', err.message);
    return readCache(SPEAKERS_CACHE) || [];
  }
}

/**
 * Build a speaker lookup map: { "speaker-id": { name, role, ... } }
 */
async function getSpeakerMap() {
  const speakers = await getSpeakers();
  const map = {};
  for (const s of speakers) {
    map[s.id] = s;
  }
  return map;
}

/**
 * Get formatted schedule combining agenda + speaker names.
 * Returns the same shape the blocks.js functions expect.
 */
async function getLiveSchedule() {
  const [agenda, speakerMap] = await Promise.all([getAgenda(), getSpeakerMap()]);

  const sessions = agenda.filter(a => a.type !== 'break');
  const allSessions = agenda;

  const talks = sessions.map(session => {
    let speakerNames = '';
    if (Array.isArray(session.speaker) && session.speaker.length > 0) {
      speakerNames = session.speaker
        .map(id => speakerMap[id]?.name || id)
        .join(', ');
    } else if (typeof session.speaker === 'string' && session.speaker) {
      speakerNames = session.speaker;
    } else {
      speakerNames = 'TBA';
    }

    return {
      time: session.time,
      title: session.title,
      speaker: speakerNames,
      hall: session.hall || '',
      type: session.type,
      description: session.description || ''
    };
  });

  return {
    conference: {
      name: 'CLOUDxAI 2026',
      date: 'March 14, 2026',
      venue: 'NIMHANS Convention Centre, Bengaluru, India',
      doors_open: '8:50 AM IST',
      url: process.env.CONFERENCE_URL || 'https://cloudconf.ai',
      registration_url: process.env.CONFERENCE_URL || 'https://cloudconf.ai'
    },
    halls: ['Hall A', 'Hall B', 'Hall C', 'Board Room'],
    talks,
    allSessions
  };
}

/**
 * Get formatted speakers list.
 */
async function getLiveSpeakers() {
  const speakers = await getSpeakers();
  return speakers.filter(s => s.visible !== false);
}

module.exports = {
  getAgenda,
  getSpeakers,
  getSpeakerMap,
  getLiveSchedule,
  getLiveSpeakers
};
