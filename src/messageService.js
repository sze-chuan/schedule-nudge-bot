const { DateTime } = require('luxon');

class MessageService {
  constructor(bot, adminUserId, groupManager) {
    this.bot = bot;
    this.adminUserId = adminUserId;
    this.groupManager = groupManager;
  }

  async sendWeeklyUpdateToSubscribers(events, startDate = null, endDate = null) {
    // Backward compatibility: send to admin only (legacy behavior)
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

  async sendWeeklyUpdateToAllGroups(calendarResults) {
    const groups = this.groupManager.getAllGroups();
    let totalSuccessCount = 0;
    let totalErrorCount = 0;
    const deliveryDetails = [];

    if (groups.length === 0) {
      console.log('No groups configured - skipping group deliveries');
      return {
        successCount: 0,
        errorCount: 0,
        groupDeliveries: [],
        adminDeliveries: { sent: false, error: 'No groups configured' }
      };
    }

    console.log(`Sending weekly updates to ${groups.length} configured groups`);

    // Send to each group with their specific calendar events
    for (const group of groups) {
      const groupResult = await this.sendWeeklyUpdateToGroup(group, calendarResults);
      deliveryDetails.push(groupResult);
      
      if (groupResult.success) {
        totalSuccessCount++;
      } else {
        totalErrorCount++;
      }
    }

    // Send admin debugging summary
    const adminResult = await this.sendAdminDebuggingSummary(deliveryDetails, calendarResults);

    console.log(`Multi-group delivery completed: ${totalSuccessCount} groups succeeded, ${totalErrorCount} groups failed`);

    return {
      successCount: totalSuccessCount,
      errorCount: totalErrorCount,
      groupDeliveries: deliveryDetails,
      adminDeliveries: adminResult
    };
  }

  async sendWeeklyUpdateToGroup(group, calendarResults) {
    try {
      // Find calendar data for this group
      const calendarData = calendarResults.results.find(result => result.calendarId === group.calendarId);
      
      if (!calendarData) {
        const errorMsg = `No calendar data found for ${group.calendarId}`;
        console.error(`Group ${group.groupName} (${group.groupId}): ${errorMsg}`);
        return {
          groupId: group.groupId,
          groupName: group.groupName,
          calendarId: group.calendarId,
          success: false,
          error: errorMsg,
          eventCount: 0
        };
      }

      const message = this.formatWeeklyMessage(calendarData.events, calendarData.startDate, calendarData.endDate, group.groupName);
      
      console.log(`Sending update to group "${group.groupName}" (${group.groupId}) with ${calendarData.events.length} events`);

      await this.bot.sendMessage(group.groupId, message, { parse_mode: 'Markdown' });

      console.log(`✅ Successfully sent to group "${group.groupName}"`);

      return {
        groupId: group.groupId,
        groupName: group.groupName,
        calendarId: group.calendarId,
        success: true,
        eventCount: calendarData.events.length,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Failed to send to group "${group.groupName}" (${group.groupId}):`, error.message);
      
      return {
        groupId: group.groupId,
        groupName: group.groupName,
        calendarId: group.calendarId,
        success: false,
        error: error.message,
        eventCount: 0
      };
    }
  }

  async sendAdminDebuggingSummary(deliveryDetails, calendarResults) {
    if (!this.adminUserId) {
      console.log('No admin user configured - skipping admin debugging summary');
      return { sent: false, error: 'No admin user configured' };
    }

    try {
      let debugMessage = `🔧 *Admin Debug: Weekly Update Summary*\n\n`;
      
      // Calendar fetch summary
      debugMessage += `📅 *Calendar Fetch Results:*\n`;
      debugMessage += `• ${calendarResults.successCount} calendars fetched successfully\n`;
      debugMessage += `• ${calendarResults.errorCount} calendars failed\n\n`;

      if (calendarResults.errors.length > 0) {
        debugMessage += `❌ *Calendar Errors:*\n`;
        calendarResults.errors.forEach(error => {
          debugMessage += `• ${error.calendarId}: ${error.error}\n`;
        });
        debugMessage += `\n`;
      }

      // Group delivery summary
      debugMessage += `📤 *Group Delivery Results:*\n`;
      const successfulDeliveries = deliveryDetails.filter(d => d.success);
      const failedDeliveries = deliveryDetails.filter(d => !d.success);

      debugMessage += `• ${successfulDeliveries.length} groups received updates\n`;
      debugMessage += `• ${failedDeliveries.length} groups failed\n\n`;

      if (successfulDeliveries.length > 0) {
        debugMessage += `✅ *Successful Deliveries:*\n`;
        successfulDeliveries.forEach(delivery => {
          debugMessage += `• ${delivery.groupName}: ${delivery.eventCount} events (${delivery.calendarId})\n`;
        });
        debugMessage += `\n`;
      }

      if (failedDeliveries.length > 0) {
        debugMessage += `❌ *Failed Deliveries:*\n`;
        failedDeliveries.forEach(delivery => {
          debugMessage += `• ${delivery.groupName}: ${delivery.error}\n`;
        });
        debugMessage += `\n`;
      }

      debugMessage += `⏰ *Summary completed at:* ${new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}`;

      await this.bot.sendMessage(this.adminUserId, debugMessage, { parse_mode: 'Markdown' });

      console.log(`📧 Admin debugging summary sent to ${this.adminUserId}`);

      return { 
        sent: true, 
        adminUserId: this.adminUserId,
        sentAt: new Date().toISOString() 
      };

    } catch (error) {
      console.error(`Failed to send admin debugging summary:`, error.message);
      return { 
        sent: false, 
        error: error.message,
        adminUserId: this.adminUserId 
      };
    }
  }

  formatWeeklyMessage(events, startDate, endDate, groupName = null) {
    const weekDateRange = this.formatWeekDateRange(startDate, endDate);
    const title = groupName ? `📅 *Weekly Schedule Update - ${groupName}*` : `📅 *Weekly Schedule Update*`;

    if (events.length === 0) {
      return `${title}\n${weekDateRange}\n\nYou have no events scheduled for the upcoming week. Enjoy your free time! 🎉`;
    }

    let message = `${title}\n${weekDateRange}\n\nHere's what you have coming up this week:\n\n`;
    
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

module.exports = MessageService;