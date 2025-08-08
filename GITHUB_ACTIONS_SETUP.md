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
| `CALENDAR_ID` | Google Calendar ID (usually "primary") | `primary` |
| `TIMEZONE` | Your timezone | `America/New_York` |

### Google Calendar Authentication (Service Account Only)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | JSON key file contents | `{"type":"service_account",...}` |

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

## Google Calendar Setup

For detailed service account setup, see [SERVICE_ACCOUNT_SETUP.md](SERVICE_ACCOUNT_SETUP.md).

**Quick Steps:**
1. Create Google Cloud project and enable Calendar API
2. Create service account and download JSON key
3. Share your calendar with the service account email
4. Add `GOOGLE_SERVICE_ACCOUNT_KEY` secret with JSON contents

**Note:** OAuth is no longer supported. Service accounts provide better security and reliability for automated processes.

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