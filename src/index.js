require('dotenv').config();
const TelegramBotService = require('./telegramBot');
const GoogleCalendarService = require('./googleCalendar');

class ScheduleNudgeBot {
  constructor(interactiveMode = false) {
    this.interactiveMode = interactiveMode;
    this.telegramBot = new TelegramBotService(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.ADMIN_USER_ID,
      interactiveMode
    );
    
    this.googleCalendar = new GoogleCalendarService({
      serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      timezone: process.env.TIMEZONE
    });
  }

  async run() {
    console.log(`Schedule Nudge Bot running${this.interactiveMode ? ' in interactive mode' : ''}...`);
    
    // Test connections
    try {
      await this.testConnections();
      console.log('All connections successful');
    } catch (error) {
      console.error('Connection test failed:', error);
      process.exit(1);
    }

    if (this.interactiveMode) {
      console.log('🤖 Bot is now listening for messages. Send /help to see available commands.');
      console.log('Press Ctrl+C to stop the bot.');
      // Keep running for interactive mode
    } else {
      // Send weekly update and exit (serverless mode)
      await this.sendWeeklyUpdate();
      console.log('Weekly update completed');
      
      // Stop polling to allow process to exit
      this.telegramBot.stopPolling();
    }
  }

  async testConnections() {
    const calendarConnected = await this.googleCalendar.testConnection();
    if (!calendarConnected) {
      throw new Error('Google Calendar connection failed');
    }

    // Test Telegram bot connection
    const telegramConnected = await this.telegramBot.testTelegramConnection();
    if (!telegramConnected) {
      throw new Error('Telegram bot connection failed');
    }
  }

  async sendWeeklyUpdate() {
    try {
      const groupManager = this.telegramBot.getGroupManager();
      const configuredGroups = groupManager.getAllGroups();
      
      if (configuredGroups.length === 0) {
        console.log('No groups configured - nothing to send. Use /addcalendar command in groups to configure calendars.');
        return;
      }

      console.log(`Found ${configuredGroups.length} configured groups`);
      
      // Get unique calendar IDs from all groups
      const uniqueCalendarIds = [...new Set(configuredGroups.map(group => group.calendarId))];
      console.log(`Fetching events from ${uniqueCalendarIds.length} unique calendars: ${uniqueCalendarIds.join(', ')}`);
      
      // Fetch events from all required calendars
      const calendarResults = await this.googleCalendar.getWeeklyEventsForMultipleCalendars(uniqueCalendarIds);
      
      if (calendarResults.successCount === 0) {
        throw new Error(`Failed to fetch events from any calendar. Errors: ${calendarResults.errors.map(e => e.error).join(', ')}`);
      }
      
      console.log(`Calendar fetch completed: ${calendarResults.successCount} successful, ${calendarResults.errorCount} failed`);
      
      // Send updates to all groups with their specific calendar events
      const result = await this.telegramBot.sendWeeklyUpdateToAllGroups(calendarResults);
      
      console.log(`Multi-group weekly update completed:`);
      console.log(`• Groups: ${result.successCount} sent, ${result.errorCount} failed`);
      console.log(`• Admin debug: ${result.adminDeliveries.sent ? 'sent' : 'failed'}`);
      
      if (result.errorCount > 0) {
        console.warn(`Some group deliveries failed. Check admin debug message for details.`);
      }
      
    } catch (error) {
      console.error('Error sending weekly update:', error);
      
      // Try to notify admin of the error
      try {
        if (this.telegramBot.adminUserId) {
          const errorMessage = `🚨 *Weekly Update Failed*\n\nError: ${error.message}\n\nTime: ${new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}`;
          await this.telegramBot.bot.sendMessage(this.telegramBot.adminUserId, errorMessage, { parse_mode: 'Markdown' });
        }
      } catch (notificationError) {
        console.error('Failed to send error notification to admin:', notificationError.message);
      }
      
      throw error;
    }
  }

}

// Export the class for testing
module.exports = ScheduleNudgeBot;

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Schedule Nudge Bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down Schedule Nudge Bot...');
  process.exit(0);
});

// Check if running in interactive mode (for local testing)
const isInteractive = process.argv.includes('--interactive') || process.argv.includes('-i');

// Run the bot
const bot = new ScheduleNudgeBot(isInteractive);
bot.run().catch(error => {
  console.error('Bot execution failed:', error);
  process.exit(1);
});