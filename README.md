# Schedule Nudge Bot

A serverless Telegram bot that connects to multiple Google Calendars and sends weekly schedule updates to different Telegram groups using GitHub Actions.

## Features

- 📅 **Multi-Calendar Support** - Connect different calendars to different groups
- 👥 **Multi-Group Support** - Add the bot to multiple Telegram groups
- 📱 Sends formatted updates via Telegram to each group with their specific calendar
- ⏰ Automatically runs every Sunday at 8 PM Singapore time using GitHub Actions
- 🔄 Groups events by day with time and location details
- 🛡️ Robust error handling and connection testing
- 🚀 **Serverless** - No need to keep a machine running!
- 🔐 **Admin-only access** - Only admin can configure groups and calendars
- 🔧 **Admin debugging** - Comprehensive delivery reports sent to admin
- 📋 **Interactive commands** - Manage group-calendar assignments through chat

## Quick Setup (GitHub Actions)

### 1. Fork/Clone this Repository

Fork this repository or clone it to your GitHub account.

### 2. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the instructions
3. Save the bot token you receive
4. Get your admin user ID:
   - Message your bot and use `/start` command to see your user ID
   - Or visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
5. Add the bot to your Telegram groups where you want calendar updates

### 3. Set Up Google Calendar API

1. Follow the detailed guide in [SERVICE_ACCOUNT_SETUP.md](SERVICE_ACCOUNT_SETUP.md)
2. Create Google Cloud project and enable Calendar API
3. Create service account and download JSON key
4. Share your calendar with the service account email

### 4. Configure GitHub Secrets

1. Go to your repository **Settings** → **Secrets and variables** → **Actions**
2. Add the required repository secrets:

**Required:**
   - `TELEGRAM_BOT_TOKEN` - Your bot token from BotFather
   - `ADMIN_USER_ID` - Your Telegram user ID (for bot access and debugging)
   - `GOOGLE_SERVICE_ACCOUNT_KEY` - JSON service account key file contents
   - `GROUP_CALENDAR_MAPPINGS` - Base64-encoded group-calendar configuration (see below)
   - `TIMEZONE` - Your timezone (e.g., "Asia/Singapore")

**Optional:**
   - `GOOGLE_CALENDAR_OWNER_EMAIL` - For domain-wide delegation

### 5. Configure Groups (Two Options)

#### Option A: Interactive Setup (Recommended)
1. Deploy with empty `GROUP_CALENDAR_MAPPINGS=""` initially
2. Add your bot to Telegram groups
3. In each group, use `/addcalendar <calendar_id>` command
4. Bot will provide the Base64 string to update your GitHub secrets

#### Option B: Manual Configuration
Create a JSON file with your groups:
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
Convert to Base64 and set as `GROUP_CALENDAR_MAPPINGS` secret.

### 6. Test the Setup

1. Go to **Actions** tab in your repository
2. Find "Weekly Calendar Update" workflow
3. Click **Run workflow** to test manually

## Bot Commands (Admin Only)

Once deployed, the admin can manage groups using these commands:

### Group Management
- `/addcalendar <calendar_id>` - Assign a calendar to the current group (use in group chat)
- `/removecalendar` - Remove calendar assignment from current group
- `/listgroups` - Show all configured groups and their calendars
- `/groupinfo` - Show current group's configuration

### Information
- `/start` - Welcome message with user/group status
- `/help` - Show available commands

## How It Works

1. **Weekly Schedule**: Every Sunday at 8 PM Singapore time, the bot runs automatically
2. **Multi-Calendar Fetch**: Bot fetches events from all calendars assigned to groups
3. **Group Delivery**: Each group receives updates from their specific calendar
4. **Admin Debugging**: Admin receives a summary of all deliveries and any errors
5. **Automated Management**: No manual intervention needed after setup

## Detailed Setup Instructions

For complete setup instructions including how to get OAuth tokens, see [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md).

## Local Development (Optional)

If you want to test locally:

```bash
npm install
cp .env.example .env
# Fill in your .env file

# Interactive mode (for testing commands)
npm start --interactive

# Production mode (single execution)
npm start
```

## Project Structure

```
src/
├── index.js          # Main bot orchestrator
├── telegramBot.js    # Telegram API integration and command handling
├── messageService.js # Message formatting and delivery
├── groupManager.js   # Group-calendar mapping management
└── googleCalendar.js # Google Calendar API integration with multi-calendar support
```

## Message Format

The bot sends formatted group-specific messages like:

```
📅 Weekly Schedule Update - Family Group
*Aug 11 - Aug 17, 2025*

Here's what you have coming up this week:

*Monday*
• 9:00 AM - 10:00 AM - Team Meeting
  📍 Conference Room A
• 2:00 PM - 3:30 PM - Client Call

*Tuesday*
• All day - Company Retreat

Have a productive week ahead! 💪
```

Admin also receives debugging summaries with delivery status for all groups.

## Troubleshooting

### Common Issues
- **Bot not responding to commands**: Ensure you're the configured admin user
- **No group updates**: Verify `GROUP_CALENDAR_MAPPINGS` is properly configured and calendars are shared with service account
- **Calendar not found errors**: Check that calendar IDs are correct and service account has access
- **GitHub Actions failing**: Check that all required secrets are set correctly
- **Commands not working in groups**: Make sure bot has been added to the group and has message permissions

### Getting Help
- Check the admin debugging messages for detailed error information
- Use `/start` command to verify your user ID and group configuration
- Test manually using GitHub Actions "Run workflow" feature
- Check GitHub Actions logs for detailed execution information

## License

MIT