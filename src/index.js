require('dotenv').config();
const TelegramBotService = require('./telegramBot');
const GoogleCalendarService = require('./googleCalendar');

class ScheduleNudgeBot {
  constructor() {
    this.telegramBot = new TelegramBotService(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID
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
  }

  async testConnections() {
    const calendarConnected = await this.googleCalendar.testConnection();
    if (!calendarConnected) {
      throw new Error('Google Calendar connection failed');
    }

    // Test Telegram by sending a startup message
    try {
      await this.telegramBot.sendMessage('🤖 Schedule Nudge Bot is now active!');
      console.log('Telegram connection successful');
    } catch (error) {
      throw new Error('Telegram connection failed: ' + error.message);
    }
  }

  async sendWeeklyUpdate() {
    try {
      console.log('Fetching weekly events...');
      const events = await this.googleCalendar.getWeeklyEvents();
      
      console.log('Sending weekly update via Telegram...');
      await this.telegramBot.sendWeeklyUpdate(events);
      
      console.log('Weekly update sent successfully');
    } catch (error) {
      console.error('Error sending weekly update:', error);
      
      // Send error notification to user
      try {
        await this.telegramBot.sendMessage('❌ Error occurred while fetching your weekly schedule. Please check the bot logs.');
      } catch (telegramError) {
        console.error('Failed to send error notification:', telegramError);
      }
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