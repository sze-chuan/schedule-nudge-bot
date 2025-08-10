/**
 * Utility functions for sanitized logging
 * Redacts sensitive IDs from log messages to prevent exposure in GitHub Actions logs
 */

/**
 * Sanitizes a numeric ID for logging (shows only last 3 digits)
 * @param {number|string} id - The ID to sanitize (user ID, group ID, etc.)
 * @returns {string} Sanitized ID
 */
function sanitizeId(id) {
  if (!id) return 'undefined';
  const idStr = id.toString();
  if (idStr.length <= 3) return '*'.repeat(idStr.length);
  return '*'.repeat(idStr.length - 3) + idStr.slice(-3);
}

/**
 * Sanitizes a calendar ID for logging (shows domain but hides local part)
 * @param {string} calendarId - The calendar ID to sanitize
 * @returns {string} Sanitized calendar ID
 */
function sanitizeCalendarId(calendarId) {
  if (!calendarId) return 'undefined';
  if (calendarId === 'primary') return 'primary';
  
  const atIndex = calendarId.indexOf('@');
  if (atIndex === -1) {
    // Not an email format, just show last few chars
    if (calendarId.length <= 3) return '*'.repeat(calendarId.length);
    return '*'.repeat(calendarId.length - 3) + calendarId.slice(-3);
  }
  
  const localPart = calendarId.substring(0, atIndex);
  const domain = calendarId.substring(atIndex);
  
  if (localPart.length <= 2) {
    return '*'.repeat(localPart.length) + domain;
  } else {
    return localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.slice(-1) + domain;
  }
}

module.exports = {
  sanitizeId,
  sanitizeCalendarId
};