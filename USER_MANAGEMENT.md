# User Management Guide

This guide explains how to manage users and subscriptions for the Schedule Nudge Bot.

## User Access Levels

### 1. Unauthorized Users
- Cannot interact with the bot
- Receive "not authorized" message when trying to use commands
- Need to be added to `ALLOWED_USER_IDS` by admin

### 2. Authorized Users
- Can interact with the bot and use basic commands
- Must subscribe to receive weekly updates
- Can manage their own subscription status

### 3. Admin User
- Has all authorized user permissions
- Can manage other users' access
- Can view user statistics
- Set via `ADMIN_USER_ID` environment variable

## Getting User IDs

To add users to the bot, you need their Telegram user ID:

### Method 1: Direct from Bot
1. Have the user start a conversation with your bot
2. User sends `/start` command
3. Bot displays their user ID in the welcome message

### Method 2: Telegram API
1. Have users message your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find the user's ID in the JSON response under `"from":{"id":123456789}`

## User Commands

### Basic Commands (All authorized users)
- `/start` - Show welcome message and user ID
- `/help` - Display available commands
- `/subscribe` - Subscribe to weekly calendar updates
- `/unsubscribe` - Unsubscribe from weekly updates
- `/status` - Check current subscription status

### Admin Commands (Admin user only)
- `/users` - Display user statistics and subscriber list
- `/add_user <user_id>` - Add a user to the authorized list
- `/remove_user <user_id>` - Remove a user from authorized list

## Managing Users

### Adding New Users
1. Get the user's Telegram user ID (see methods above)
2. As admin, send: `/add_user 123456789`
3. User can now interact with the bot
4. User must still `/subscribe` to receive weekly updates

### Removing Users
1. As admin, send: `/remove_user 123456789`
2. User is removed from authorized list
3. User is automatically unsubscribed
4. User can no longer interact with the bot

### Bulk User Management
To add multiple users at once, update the `ALLOWED_USER_IDS` GitHub secret:
1. Go to repository Settings → Secrets and variables → Actions
2. Edit `ALLOWED_USER_IDS` 
3. Add comma-separated user IDs: `123456789,987654321,555555555`

## Subscription Management

Users control their own subscriptions:
- New authorized users are automatically subscribed
- Users can `/unsubscribe` and `/subscribe` as needed
- Only subscribed users receive weekly updates
- Subscription status persists during bot restarts

## Error Handling

The bot automatically handles common issues:
- **Blocked users**: Automatically removed from subscription list
- **Invalid chat IDs**: Logged and skipped during broadcasts  
- **Network errors**: Logged with retry on next scheduled run

## Best Practices

1. **Start with yourself**: Add your own user ID first as admin
2. **Test access**: Have new users try `/start` to confirm authorization
3. **Monitor logs**: Check GitHub Actions logs for delivery issues
4. **Secure user IDs**: Treat user IDs as sensitive information
5. **Regular cleanup**: Periodically review authorized user list

## Example Workflow

1. **Initial Setup**:
   - Set `ADMIN_USER_ID` to your user ID
   - Set `ALLOWED_USER_IDS` to include yourself and initial users

2. **Adding Team Members**:
   - Team member messages the bot
   - Bot shows "not authorized" message with their user ID
   - You add them with `/add_user <their_id>`
   - They can now `/subscribe` for updates

3. **Managing Subscriptions**:
   - Use `/users` to see who's subscribed
   - Users manage their own subscription status
   - Weekly updates only go to subscribed users

## Troubleshooting

**User says they're not receiving updates:**
1. Check if they're authorized: `/users` 
2. Check if they're subscribed: Ask them to check `/status`
3. Check GitHub Actions logs for delivery errors

**User can't interact with bot:**
1. Confirm their user ID is in `ALLOWED_USER_IDS`
2. Check for typos in the user ID
3. Verify the GitHub secret is updated correctly

**Admin commands not working:**
1. Confirm `ADMIN_USER_ID` matches your user ID exactly
2. Try `/start` to see your actual user ID
3. Update the GitHub secret if needed