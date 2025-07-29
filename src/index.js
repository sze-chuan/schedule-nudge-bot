require('dotenv').config();
const TelegramBotService = require('./telegramBot');
const GoogleCalendarService = require('./googleCalendar');

class ScheduleNudgeBot {
  constructor() {
    this.telegramBot = new TelegramBotService(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.ALLOWED_USER_IDS,
      process.env.ADMIN_USER_ID
    );
    
    this.googleCalendar = new GoogleCalendarService({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      calendarId: process.env.CALENDAR_ID,
      timezone: process.env.TIMEZONE
    });
  }

  async run() {
    console.log('Schedule Nudge Bot running...');
    
    // Test connections
    try {
      await this.testConnections();
      console.log('All connections successful');
    } catch (error) {
      console.error('Connection test failed:', error);
      process.exit(1);
    }

    // Send weekly update and exit
    await this.sendWeeklyUpdate();
    console.log('Weekly update completed');
    
    // Stop polling to allow process to exit
    this.telegramBot.stopPolling();
  }

  async testConnections() {
    const calendarConnected = await this.googleCalendar.testConnection();
    if (!calendarConnected) {
      throw new Error('Google Calendar connection failed');
    }

    // For GitHub Actions, we just test that the bot can be created
    // No need to send a startup message since it's automated
    console.log('Telegram bot initialized successfully');
  }

  async sendWeeklyUpdate() {
    try {
      console.log('Fetching weekly events...');
      const events = await this.googleCalendar.getWeeklyEvents();
      
      console.log('Sending weekly update via Telegram...');
      const result = await this.telegramBot.sendWeeklyUpdateToSubscribers(events);
      
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

// Run the bot
const bot = new ScheduleNudgeBot();
bot.run().catch(error => {
  console.error('Bot execution failed:', error);
  process.exit(1);
});