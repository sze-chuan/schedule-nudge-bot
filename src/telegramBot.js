const TelegramBot = require('node-telegram-bot-api');

class TelegramBotService {
  constructor(token, chatId) {
    this.bot = new TelegramBot(token, { polling: false });
    this.chatId = chatId;
  }

  async sendMessage(message) {
    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
      console.log('Weekly update sent successfully');
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  async sendWeeklyUpdate(events) {
    const message = this.formatWeeklyMessage(events);
    await this.sendMessage(message);
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
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
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
    
    const startTime = new Date(event.start.dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const endTime = new Date(event.end.dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${startTime} - ${endTime}`;
  }
}

module.exports = TelegramBotService;