# Schedule Nudge Bot

A serverless Telegram bot that connects to your Google Calendar and sends you weekly schedule updates every Sunday evening using GitHub Actions.

## Features

- 📅 Fetches events from Google Calendar for the upcoming week
- 📱 Sends formatted updates via Telegram
- ⏰ Automatically runs every Sunday at 6 PM using GitHub Actions
- 🔄 Groups events by day with time and location details
- 🛡️ Robust error handling and connection testing
- 🚀 **Serverless** - No need to keep a machine running!
- 👥 **Multi-user support** - Control who can access the bot
- 🔐 **Access control** - Users must be authorized and subscribed

## Quick Setup (GitHub Actions)

### 1. Fork/Clone this Repository

Fork this repository or clone it to your GitHub account.

### 2. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the instructions
3. Save the bot token you receive
4. Get user IDs who should have access:
   - Have each user message your bot
   - Use `/start` command to see their user ID
   - Or visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`

### 3. Set Up Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create credentials (OAuth 2.0 Client ID)
5. Add `http://localhost:3000/oauth2callback` as redirect URI
6. Get a refresh token (see detailed instructions in [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md))

### 4. Configure GitHub Secrets

1. Go to your repository **Settings** → **Secrets and variables** → **Actions**
2. Add the following repository secrets:
   - `TELEGRAM_BOT_TOKEN`
   - `ALLOWED_USER_IDS` (comma-separated user IDs: "123456789,987654321")
   - `ADMIN_USER_ID` (optional: for managing users)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - `GOOGLE_REDIRECT_URI`
   - `CALENDAR_ID` (usually "primary")
   - `TIMEZONE` (e.g., "America/New_York")

### 5. Test the Setup

1. Go to **Actions** tab in your repository
2. Find "Weekly Calendar Update" workflow
3. Click **Run workflow** to test manually

## Detailed Setup Instructions

For complete setup instructions including how to get OAuth tokens, see [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md).

## Local Development (Optional)

If you want to test locally:

```bash
npm install
cp .env.example .env
# Fill in your .env file
npm start
```

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