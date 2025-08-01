# Google Service Account Setup Guide

This guide explains how to set up Google Calendar access using Service Accounts.

## Why Service Account Only?

**Service Account Benefits:**
- ✅ No token expiration issues
- ✅ No manual refresh token generation
- ✅ Perfect for server-to-server automation
- ✅ More secure for production use
- ✅ Simpler, cleaner setup process
- ✅ Better error handling and diagnostics

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your project ID

### 2. Enable Google Calendar API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

### 3. Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in details:
   - **Service account name**: `schedule-nudge-bot`
   - **Service account ID**: Will auto-generate
   - **Description**: `Service account for Schedule Nudge Bot`
4. Click **Create and Continue**
5. Skip role assignment (not needed for calendar access)
6. Click **Done**

### 4. Generate Service Account Key

1. In **Credentials** page, find your service account
2. Click on the service account email
3. Go to **Keys** tab
4. Click **Add Key** → **Create new key**
5. Choose **JSON** format
6. Click **Create**
7. A JSON file will download - **keep this secure!**

### 5. Share Calendar with Service Account

**Option A: Share Existing Calendar (Recommended)**
1. Open [Google Calendar](https://calendar.google.com)
2. Find your calendar in the left sidebar
3. Click the three dots → **Settings and sharing**
4. Under **Share with specific people**, click **Add people**
5. Enter the service account email (from the JSON file)
6. Set permission to **See all event details**
7. Click **Send**

**Option B: Use Domain-Wide Delegation (G Suite/Workspace)**
1. In Google Cloud Console, go to your service account
2. Check **Enable Google Workspace Domain-wide Delegation**
3. In Google Admin Console, add the service account
4. Set calendar scope: `https://www.googleapis.com/auth/calendar.readonly`

### 6. Configure GitHub Secrets

Add these secrets to your GitHub repository:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Contents of the JSON file | The entire JSON key file as a string |
| `CALENDAR_ID` | Calendar ID | Usually "primary" or specific calendar ID |
| `GOOGLE_CALENDAR_OWNER_EMAIL` | your-email@gmail.com | (Optional) Only for domain delegation |

### 7. Get Calendar ID (if not using "primary")

1. Open [Google Calendar](https://calendar.google.com)
2. Go to **Settings** → **Settings for my calendars**
3. Select your calendar
4. Scroll down to **Calendar ID**
5. Copy the calendar ID (looks like: `abc123@group.calendar.google.com`)

## Configuration Examples

### Method 1: Shared Calendar (Recommended)
```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project"...}
CALENDAR_ID=primary
# GOOGLE_CALENDAR_OWNER_EMAIL not needed
```

### Method 2: Domain-Wide Delegation
```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project"...}
GOOGLE_CALENDAR_OWNER_EMAIL=calendar-owner@yourdomain.com
CALENDAR_ID=primary
```

### Method 3: Specific Calendar
```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project"...}
CALENDAR_ID=abc123@group.calendar.google.com
```

## Setting GitHub Secrets

1. Go to your repository on GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. For `GOOGLE_SERVICE_ACCOUNT_KEY`:
   - Name: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: Paste the entire contents of your JSON key file

## Troubleshooting

### "Service Account key is required" Error
- Make sure `GOOGLE_SERVICE_ACCOUNT_KEY` is set in GitHub secrets
- Verify the JSON is properly formatted and complete

### "Calendar not found" Error
- Make sure the calendar is shared with the service account
- Verify the `CALENDAR_ID` is correct
- Check that the service account email has calendar access

### "Access denied" Error
- Ensure Google Calendar API is enabled in your project
- Verify the service account has the correct permissions
- Check that the JSON key is valid and not expired

### "Invalid credentials" Error
- Make sure the JSON key is properly formatted in the GitHub secret
- Verify the service account exists and is active
- Check that the project ID matches

## Security Best Practices

1. **Secure the JSON Key**: Never commit the key file to your repository
2. **Minimum Permissions**: Only grant calendar read access
3. **Regular Rotation**: Consider rotating service account keys periodically
4. **Monitor Usage**: Check Google Cloud Console for API usage
5. **Restrict Access**: Only share calendars that the bot needs to read

## Testing

To test your service account setup:

1. Configure the secrets in GitHub
2. Run the workflow manually
3. Check the logs for connection success
4. Verify that calendar events are being fetched

The logs should show: `Google Calendar connection successful - Connected to: [Calendar Name]`