const { google } = require('googleapis');
const { DateTime } = require('luxon');

class GoogleCalendarService {
  constructor(config) {
    if (!config.serviceAccountKey) {
      throw new Error('Service Account key is required. OAuth is no longer supported.');
    }

    const serviceAccount = JSON.parse(config.serviceAccountKey);
    
    this.auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });
    
    // If calendar owner email is provided, use domain-wide delegation
    if (config.calendarOwnerEmail) {
      this.auth = new google.auth.JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        subject: config.calendarOwnerEmail
      });
    }
    
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    this.calendarId = config.calendarId || 'primary';
    this.timezone = config.timezone || 'America/New_York';
  }

  async getWeeklyEvents() {
    // Use default calendar for backward compatibility
    return this.getWeeklyEventsForCalendar(this.calendarId);
  }

  async getWeeklyEventsForCalendar(calendarId) {
    try {
      const now = DateTime.now().setZone('Asia/Singapore');
      // Get next week's events (add 7 days to get next week)
      const nextWeek = now.plus({ days: 7 });
      const startOfWeek = this.getStartOfWeek(nextWeek);
      const endOfWeek = this.getEndOfWeek(startOfWeek);

      console.log(`Fetching events from ${startOfWeek.toISO()} to ${endOfWeek.toISO()} for calendar: ${calendarId}`);

      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: startOfWeek.toISO(),
        timeMax: endOfWeek.toISO(),
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'Asia/Singapore'
      });

      const events = response.data.items || [];
      console.log(`Found ${events.length} events for calendar ${calendarId}`);
      
      return {
        events: events.filter(event => !event.cancelled),
        startDate: startOfWeek.toJSDate(),
        endDate: endOfWeek.toJSDate(),
        calendarId: calendarId
      };
    } catch (error) {
      console.error(`Error fetching calendar events for ${calendarId}:`, error);
      throw error;
    }
  }

  async getWeeklyEventsForMultipleCalendars(calendarIds) {
    const results = [];
    const errors = [];

    for (const calendarId of calendarIds) {
      try {
        const weeklyData = await this.getWeeklyEventsForCalendar(calendarId);
        results.push(weeklyData);
      } catch (error) {
        console.error(`Failed to fetch events for calendar ${calendarId}:`, error.message);
        errors.push({
          calendarId,
          error: error.message
        });
      }
    }

    return {
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  getStartOfWeek(dateTime) {
    // Get Monday of the current week in Singapore timezone
    return dateTime.startOf('week').startOf('day');
  }

  getEndOfWeek(startOfWeek) {
    // Get Sunday (end of week) at 23:59:59.999
    return startOfWeek.plus({ days: 6 }).endOf('day');
  }

  async testConnection() {
    try {
      // For service accounts, test by getting calendar info
      const response = await this.calendar.calendars.get({
        calendarId: this.calendarId
      });
      console.log(`Google Calendar connection successful - Connected to: ${response.data.summary}`);
      return true;
    } catch (error) {
      console.error('Google Calendar connection failed:', error.message);
      
      // Provide helpful error messages
      if (error.code === 404) {
        console.error('Calendar not found. Make sure the calendar is shared with the service account or calendar ID is correct.');
      } else if (error.code === 403) {
        console.error('Access denied. Make sure the service account has calendar access.');
      }
      
      return false;
    }
  }
}

module.exports = GoogleCalendarService;