const TelegramBot = require('node-telegram-bot-api');
const { DateTime } = require('luxon');
const GroupManager = require('./groupManager');

class TelegramBotService {
  constructor(token, adminUserId = null, interactiveMode = false) {
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
    this.adminUserId = adminUserId ? parseInt(adminUserId) : null;
    this.interactiveMode = interactiveMode;
    this.groupManager = new GroupManager();
    
    // Setup handlers for interactive mode
    if (interactiveMode) {
      this.setupBotHandlers();
    }
  }


  isAdmin(userId) {
    return this.adminUserId && userId === this.adminUserId;
  }

  getGroupManager() {
    return this.groupManager;
  }

  setupBotHandlers() {
    this.bot.on('message', async (msg) => {
      const userId = msg.from.id;
      const chatId = msg.chat.id;
      const text = msg.text;

      // Skip non-text messages
      if (!text) {
        console.log(`Non-text message from user ${userId} (type: ${msg.type || 'unknown'})`);
        return;
      }

      console.log(`Message from user ${userId}: ${text}`);

      if (!this.isAdmin(userId)) {
        await this.bot.sendMessage(chatId, '❌ Only the admin can use this bot.');
        return;
      }

      if (text === '/start') {
        await this.handleStartCommand(chatId, userId);
      } else if (text === '/help') {
        await this.handleHelpCommand(chatId);
      } else if (text.startsWith('/addcalendar')) {
        await this.handleAddCalendarCommand(chatId, userId, text);
      } else if (text === '/removecalendar') {
        await this.handleRemoveCalendarCommand(chatId, userId);
      } else if (text === '/listgroups') {
        await this.handleListGroupsCommand(chatId, userId);
      } else if (text === '/groupinfo') {
        await this.handleGroupInfoCommand(chatId, userId);
      }
    });

    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  async handleStartCommand(chatId, userId) {
    const isAdmin = this.isAdmin(userId);
    const isGroupChat = this.groupManager.isGroupChat(chatId);
    const totalGroups = this.groupManager.getAllGroups().length;
    
    let groupStatus = '';
    if (isGroupChat) {
      const groupInfo = this.groupManager.getGroupInfo(chatId);
      groupStatus = groupInfo 
        ? `\n📅 Calendar: \`${groupInfo.calendarId}\``
        : '\n❌ No calendar assigned to this group';
    }
    
    const welcomeMessage = `
🤖 *Schedule Nudge Bot*

Welcome! This bot sends weekly calendar updates to configured groups every Sunday evening.

Your User ID: \`${userId}\`
${isAdmin ? 'Admin Status: ✅' : 'Admin Status: ❌'}
${isGroupChat ? `Group ID: \`${chatId}\`${groupStatus}` : ''}

📊 *Status:* ${totalGroups} configured groups

Available commands:
/help - Show available commands

${isAdmin ? (isGroupChat ? 'Use group commands to manage calendar assignments.' : 'You are the admin and will receive debug messages for all groups.') : 'Contact the administrator for any assistance.'}
    `;
    
    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }


  async handleHelpCommand(chatId) {
    const helpMessage = `
🤖 *Schedule Nudge Bot Commands*

*Available Commands:*
/start - Welcome message and status
/help - Show this help
/addcalendar <calendar_id> - Assign calendar to current group
/removecalendar - Remove calendar from current group
/listgroups - Show all configured groups
/groupinfo - Show current group information

*Features:*
• Weekly calendar updates sent to configured groups every Sunday at 6 PM UTC
• Group-specific Google Calendar integration
• Formatted messages with event details
• Admin debugging messages for all groups

Need help? Contact your bot administrator.
    `;
    
    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  async handleAddCalendarCommand(chatId, userId, text) {
    const parts = text.split(' ');
    
    if (parts.length !== 2) {
      await this.bot.sendMessage(chatId, '❌ Usage: `/addcalendar <calendar_id>`\n\nExample: `/addcalendar primary` or `/addcalendar calendar@example.com`', { parse_mode: 'Markdown' });
      return;
    }
    
    const calendarId = parts[1].trim();
    
    if (!this.groupManager.validateCalendarId(calendarId)) {
      await this.bot.sendMessage(chatId, '❌ Invalid calendar ID format. Use "primary" or a valid email address.', { parse_mode: 'Markdown' });
      return;
    }
    
    if (!this.groupManager.isGroupChat(chatId)) {
      await this.bot.sendMessage(chatId, '❌ This command can only be used in group chats.', { parse_mode: 'Markdown' });
      return;
    }
    
    try {
      const chat = await this.bot.getChat(chatId);
      const groupName = chat.title || 'Unknown Group';
      
      this.groupManager.addGroup(chatId, calendarId, groupName);
      
      const config = this.groupManager.generateBase64Config();
      
      const successMessage = `✅ *Calendar assigned successfully!*
      
*Group:* ${groupName}
*Group ID:* \`${chatId}\`
*Calendar ID:* \`${calendarId}\`

📋 *Update GitHub Secrets:*
Copy this Base64 string and update the \`GROUP_CALENDAR_MAPPINGS\` environment variable in your GitHub repository secrets:

\`\`\`
${config.base64}
\`\`\`

*Total configured groups:* ${config.groupCount}`;
      
      await this.bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
      
      // Also send to admin for debugging
      if (this.adminUserId && chatId !== this.adminUserId) {
        await this.bot.sendMessage(this.adminUserId, `🔧 *Admin Debug:* Calendar assigned to group "${groupName}" (${chatId})`, { parse_mode: 'Markdown' });
      }
      
    } catch (error) {
      console.error('Error in addCalendarCommand:', error);
      await this.bot.sendMessage(chatId, '❌ Error assigning calendar. Please try again.', { parse_mode: 'Markdown' });
    }
  }

  async handleRemoveCalendarCommand(chatId, userId) {
    if (!this.groupManager.isGroupChat(chatId)) {
      await this.bot.sendMessage(chatId, '❌ This command can only be used in group chats.', { parse_mode: 'Markdown' });
      return;
    }
    
    const existed = this.groupManager.removeGroup(chatId);
    
    if (!existed) {
      await this.bot.sendMessage(chatId, '❌ No calendar was assigned to this group.', { parse_mode: 'Markdown' });
      return;
    }
    
    const config = this.groupManager.generateBase64Config();
    
    const successMessage = `✅ *Calendar removed successfully!*

📋 *Update GitHub Secrets:*
Copy this Base64 string and update the \`GROUP_CALENDAR_MAPPINGS\` environment variable:

\`\`\`
${config.base64}
\`\`\`

*Total configured groups:* ${config.groupCount}`;
    
    await this.bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
    
    // Also send to admin for debugging
    if (this.adminUserId && chatId !== this.adminUserId) {
      await this.bot.sendMessage(this.adminUserId, `🔧 *Admin Debug:* Calendar removed from group (${chatId})`, { parse_mode: 'Markdown' });
    }
  }

  async handleListGroupsCommand(chatId, userId) {
    const groups = this.groupManager.getAllGroups();
    
    if (groups.length === 0) {
      await this.bot.sendMessage(chatId, '📋 No groups configured yet.\n\nUse `/addcalendar <calendar_id>` in a group chat to configure a calendar.', { parse_mode: 'Markdown' });
      return;
    }
    
    let message = `📋 *Configured Groups* (${groups.length})\n\n`;
    
    groups.forEach((group, index) => {
      message += `*${index + 1}.* ${group.groupName}\n`;
      message += `   📍 Group ID: \`${group.groupId}\`\n`;
      message += `   📅 Calendar: \`${group.calendarId}\`\n`;
      message += `   📝 Added: ${new Date(group.addedAt).toLocaleDateString()}\n\n`;
    });
    
    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  async handleGroupInfoCommand(chatId, userId) {
    if (!this.groupManager.isGroupChat(chatId)) {
      await this.bot.sendMessage(chatId, '❌ This command can only be used in group chats.', { parse_mode: 'Markdown' });
      return;
    }
    
    const groupInfo = this.groupManager.getGroupInfo(chatId);
    
    if (!groupInfo) {
      await this.bot.sendMessage(chatId, '❌ No calendar assigned to this group.\n\nUse `/addcalendar <calendar_id>` to assign a calendar.', { parse_mode: 'Markdown' });
      return;
    }
    
    try {
      const chat = await this.bot.getChat(chatId);
      
      const message = `ℹ️ *Group Information*

*Group Name:* ${chat.title || 'Unknown'}
*Group ID:* \`${chatId}\`
*Calendar ID:* \`${groupInfo.calendarId}\`
*Added:* ${new Date(groupInfo.addedAt).toLocaleDateString()}

This group will receive weekly calendar updates every Sunday at 6 PM UTC.`;
      
      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Error getting chat info:', error);
      await this.bot.sendMessage(chatId, '❌ Error retrieving group information.', { parse_mode: 'Markdown' });
    }
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