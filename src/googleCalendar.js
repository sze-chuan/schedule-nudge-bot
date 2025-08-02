const { google } = require('googleapis');

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
      const now = new Date();
      // Add a day since the github action will be triggered on Sunday 
      // and we want to see the events for the following week
      now.setDate(now.getDate() + 1); 
      const startOfWeek = this.getStartOfWeek(now);
      const endOfWeek = this.getEndOfWeek(startOfWeek);

      console.log(`Fetching events from ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`);

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startOfWeek.toISOString(),
        timeMax: endOfWeek.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: this.timezone
      });

      const events = response.data.items || [];
      console.log(`Found ${events.length} events for the week`);
      
      return {
        events: events.filter(event => !event.cancelled),
        startDate: startOfWeek,
        endDate: endOfWeek
      };
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  getStartOfWeek(date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? 0 : 1); // Monday as start of week
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  getEndOfWeek(startOfWeek) {
    const end = new Date(startOfWeek);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
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