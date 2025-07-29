# Schedule Nudge Bot

A Telegram bot that connects to your Google Calendar and sends you weekly schedule updates every Sunday evening before your new week starts.

## Features

- 📅 Fetches events from Google Calendar for the upcoming week
- 📱 Sends formatted updates via Telegram
- ⏰ Automatically runs every Sunday at 6 PM
- 🔄 Groups events by day with time and location details
- 🛡️ Robust error handling and connection testing

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the instructions
3. Save the bot token you receive
4. Start a chat with your bot and send any message
5. Get your chat ID by visiting: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`

### 3. Set Up Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create credentials (OAuth 2.0 Client ID)
5. Add `http://localhost:3000/oauth2callback` as redirect URI
6. Download the credentials JSON

### 4. Configure Environment

```bash
cp .env.example .env
```

Fill in your `.env` file with:
- `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
- `TELEGRAM_CHAT_ID`: Your chat ID from step 2
- `GOOGLE_CLIENT_ID`: From your Google credentials
- `GOOGLE_CLIENT_SECRET`: From your Google credentials
- `GOOGLE_REFRESH_TOKEN`: You'll get this after OAuth setup
- `CALENDAR_ID`: Usually "primary" for your main calendar
- `TIMEZONE`: Your timezone (e.g., "America/New_York")

### 5. Google OAuth Setup (One-time)

You'll need to complete the OAuth flow once to get a refresh token:

1. Run the bot initially - it will guide you through OAuth
2. Or use Google's OAuth playground to get a refresh token
3. Update your `.env` file with the refresh token

## Usage

### Start the Bot

```bash
npm start
```

The bot will:
- Test connections to Telegram and Google Calendar
- Schedule weekly updates for Sunday 6 PM
- Run continuously until stopped

### Manual Testing

```bash
npm run dev -- --manual
```

This sends an immediate weekly update for testing purposes.

### Development Mode

```bash
npm run dev
```

Uses nodemon for automatic restarts during development.

## Project Structure

```
src/
├── index.js          # Main bot orchestrator
├── telegramBot.js    # Telegram API integration
└── googleCalendar.js # Google Calendar API integration
```

## Message Format

The bot sends formatted messages like:

```
📅 Weekly Schedule Update

Here's what you have coming up this week:

*Monday*
• 9:00 AM - 10:00 AM - Team Meeting
  📍 Conference Room A
• 2:00 PM - 3:30 PM - Client Call

*Tuesday*
• All day - Company Retreat

Have a productive week ahead! 💪
```

## Troubleshooting

- **Bot not starting**: Check your `.env` file configuration
- **No events showing**: Verify calendar permissions and timezone settings
- **Telegram not working**: Confirm bot token and chat ID are correct
- **Google Calendar errors**: Check OAuth credentials and refresh token

## License

MIT