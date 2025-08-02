const TelegramBot = require('node-telegram-bot-api');

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
    this.subscribedUsers = new Set(this.allowedUserIds);
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
      } else if (text === '/subscribe') {
        await this.handleSubscribeCommand(chatId, userId);
      } else if (text === '/unsubscribe') {
        await this.handleUnsubscribeCommand(chatId, userId);
      } else if (text === '/status') {
        await this.handleStatusCommand(chatId, userId);
      } else if (text === '/help') {
        await this.handleHelpCommand(chatId);
      } else if (text === '/users' && this.isAdmin(userId)) {
        await this.handleUsersCommand(chatId);
      } else if (text.startsWith('/add_user') && this.isAdmin(userId)) {
        await this.handleAddUserCommand(chatId, text);
      } else if (text.startsWith('/remove_user') && this.isAdmin(userId)) {
        await this.handleRemoveUserCommand(chatId, text);
      }
    });

    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  async handleStartCommand(chatId, userId) {
    const welcomeMessage = `
🤖 *Schedule Nudge Bot*

Welcome! I can send you weekly calendar updates every Sunday evening.

Your User ID: \`${userId}\`

Available commands:
/subscribe - Subscribe to weekly updates
/unsubscribe - Unsubscribe from updates  
/status - Check your subscription status
/help - Show this help message

To get started, use /subscribe to receive weekly calendar updates.
    `;
    
    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  async handleSubscribeCommand(chatId, userId) {
    this.subscribedUsers.add(userId);
    await this.bot.sendMessage(chatId, '✅ You have been subscribed to weekly calendar updates!');
  }

  async handleUnsubscribeCommand(chatId, userId) {
    this.subscribedUsers.delete(userId);
    await this.bot.sendMessage(chatId, '❌ You have been unsubscribed from weekly calendar updates.');
  }

  async handleStatusCommand(chatId, userId) {
    const isSubscribed = this.subscribedUsers.has(userId);
    const status = isSubscribed ? '✅ Subscribed' : '❌ Not subscribed';
    await this.bot.sendMessage(chatId, `Your status: ${status}`);
  }

  async handleHelpCommand(chatId) {
    const helpMessage = `
🤖 *Schedule Nudge Bot Commands*

*User Commands:*
/start - Welcome message and setup
/subscribe - Subscribe to weekly updates
/unsubscribe - Unsubscribe from updates
/status - Check subscription status
/help - Show this help

*Features:*
• Weekly calendar updates every Sunday at 6 PM
• Automatic Google Calendar integration
• Formatted messages with event details

Need help? Contact your bot administrator.
    `;
    
    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  async handleUsersCommand(chatId) {
    const authorizedCount = this.allowedUserIds.length;
    const subscribedCount = this.subscribedUsers.size;
    const subscribedList = Array.from(this.subscribedUsers).join(', ');
    
    const message = `
👥 *User Management*

Authorized users: ${authorizedCount}
Subscribed users: ${subscribedCount}
Subscribed user IDs: ${subscribedList || 'None'}

*Admin Commands:*
\`/add_user <user_id>\` - Add user to authorized list
\`/remove_user <user_id>\` - Remove user from authorized list
    `;
    
    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  async handleAddUserCommand(chatId, text) {
    const parts = text.split(' ');
    if (parts.length !== 2) {
      await this.bot.sendMessage(chatId, '❌ Usage: /add_user <user_id>');
      return;
    }
    
    const newUserId = parseInt(parts[1]);
    if (isNaN(newUserId)) {
      await this.bot.sendMessage(chatId, '❌ Invalid user ID. Must be a number.');
      return;
    }
    
    if (this.allowedUserIds.includes(newUserId)) {
      await this.bot.sendMessage(chatId, '⚠️ User is already authorized.');
      return;
    }
    
    this.allowedUserIds.push(newUserId);
    await this.bot.sendMessage(chatId, `✅ User ${newUserId} has been added to the authorized list.`);
  }

  async handleRemoveUserCommand(chatId, text) {
    const parts = text.split(' ');
    if (parts.length !== 2) {
      await this.bot.sendMessage(chatId, '❌ Usage: /remove_user <user_id>');
      return;
    }
    
    const userIdToRemove = parseInt(parts[1]);
    if (isNaN(userIdToRemove)) {
      await this.bot.sendMessage(chatId, '❌ Invalid user ID. Must be a number.');
      return;
    }
    
    const index = this.allowedUserIds.indexOf(userIdToRemove);
    if (index === -1) {
      await this.bot.sendMessage(chatId, '⚠️ User is not in the authorized list.');
      return;
    }
    
    this.allowedUserIds.splice(index, 1);
    this.subscribedUsers.delete(userIdToRemove);
    await this.bot.sendMessage(chatId, `✅ User ${userIdToRemove} has been removed from the authorized list.`);
  }

  stopPolling() {
    this.bot.stopPolling();
  }

  async sendWeeklyUpdateToSubscribers(events) {
    const message = this.formatWeeklyMessage(events);
    let successCount = 0;
    let errorCount = 0;

    console.log(`Sending weekly update to ${this.subscribedUsers.size} subscribed users`);

    for (const userId of this.subscribedUsers) {
      try {
        await this.bot.sendMessage(userId, message, { parse_mode: 'Markdown' });
        successCount++;
        console.log(`Weekly update sent to user ${userId}`);
      } catch (error) {
        errorCount++;
        console.error(`Error sending to user ${userId}:`, error.message);
        console.error('Full error details:', error);
        
        // Remove user if they blocked the bot or chat doesn't exist
        if (error.response && [403, 400].includes(error.response.statusCode)) {
          console.log(`Removing user ${userId} from subscription (blocked bot or invalid chat)`);
          this.subscribedUsers.delete(userId);
        }
      }
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

  formatWeeklyMessage(events) {
    if (events.length === 0) {
      return `📅 *Weekly Schedule Update*\n\nYou have no events scheduled for the upcoming week. Enjoy your free time! 🎉`;
    }

    let message = `📅 *Weekly Schedule Update*\n\nHere's what you have coming up this week:\n\n`;
    
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
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    events.forEach(event => {
      const startDate = new Date(event.start.dateTime || event.start.date);
      const dayName = daysOfWeek[startDate.getDay()];
      
      if (!grouped[dayName]) {
        grouped[dayName] = [];
      }
      grouped[dayName].push(event);
    });

    return grouped;
  }

  formatEventTime(event) {
    if (event.start.date) {
      return 'All day';
    }
    
    const startTime = new Date(event.start.dateTime).toLocaleTimeString('en-SG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const endTime = new Date(event.end.dateTime).toLocaleTimeString('en-SG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${startTime} - ${endTime}`;
  }
}

module.exports = TelegramBotService;