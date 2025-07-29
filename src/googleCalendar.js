const { google } = require('googleapis');

class GoogleCalendarService {
  constructor(credentials) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );
    
    this.oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken
    });
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.calendarId = credentials.calendarId || 'primary';
    this.timezone = credentials.timezone || 'America/New_York';
  }

  async getWeeklyEvents() {
    try {
      const now = new Date();
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
      
      return events.filter(event => !event.cancelled);
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
      const response = await this.calendar.calendarList.list();
      console.log('Google Calendar connection successful');
      return true;
    } catch (error) {
      console.error('Google Calendar connection failed:', error);
      return false;
    }
  }
}

module.exports = GoogleCalendarService;