/**
 * Check if a user has permission based on their roles
 * @param {Message} message - Discord message object
 * @param {string[]} allowedRoleIds - Array of role IDs that have permission
 * @returns {boolean} - True if user has permission, false otherwise
 */
function hasPermission(message, allowedRoleIds) {
    // Bot owner bypass (you can add your user ID here for testing)
    // if (message.author.id === 'YOUR_USER_ID') return true;
    
    // Check if user is in a guild
    if (!message.guild || !message.member) {
        return false;
    }

    // Get user's role IDs
    const userRoleIds = message.member.roles.cache.map(role => role.id);
    
    // Check if user has any of the allowed roles
    return allowedRoleIds.some(roleId => userRoleIds.includes(roleId));
}

/**
 * Get user's permission level based on their roles
 * @param {GuildMember} member - Discord guild member object
 * @returns {string} - Permission level: 'owner', 'mod', 'jr_mod', 'staff', 'member'
 */
function getPermissionLevel(member) {
    if (!member) return 'member';
    
    const userRoleIds = member.roles.cache.map(role => role.id);
    
    // Owner
    if (userRoleIds.includes('1369700079719420015')) return 'owner';
    
    // Co-Owner
    if (userRoleIds.includes('1375554327988670514')) return 'co_owner';
    
    // Moderator
    if (userRoleIds.includes('1369699803121848371')) return 'moderator';
    
    // Jr Moderator
    if (userRoleIds.includes('1373967179988598815')) return 'jr_moderator';
    
    // Nivaan Staff
    if (userRoleIds.includes('1370083070811570257')) return 'staff';
    
    return 'member';
}

/**
 * Check if user can use a specific command
 * @param {GuildMember} member - Discord guild member object
 * @param {string} command - Command name
 * @returns {boolean} - True if user can use the command
 */
function canUseCommand(member, command) {
    const level = getPermissionLevel(member);
    
    const commandPermissions = {
        // Full moderation commands
        'ban': ['owner', 'co_owner', 'moderator'],
        'kick': ['owner', 'co_owner', 'moderator'],
        'unban': ['owner', 'co_owner', 'moderator'],
        
        // Jr Mod + Full Mod commands
        'warn': ['owner', 'co_owner', 'moderator', 'jr_moderator', 'staff'],
        'warnings': ['owner', 'co_owner', 'moderator', 'jr_moderator'],
        'clearwarn': ['owner', 'co_owner', 'moderator', 'jr_moderator'],
        'mute': ['owner', 'co_owner', 'moderator', 'jr_moderator'],
        
        // Staff only commands (Nivaan Staff can only warn)
        // All other commands are available to everyone
        'userinfo': ['owner', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member'],
        'serverinfo': ['owner', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member'],
        'help': ['owner', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member'],
        'commands': ['owner', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member'],
        'report': ['owner', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member']
    };
    
    const allowedLevels = commandPermissions[command];
    if (!allowedLevels) return true; // Command not restricted
    
    return allowedLevels.includes(level);
}

module.exports = {
    hasPermission,
    getPermissionLevel,
    canUseCommand
};
