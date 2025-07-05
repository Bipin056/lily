/**
 * Check if a user has permission based on their roles
 */
function hasPermission(message, allowedRoleIds) {
    if (!message.guild || !message.member) return false;
    const userRoleIds = message.member.roles.cache.map(role => role.id);
    return allowedRoleIds.some(roleId => userRoleIds.includes(roleId));
}

/**
 * Get user's permission level based on their roles
 */
function getPermissionLevel(member) {
    if (!member) return 'member';

    const userRoleIds = member.roles.cache.map(role => role.id);

    // 🦚 Nirmaata (Actual owner now)
    if (userRoleIds.includes('1378982362355859498')) return 'nirmaata';

    if (userRoleIds.includes('1375554327988670514')) return 'co_owner';
    if (userRoleIds.includes('1369699803121848371')) return 'moderator';
    if (userRoleIds.includes('1373967179988598815')) return 'jr_moderator';
    if (userRoleIds.includes('1370083070811570257')) return 'staff';

    return 'member';
}

/**
 * Check if user can use a specific command
 */
function canUseCommand(member, command) {
    const level = getPermissionLevel(member);

    const commandPermissions = {
        'ban': ['nirmaata', 'co_owner', 'moderator'],
        'kick': ['nirmaata', 'co_owner', 'moderator'],
        'unban': ['nirmaata', 'co_owner', 'moderator'],

        'warn': ['nirmaata', 'co_owner', 'moderator', 'jr_moderator', 'staff'],
        'warnings': ['nirmaata', 'co_owner', 'moderator', 'jr_moderator'],
        'clearwarn': ['nirmaata', 'co_owner', 'moderator', 'jr_moderator'],
        'mute': ['nirmaata', 'co_owner', 'moderator', 'jr_moderator'],

        'userinfo': ['nirmaata', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member'],
        'serverinfo': ['nirmaata', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member'],
        'help': ['nirmaata', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member'],
        'commands': ['nirmaata', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member'],
        'report': ['nirmaata', 'co_owner', 'moderator', 'jr_moderator', 'staff', 'member']
    };

    const allowedLevels = commandPermissions[command];
    if (!allowedLevels) return true;

    return allowedLevels.includes(level);
}

module.exports = {
    hasPermission,
    getPermissionLevel,
    canUseCommand
};
