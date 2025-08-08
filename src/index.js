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
      calendarOwnerEmail: process.env.GOOGLE_CALENDAR_OWNER_EMAIL,
      calendarId: process.env.CALENDAR_ID,
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
      console.log('Fetching weekly events...');
      const weeklyData = await this.googleCalendar.getWeeklyEvents();
      
      console.log('Sending weekly update via Telegram...');
      const result = await this.telegramBot.sendWeeklyUpdateToSubscribers(weeklyData.events, weeklyData.startDate, weeklyData.endDate);
      
      console.log(`Weekly update completed: ${result.successCount} sent, ${result.errorCount} failed`);
    } catch (error) {
      console.error('Error sending weekly update:', error);
      
      // For GitHub Actions, we don't need to send error notifications
      // The logs will show the error details
      throw error;
    }
  }

}

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