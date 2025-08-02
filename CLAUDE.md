# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start the bot (production)
npm start

# Development with auto-restart
npm run dev

# Run tests
npm test
```

## Architecture Overview

This is a **serverless** Telegram bot that runs via GitHub Actions cron jobs. It consists of three main components:

### Core Services
- **ScheduleNudgeBot** (`src/index.js`): Main orchestrator class that coordinates between Telegram and Google Calendar services
- **TelegramBotService** (`src/telegramBot.js`): Handles all Telegram interactions including user management, subscriptions, and message formatting
- **GoogleCalendarService** (`src/googleCalendar.js`): Manages Google Calendar API integration using service account authentication

### Execution Model
- **GitHub Actions**: Automated weekly execution every Sunday at 6 PM UTC via `.github/workflows/weekly-update.yml`
- **Serverless**: No persistent server - runs on-demand and exits after sending updates
- **Environment-based**: All configuration via environment variables/GitHub Secrets

### Authentication & Access Control
- **Google Calendar**: Uses Service Account authentication (JWT) with optional domain-wide delegation
- **Telegram**: Multi-user access control with authorized user lists and admin privileges
- **Subscription System**: Users must explicitly subscribe to receive weekly updates

### Key Features
- **Multi-user support**: Authorized users with subscription management
- **Admin commands**: User management (`/add_user`, `/remove_user`, `/users`)
- **Robust error handling**: Connection testing, graceful failures, automatic user cleanup
- **Formatted messages**: Events grouped by day with time and location details

## Configuration Requirements

The bot requires these environment variables/GitHub Secrets:
- `TELEGRAM_BOT_TOKEN`: Bot token from @BotFather
- `ALLOWED_USER_IDS`: Comma-separated authorized user IDs
- `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON service account credentials
- `CALENDAR_ID`: Google Calendar ID (usually "primary")
- `TIMEZONE`: Timezone for event display
- `ADMIN_USER_ID`: Optional admin user for user management
- `GOOGLE_CALENDAR_OWNER_EMAIL`: Optional for domain-wide delegation

## Message Flow
1. Bot tests Google Calendar and Telegram connections
2. Fetches weekly events (Monday-Sunday) from Google Calendar
3. Formats events into markdown messages grouped by day
4. Sends updates to all subscribed users
5. Handles delivery failures and removes blocked users automatically
6. Exits after completing the update cycle

## Testing
Run `npm start` locally for manual testing. The GitHub Actions workflow can be triggered manually via "Run workflow" in the Actions tab for testing the serverless execution environment.