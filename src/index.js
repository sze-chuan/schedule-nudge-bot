require('dotenv').config();
const cron = require('node-cron');
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

  async start() {
    console.log('Schedule Nudge Bot starting...');
    
    // Test connections
    try {
      await this.testConnections();
      console.log('All connections successful');
    } catch (error) {
      console.error('Connection test failed:', error);
      process.exit(1);
    }

    // Schedule weekly updates for Sunday at 6 PM
    // Cron format: second minute hour day month dayOfWeek
    // 0 18 * * 0 = every Sunday at 6 PM
    cron.schedule('0 18 * * 0', async () => {
      console.log('Running weekly update...');
      await this.sendWeeklyUpdate();
    }, {
      timezone: process.env.TIMEZONE || 'America/New_York'
    });

    console.log('Bot is running. Weekly updates scheduled for Sundays at 6 PM');
    console.log('Press Ctrl+C to stop the bot');
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

  // Manual trigger for testing
  async sendManualUpdate() {
    console.log('Sending manual weekly update...');
    await this.sendWeeklyUpdate();
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

// Start the bot
const bot = new ScheduleNudgeBot();

// Check if this is a manual trigger
if (process.argv.includes('--manual')) {
  bot.sendManualUpdate()
    .then(() => {
      console.log('Manual update completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Manual update failed:', error);
      process.exit(1);
    });
} else {
  bot.start().catch(error => {
    console.error('Failed to start bot:', error);
    process.exit(1);
  });
}