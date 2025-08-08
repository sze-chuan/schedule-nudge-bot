const TelegramBot = require('node-telegram-bot-api');
const { DateTime } = require('luxon');

class TelegramBotService {
  constructor(token, allowedUserIds, adminUserId = null, interactiveMode = false) {
    // Configure bot with request options to handle SSL/network issues
    const botOptions = {
      polling: interactiveMode,
      request: {
        agentOptions: {
          keepAlive: true,
          family: 4 // Force IPv4
        }
      }
    };
    
    this.bot = new TelegramBot(token, botOptions);
    this.allowedUserIds = this.parseUserIds(allowedUserIds);
    this.adminUserId = adminUserId ? parseInt(adminUserId) : null;
    this.interactiveMode = interactiveMode;
    
    // Setup handlers for interactive mode
    if (interactiveMode) {
      this.setupBotHandlers();
    }
  }

  parseUserIds(userIdsString) {
    if (!userIdsString) return [];
    return userIdsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  }

  isAuthorizedUser(userId) {
    return this.allowedUserIds.includes(userId);
  }

  isAdmin(userId) {
    return this.adminUserId && userId === this.adminUserId;
  }

  setupBotHandlers() {
    this.bot.on('message', async (msg) => {
      const userId = msg.from.id;
      const chatId = msg.chat.id;
      const text = msg.text;

      console.log(`Message from user ${userId}: ${text}`);

      if (!this.isAuthorizedUser(userId)) {
        await this.bot.sendMessage(chatId, '❌ You are not authorized to use this bot. Contact the administrator for access.');
        return;
      }

      if (text === '/start') {
        await this.handleStartCommand(chatId, userId);
      } else if (text === '/help') {
        await this.handleHelpCommand(chatId);
      }
    });

    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  async handleStartCommand(chatId, userId) {
    const isAdmin = this.isAdmin(userId);
    const welcomeMessage = `
🤖 *Schedule Nudge Bot*

Welcome! This bot sends weekly calendar updates to the admin every Sunday evening.

Your User ID: \`${userId}\`
${isAdmin ? 'Admin Status: ✅' : 'Admin Status: ❌'}

Available commands:
/help - Show available commands

${isAdmin ? 'You are the admin and will receive weekly calendar updates.' : 'Contact the administrator for any assistance.'}
    `;
    
    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }


  async handleHelpCommand(chatId) {
    const helpMessage = `
🤖 *Schedule Nudge Bot Commands*

*Available Commands:*
/start - Welcome message and status
/help - Show this help

*Features:*
• Weekly calendar updates sent to admin every Sunday at 6 PM UTC
• Automatic Google Calendar integration
• Formatted messages with event details

Need help? Contact your bot administrator.
    `;
    
    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }



  stopPolling() {
    this.bot.stopPolling();
  }

  async sendWeeklyUpdateToSubscribers(events, startDate = null, endDate = null) {
    const message = this.formatWeeklyMessage(events, startDate, endDate);
    let successCount = 0;
    let errorCount = 0;

    if (!this.adminUserId) {
      console.error('No admin user configured - cannot send weekly update');
      return { successCount: 0, errorCount: 1 };
    }

    console.log(`Sending weekly update to admin user ${this.adminUserId}`);

    try {
      await this.bot.sendMessage(this.adminUserId, message, { parse_mode: 'Markdown' });
      successCount++;
      console.log(`Weekly update sent to admin user ${this.adminUserId}`);
    } catch (error) {
      errorCount++;
      console.error(`Error sending to admin user ${this.adminUserId}:`, error.message);
      console.error('Full error details:', error);
    }

    console.log(`Weekly update summary: ${successCount} sent, ${errorCount} failed`);
    return { successCount, errorCount };
  }

  async testTelegramConnection() {
    try {
      const me = await this.bot.getMe();
      console.log(`Telegram bot connection test successful: ${me.username}`);
      return true;
    } catch (error) {
      console.error('Telegram bot connection test failed:', error);
      return false;
    }
  }

  formatWeeklyMessage(events, startDate, endDate) {
    const weekDateRange = this.formatWeekDateRange(startDate, endDate);

    if (events.length === 0) {
      return `📅 *Weekly Schedule Update*\n${weekDateRange}\n\nYou have no events scheduled for the upcoming week. Enjoy your free time! 🎉`;
    }

    let message = `📅 *Weekly Schedule Update*\n${weekDateRange}\n\nHere's what you have coming up this week:\n\n`;
    
    const eventsByDay = this.groupEventsByDay(events);
    
    Object.keys(eventsByDay).forEach(day => {
      message += `*${day}*\n`;
      eventsByDay[day].forEach(event => {
        const time = this.formatEventTime(event);
        message += `• ${time} - ${event.summary}\n`;
        if (event.location) {
          message += `  📍 ${event.location}\n`;
        }
      });
      message += '\n';
    });

    message += `Have a productive week ahead! 💪`;
    return message;
  }

  groupEventsByDay(events) {
    const grouped = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    events.forEach(event => {
      // Parse date in Singapore timezone to get correct day
      const startDateTime = event.start.dateTime || event.start.date;
      const luxonDate = DateTime.fromISO(startDateTime).setZone('Asia/Singapore');
      const dayName = luxonDate.weekdayLong;
      
      if (!grouped[dayName]) {
        grouped[dayName] = [];
      }
      grouped[dayName].push(event);
    });

    // Sort events within each day: all-day events first, then timed events by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const aIsAllDay = !!a.start.date;
        const bIsAllDay = !!b.start.date;
        
        // All-day events come first
        if (aIsAllDay && !bIsAllDay) return -1;
        if (!aIsAllDay && bIsAllDay) return 1;
        
        // If both are all-day or both are timed, sort by start time in Singapore timezone
        const aStart = DateTime.fromISO(a.start.dateTime || a.start.date).setZone('Asia/Singapore');
        const bStart = DateTime.fromISO(b.start.dateTime || b.start.date).setZone('Asia/Singapore');
        return aStart.toMillis() - bStart.toMillis();
      });
    });

    return grouped;
  }

  formatEventTime(event) {
    if (event.start.date) {
      return 'All day';
    }
    
    // Parse and format times in Singapore timezone
    const startTime = DateTime.fromISO(event.start.dateTime)
      .setZone('Asia/Singapore')
      .toFormat('h:mm a');
    
    const endTime = DateTime.fromISO(event.end.dateTime)
      .setZone('Asia/Singapore')
      .toFormat('h:mm a');
    
    return `${startTime} - ${endTime}`;
  }

  formatWeekDateRange(startDate, endDate) {
    const options = { month: 'short', day: 'numeric' };
    const startFormatted = startDate.toLocaleDateString('en-SG', options);
    const endFormatted = endDate.toLocaleDateString('en-SG', options);
    
    // If same year, show year only once at the end
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    if (startYear === endYear) {
      return `*${startFormatted} - ${endFormatted}, ${endYear}*`;
    } else {
      return `*${startFormatted}, ${startYear} - ${endFormatted}, ${endYear}*`;
    }
  }
}

module.exports = TelegramBotService;