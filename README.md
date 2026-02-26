# NimbusBot — CLOUDxAI Community Slack Bot

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-green" alt="Node.js">
  <img src="https://img.shields.io/badge/slack-bolt%204.x-4A154B" alt="Slack Bolt">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

A witty, technically sharp Slack bot for the [CLOUDxAI](https://cloudconf.ai) conference community. Keeps 500+ DevOps engineers, SREs, platform engineers, and AI/ML developers engaged with daily tech debates, quizzes, and conference updates.

**Conference:** March 14, 2026 — NIMHANS Convention Centre, Bengaluru, India

---

## What It Does

NimbusBot automates community engagement for the CLOUDxAI Slack workspace:

- **Daily scheduled posts** — hot takes, tech matchups, quizzes, polls, icebreakers, and meme prompts on a weekly rotation
- **Live conference data** — schedule and speaker info fetched directly from the [CLOUDxAI website repo](https://github.com/kunalworldwide/cloudxai-fest-spark), always up to date
- **Slash commands** — instant access to schedule, speakers, tickets, countdown, and on-demand quizzes
- **Smart auto-responses** — keyword-triggered replies in threads (never floods channels)
- **Welcome onboarding** — new members get a DM with quick-start links
- **Engagement tracking** — leaderboard, badges, and weekly stats

---

## Features

### Daily Engagement Posts

One automated post per day at 9:30 AM IST in `#daily-buzz`:

| Day | Format | Description |
|-----|--------|-------------|
| Monday (odd weeks) | **Icebreaker** | Fun conversation starters |
| Monday (even weeks) | **Meme Monday** | Caption-this templates |
| Tuesday | **Hot Take Tuesday** | Spicy infra opinions — vote with emoji |
| Wednesday | **This or That** | Tech matchups — 1️⃣ vs 2️⃣ |
| Thursday | **Quiz Thursday** | Technical trivia, answer revealed in thread after 4h |
| Friday | **Poll Friday** | Community polls on industry & conference topics |
| Saturday | **Weekly Wrap** | Top engagement stats for the week |

### Slash Commands

| Command | Description |
|---------|-------------|
| `/cloudxai-schedule` | Full conference schedule (live from GitHub) |
| `/cloudxai-speakers` | All confirmed speakers with roles (live from GitHub) |
| `/cloudxai-ticket` | Registration link |
| `/cloudxai-countdown` | Days, hours, minutes until March 14 |
| `/cloudxai-quiz` | On-demand quiz question |
| `/cloudxai-randomtalk` | Random talk suggestion with "give me another" button |

### Engagement Tracking & Badges

| Badge | Criteria |
|-------|----------|
| Quiz Master 🧠 | 3+ correct quiz answers |
| Hot Take Artist 🔥 | 10+ reactions on posts |
| Community MVP 🏆 | 50+ messages |

---

## Content Bank

Pre-loaded with **82 pieces** of technically accurate content covering Kubernetes, LLMOps, AI agents, GPU optimization, platform engineering, and cloud-native tooling:

| Type | Count |
|------|-------|
| Hot Takes | 16 |
| This-or-That | 16 |
| Quiz Questions | 16 |
| Polls | 10 |
| Icebreakers | 14 |
| Meme Prompts | 10 |

That's **11+ weeks** of daily content without repeats. Content cycles automatically once exhausted.

---

## Project Structure

```
cloudxai-bot/
├── src/
│   ├── app.js           # Entry point — Bolt init, Socket Mode
│   ├── commands.js       # Slash command handlers (uses live data)
│   ├── events.js         # Welcome DMs, keyword responses, tracking
│   └── scheduler.js      # Cron-based daily post scheduling
├── content/
│   ├── hot-takes.json    # Hot Take Tuesday content
│   ├── this-or-that.json # This-or-That Wednesday matchups
│   ├── quizzes.json      # Quiz Thursday questions + answers
│   ├── polls.json        # Poll Friday questions
│   ├── icebreakers.json  # Monday icebreakers
│   ├── memes.json        # Meme Monday prompts
│   └── schedule.json     # Fallback static schedule
├── utils/
│   ├── blocks.js         # Slack Block Kit message builders
│   ├── db.js             # JSON file persistence layer
│   ├── fetcher.js        # Live data fetcher (GitHub → agenda/speakers)
│   └── tracking.js       # Engagement tracking & badge system
├── config.env.example    # Environment variable template
├── package.json
├── .gitignore
└── README.md
```

---

## Setup

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Name it `NimbusBot` and select your workspace

### 2. Bot Permissions

Under **OAuth & Permissions**, add these **Bot Token Scopes**:

```
channels:history    channels:read    chat:write
commands            emoji:read       im:write
reactions:read      team:read        users:read
```

### 3. Enable Socket Mode

1. Go to **Socket Mode** → enable it
2. Generate an **App-Level Token** with scope `connections:write`

### 4. Subscribe to Events

Under **Event Subscriptions** → **Subscribe to bot events**:

```
team_join          message.channels          reaction_added
```

### 5. Create Slash Commands

| Command | Description |
|---------|-------------|
| `/cloudxai-schedule` | View conference schedule |
| `/cloudxai-speakers` | View confirmed speakers |
| `/cloudxai-ticket` | Get registration link |
| `/cloudxai-countdown` | Days until the conference |
| `/cloudxai-quiz` | On-demand quiz question |
| `/cloudxai-randomtalk` | Random talk suggestion |

No Request URL needed — Socket Mode handles routing.

### 6. Install & Configure

```bash
# Install to workspace and copy the Bot User OAuth Token (xoxb-...)

# Clone and set up
git clone https://github.com/kunalworldwide/slackbot-pennyworth.git
cd slackbot-pennyworth
npm install

# Configure environment
cp config.env.example .env
# Edit .env with your Slack tokens
```

### 7. Run

```bash
npm start        # Production
npm run dev      # Development (auto-reload)
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | App signing secret |
| `SLACK_APP_TOKEN` | App-Level Token (`xapp-...`) |
| `DAILY_BUZZ_CHANNEL` | Channel for daily posts (default: `daily-buzz`) |
| `KEYWORD_CHANNELS` | Comma-separated channels for auto-responses |
| `QUIZ_REVEAL_DELAY_HOURS` | Hours before quiz answer reveal (default: `4`) |
| `TZ` | Timezone for scheduling (default: `Asia/Kolkata`) |
| `CONFERENCE_DATE` | Conference datetime in ISO format |
| `CONFERENCE_URL` | Conference website URL |

---

## Deployment

### Railway

```bash
npm install -g @railway/cli
railway login && railway init && railway up
```

### Render

1. Connect GitHub repo → Set build: `npm install` → Set start: `npm start`
2. Add env variables in dashboard

### VPS (systemd)

```ini
[Unit]
Description=NimbusBot
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/slackbot-pennyworth
ExecStart=/usr/bin/node src/app.js
Restart=on-failure
EnvironmentFile=/opt/slackbot-pennyworth/.env

[Install]
WantedBy=multi-user.target
```

---

## Live Data

Schedule and speaker data is fetched live from the [CLOUDxAI website repo](https://github.com/kunalworldwide/cloudxai-fest-spark/tree/main-live/app/assets/data):

- **Agenda:** `agenda.json` — sessions, times, halls, speaker IDs
- **Speakers:** `speakers.json` — names, roles, bios, socials

Data is cached locally for 30 minutes. Any updates pushed to the website repo are automatically reflected in bot responses.

---

## Customization

| What | Where |
|------|-------|
| Posting time | Cron expressions in `src/scheduler.js` |
| Target channel | `DAILY_BUZZ_CHANNEL` in `.env` |
| Keyword triggers | `KEYWORD_RESPONSES` in `src/events.js` |
| Add content | JSON files in `/content/` |
| Conference info | `content/schedule.json` + env variables |

---

## Tech Stack

- **Runtime:** Node.js 18+
- **Slack SDK:** [@slack/bolt](https://slack.dev/bolt-js) 4.x (Socket Mode)
- **Scheduling:** [node-cron](https://github.com/node-cron/node-cron)
- **Storage:** JSON file persistence (zero native dependencies)
- **Messages:** [Slack Block Kit](https://api.slack.com/block-kit)

---

## License

MIT

---

Built for the [CLOUDxAI](https://cloudconf.ai) community.
