# GitHub Actions Setup Guide

This bot now runs automatically using GitHub Actions instead of requiring a continuously running server.

## Setting up GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from @BotFather | `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz` |
| `ALLOWED_USER_IDS` | Comma-separated list of authorized user IDs | `123456789,987654321,555555555` |
| `ADMIN_USER_ID` | Admin user ID for managing subscriptions | `123456789` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `abc123.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxxxxxxxxxxxx` |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth Refresh Token | `1//04xxxxxxxxxxxxxxxxx` |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | `http://localhost:3000/oauth2callback` |
| `CALENDAR_ID` | Google Calendar ID (usually "primary") | `primary` |
| `TIMEZONE` | Your timezone | `America/New_York` |

## How to Get User IDs

### Method 1: Using the Bot
1. Start your bot locally or message it during testing
2. When a user messages `/start`, their user ID will be displayed
3. Add authorized user IDs to the `ALLOWED_USER_IDS` secret

### Method 2: Using Telegram API
1. Have users message your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"from":{"id":123456789}` for each user in the response

## User Access Control

The bot now supports multiple users with access control:

- **Authorized Users**: Only users in `ALLOWED_USER_IDS` can interact with the bot
- **Subscriptions**: Users must use `/subscribe` to receive weekly updates
- **Admin Functions**: The `ADMIN_USER_ID` can manage user access with special commands

### User Commands
- `/start` - Welcome message and show user ID
- `/subscribe` - Subscribe to weekly updates
- `/unsubscribe` - Unsubscribe from updates
- `/status` - Check subscription status
- `/help` - Show available commands

### Admin Commands (Admin user only)
- `/users` - Show user statistics
- `/add_user <user_id>` - Add user to authorized list
- `/remove_user <user_id>` - Remove user from authorized list

## How to Get Google Refresh Token

### Option 1: OAuth Playground
1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) and check "Use your own OAuth credentials"
3. Enter your Client ID and Client Secret
4. In Step 1, select "Google Calendar API v3" → `https://www.googleapis.com/auth/calendar.readonly`
5. Click "Authorize APIs" and complete the OAuth flow
6. In Step 2, click "Exchange authorization code for tokens"
7. Copy the refresh_token from the response

### Option 2: Using the Google Client Libraries
Run a local OAuth flow using the Google client libraries (more complex but programmatic).

## Schedule Configuration

The workflow is currently set to run every Sunday at 6 PM UTC. To change this:

1. Edit `.github/workflows/weekly-update.yml`
2. Modify the cron expression: `'0 18 * * 0'`
   - Format: `minute hour day month day-of-week`
   - Day of week: 0=Sunday, 1=Monday, etc.
   - Use [crontab.guru](https://crontab.guru/) to help generate expressions

## Manual Testing

You can manually trigger the workflow:

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select "Weekly Calendar Update" workflow
4. Click **Run workflow** button

## Timezone Considerations

- GitHub Actions runs in UTC timezone
- Adjust the cron schedule accordingly
- The bot will use the `TIMEZONE` secret for formatting times in messages
- Example: If you want 6 PM EST, use `'0 23 * * 0'` (6 PM EST = 11 PM UTC)

## Monitoring

- Check the **Actions** tab in your repository to see workflow runs
- Each run shows logs for debugging
- Failed runs will show error messages
- You can set up notifications for failed workflows in GitHub settings