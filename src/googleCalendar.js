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
    try {
      const now = DateTime.now().setZone('Asia/Singapore');
      // Add a day since the github action will be triggered on Sunday 
      // and we want to see the events for the following week
      const startOfWeek = this.getStartOfWeek(now);
      const endOfWeek = this.getEndOfWeek(startOfWeek);

      console.log(`Fetching events from ${startOfWeek.toISO()} to ${endOfWeek.toISO()}`);

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startOfWeek.toISO(),
        timeMax: endOfWeek.toISO(),
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'Asia/Singapore'
      });

      const events = response.data.items || [];
      console.log(`Found ${events.length} events for the week`);
      
      return {
        events: events.filter(event => !event.cancelled),
        startDate: startOfWeek.toJSDate(),
        endDate: endOfWeek.toJSDate()
      };
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
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