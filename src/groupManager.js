class GroupManager {
  constructor() {
    this.groups = new Map();
    this.loadGroupMappings();
  }

  loadGroupMappings() {
    try {
      if (process.env.GROUP_CALENDAR_MAPPINGS) {
        const decodedData = Buffer.from(process.env.GROUP_CALENDAR_MAPPINGS, 'base64').toString();
        const data = JSON.parse(decodedData);
        
        if (data.groups && Array.isArray(data.groups)) {
          data.groups.forEach(group => {
            this.groups.set(group.groupId.toString(), {
              groupId: group.groupId,
              calendarId: group.calendarId,
              groupName: group.groupName || 'Unknown Group'
            });
          });
          console.log(`Loaded ${this.groups.size} group-calendar mappings`);
        }
      } else {
        console.log('No group mappings found in environment variables');
      }
    } catch (error) {
      console.error('Error loading group mappings:', error.message);
      this.groups = new Map();
    }
  }

  getGroupCalendar(groupId) {
    const groupIdStr = groupId.toString();
    const group = this.groups.get(groupIdStr);
    return group ? group.calendarId : null;
  }

  getAllGroups() {
    return Array.from(this.groups.values());
  }

  hasGroup(groupId) {
    return this.groups.has(groupId.toString());
  }

  getGroupInfo(groupId) {
    return this.groups.get(groupId.toString()) || null;
  }

  addGroup(groupId, calendarId, groupName = 'Unknown Group') {
    const groupIdStr = groupId.toString();
    const groupData = {
      groupId: parseInt(groupId),
      calendarId,
      groupName
    };
    
    this.groups.set(groupIdStr, groupData);
    return groupData;
  }

  removeGroup(groupId) {
    const groupIdStr = groupId.toString();
    const existed = this.groups.has(groupIdStr);
    this.groups.delete(groupIdStr);
    return existed;
  }

  updateGroupCalendar(groupId, calendarId) {
    const groupIdStr = groupId.toString();
    const group = this.groups.get(groupIdStr);
    
    if (group) {
      group.calendarId = calendarId;
      this.groups.set(groupIdStr, group);
      return true;
    }
    return false;
  }

  generateBase64Config() {
    const config = {
      groups: Array.from(this.groups.values())
    };
    
    const jsonString = JSON.stringify(config, null, 2);
    const base64String = Buffer.from(jsonString).toString('base64');
    
    return {
      json: jsonString,
      base64: base64String,
      groupCount: this.groups.size
    };
  }

  validateCalendarId(calendarId) {
    if (!calendarId || typeof calendarId !== 'string') {
      return false;
    }
    
    // Basic validation for calendar ID format
    // Can be email format or 'primary'
    if (calendarId === 'primary') {
      return true;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(calendarId);
  }

  getGroupsForCalendar(calendarId) {
    return Array.from(this.groups.values()).filter(group => group.calendarId === calendarId);
  }

  isGroupChat(chatId) {
    // Telegram group chat IDs are negative
    return chatId < 0;
  }

  isPrivateChat(chatId) {
    // Telegram private chat IDs are positive
    return chatId > 0;
  }
}

module.exports = GroupManager;