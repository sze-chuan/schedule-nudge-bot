# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General guideline

- Share an overview of the plan before making any code modifications

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

This is a **serverless** Telegram bot that runs via GitHub Actions cron jobs. It consists of five main components:

### Core Services
- **ScheduleNudgeBot** (`src/index.js`): Main orchestrator class that coordinates between Telegram and Google Calendar services
- **TelegramBotService** (`src/telegramBot.js`): Handles Telegram interactions, command processing, and admin authentication
- **MessageService** (`src/messageService.js`): Manages message formatting, delivery, and admin debugging summaries
- **GroupManager** (`src/groupManager.js`): Manages group-calendar mappings with secure Base64 storage
- **GoogleCalendarService** (`src/googleCalendar.js`): Manages Google Calendar API integration with multi-calendar support

### Execution Model
- **GitHub Actions**: Automated weekly execution every Sunday at 8 PM Singapore time (12 PM UTC) via `.github/workflows/weekly-update.yml`
- **Serverless**: No persistent server - runs on-demand and exits after sending updates
- **Environment-based**: All configuration via environment variables/GitHub Secrets

### Authentication & Access Control
- **Google Calendar**: Uses Service Account authentication (JWT) with optional domain-wide delegation
- **Telegram**: Admin-only access control via admin user ID
- **Multi-Group Support**: Admin can configure different calendars for different groups

### Key Features
- **Admin-only access**: Only the configured admin user can interact with the bot and manage groups
- **Multi-group support**: Bot can be added to multiple groups with different calendar assignments
- **Interactive commands**: `/start`, `/help`, `/addcalendar`, `/removecalendar`, `/listgroups`, `/groupinfo`
- **Group-specific updates**: Each group receives updates from their assigned calendar
- **Admin debugging**: Comprehensive debugging summaries sent to admin for all group deliveries
- **Robust error handling**: Connection testing, graceful failures, automatic error recovery
- **Formatted messages**: Events grouped by day with time and location details
- **Secure configuration**: Group-calendar mappings stored as Base64-encoded environment variables

## Configuration Requirements

The bot requires these environment variables/GitHub Secrets:

### Required Configuration
- `TELEGRAM_BOT_TOKEN`: Bot token from @BotFather
- `ADMIN_USER_ID`: Required admin user ID for bot access and debugging messages
- `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON service account credentials
- `GROUP_CALENDAR_MAPPINGS`: Base64-encoded JSON containing group-calendar mappings
- `TIMEZONE`: Timezone for event display (e.g., "Asia/Singapore")

### Legacy Configuration (Optional)
- `CALENDAR_ID`: Fallback Google Calendar ID (usually "primary") - used when no groups configured
- `GOOGLE_CALENDAR_OWNER_EMAIL`: Optional for domain-wide delegation

### Group Configuration Format
The `GROUP_CALENDAR_MAPPINGS` should contain Base64-encoded JSON in this format:
```json
{
  "groups": [
    {
      "groupId": -4753902144,
      "calendarId": "calendar@example.com",
      "groupName": "Family Group"
    }
  ]
}
```

## Message Flow

### Multi-Group Mode (Default)
1. Bot tests Google Calendar and Telegram connections
2. Loads group-calendar mappings from `GROUP_CALENDAR_MAPPINGS`
3. Fetches weekly events from all unique calendars assigned to groups
4. Sends group-specific updates to each configured group
5. Sends comprehensive debugging summary to admin user
6. Handles delivery failures with proper error logging and recovery
7. Exits after completing all deliveries

### Legacy Mode (Fallback)
If no groups are configured, falls back to admin-only mode:
1. Fetches events from fallback `CALENDAR_ID`
2. Sends update to admin user only

## Bot Commands (Admin Only)

### Group Management
- `/addcalendar <calendar_id>` - Assign calendar to current group (must be used in group chat)
- `/removecalendar` - Remove calendar assignment from current group
- `/listgroups` - Show all configured groups and their calendars
- `/groupinfo` - Show current group's configuration

### Information
- `/start` - Welcome message with user/group status
- `/help` - Show available commands

## Testing

### Local Testing
```bash
# Interactive mode for command testing
npm start --interactive

# Single execution (production mode)
npm start
```

### GitHub Actions Testing
The workflow can be triggered manually via "Run workflow" in the Actions tab for testing the serverless execution environment.