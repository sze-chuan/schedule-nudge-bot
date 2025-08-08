# GitHub Actions Setup Guide

This bot runs automatically using GitHub Actions and supports multiple Telegram groups with different calendar assignments.

## Setting up GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from @BotFather | `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz` |
| `ADMIN_USER_ID` | Admin user ID (only admin can configure groups) | `123456789` |
| `GROUP_CALENDAR_MAPPINGS` | Base64-encoded group-calendar configuration | `eyJncm91cHMiOlt7InNyb3VwSWQiOi0xMjM...` |
| `TIMEZONE` | Your timezone | `Asia/Singapore` |

### Google Calendar Authentication

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | JSON key file contents | `{"type":"service_account",...}` |


## How to Get Your Admin User ID

### Method 1: Using the Bot
1. Message your bot and use `/start` command - it will display your user ID
2. Use this ID as the `ADMIN_USER_ID` secret

### Method 2: Using Telegram API
1. Message your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"from":{"id":123456789}` for your message in the response

## Group Configuration

The bot now supports multiple Telegram groups with different calendar assignments:

### Setup Process
1. **Add Bot to Groups**: Add your bot to the Telegram groups where you want calendar updates
2. **Configure Groups**: Use admin commands to assign calendars to groups
3. **Automated Updates**: Bot sends group-specific calendar updates every Sunday

### Admin Commands (Admin user only)
- `/start` - Welcome message and show user/group status
- `/help` - Show available commands  
- `/addcalendar <calendar_id>` - Assign calendar to current group (use in group chat)
- `/removecalendar` - Remove calendar from current group
- `/listgroups` - Show all configured groups and their calendars
- `/groupinfo` - Show current group's configuration

### GROUP_CALENDAR_MAPPINGS Configuration

This secret contains Base64-encoded JSON with your group configurations:

#### Interactive Setup (Recommended)
1. Set `GROUP_CALENDAR_MAPPINGS=""` initially (empty)
2. Add bot to groups and use `/addcalendar <calendar_id>` in each group
3. Bot provides the updated Base64 string to copy to your secrets

#### Manual Setup
1. Create a JSON file:
```json
{
  "groups": [
    {
      "groupId": -1234567890,
      "calendarId": "family@example.com",
      "groupName": "Family Group"
    },
    {
      "groupId": -9876543210, 
      "calendarId": "work@example.com",
      "groupName": "Work Team"
    }
  ]
}
```
2. Convert to Base64 and set as the `GROUP_CALENDAR_MAPPINGS` secret

## Google Calendar Setup

For detailed service account setup, see [SERVICE_ACCOUNT_SETUP.md](SERVICE_ACCOUNT_SETUP.md).

**Quick Steps:**
1. Create Google Cloud project and enable Calendar API
2. Create service account and download JSON key
3. Share your calendar with the service account email
4. Add `GOOGLE_SERVICE_ACCOUNT_KEY` secret with JSON contents

**Note:** OAuth is no longer supported. Service accounts provide better security and reliability for automated processes.

## Schedule Configuration

The workflow is currently set to run every Sunday at 8 PM Singapore time (12 PM UTC). To change this:

1. Edit `.github/workflows/weekly-update.yml`
2. Modify the cron expression: `'0 12 * * 0'`
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
- Current default: 8 PM Singapore time = 12 PM UTC (cron: `'0 12 * * 0'`)
- Example: If you want 6 PM EST, use `'0 23 * * 0'` (6 PM EST = 11 PM UTC)

## Monitoring

- Check the **Actions** tab in your repository to see workflow runs
- Each run shows logs for debugging including group delivery status
- Failed runs will show error messages
- Admin receives debugging summaries with detailed delivery information
- You can set up notifications for failed workflows in GitHub settings

## How It Works

1. **Weekly Execution**: GitHub Actions triggers every Sunday at the configured time
2. **Multi-Calendar Fetch**: Bot fetches events from all calendars assigned to groups
3. **Group Delivery**: Each group receives updates from their specific assigned calendar
4. **Admin Debugging**: Comprehensive delivery summary sent to admin with success/failure details
5. **Error Handling**: Robust error handling with detailed logging and admin notifications