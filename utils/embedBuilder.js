const { EmbedBuilder } = require('discord.js');

// Professional color scheme
const COLORS = {
    PRIMARY: 0x7C3AED,      // Purple
    SUCCESS: 0x10B981,      // Emerald
    ERROR: 0xEF4444,        // Red
    WARNING: 0xF59E0B,      // Amber
    INFO: 0x3B82F6,         // Blue
    SECONDARY: 0x6B7280,    // Gray
    ACCENT: 0xEC4899        // Pink
};

/**
 * Create a professional embed with consistent styling
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {number} color - Embed color (hex)
 * @param {Object} options - Additional options
 * @returns {EmbedBuilder} - Configured embed
 */
function createEmbed(title, description, color = COLORS.PRIMARY, options = {}) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTimestamp()
        .setFooter({ 
            text: options.footer || 'Lily Moderation • Secure & Professional',
            iconURL: 'https://cdn.discordapp.com/attachments/1234567890/lily-icon.png'
        });

    if (title) {
        embed.setTitle(title);
    }

    if (description) {
        embed.setDescription(description);
    }

    if (options.thumbnail) {
        embed.setThumbnail(options.thumbnail);
    }

    if (options.image) {
        embed.setImage(options.image);
    }

    if (options.fields && Array.isArray(options.fields)) {
        embed.addFields(options.fields);
    }

    if (options.author) {
        embed.setAuthor(options.author);
    }

    return embed;
}

/**
 * Create a professional error embed
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 * @returns {EmbedBuilder} - Error embed
 */
function createErrorEmbed(message, options = {}) {
    return createEmbed(
        null,
        `🚫 **${options.title || 'Access Denied'}**\n\n${message}`,
        COLORS.ERROR,
        { 
            footer: 'Lily Security System • Error Handler',
            ...options 
        }
    );
}

/**
 * Create a professional success embed
 * @param {string} message - Success message
 * @param {Object} options - Additional options
 * @returns {EmbedBuilder} - Success embed
 */
function createSuccessEmbed(message, options = {}) {
    return createEmbed(
        null,
        `✅ **${options.title || 'Action Completed'}**\n\n${message}`,
        COLORS.SUCCESS,
        { 
            footer: 'Lily Moderation • Action Successful',
            ...options 
        }
    );
}

/**
 * Create a warning embed
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 * @returns {EmbedBuilder} - Warning embed
 */
function createWarningEmbed(message, options = {}) {
    return createEmbed(
        options.title || '⚠️ Warning',
        message,
        0xffa500,
        { footer: options.footer || 'Lily Bot • Warning' }
    );
}

/**
 * Create an info embed
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 * @returns {EmbedBuilder} - Info embed
 */
function createInfoEmbed(message, options = {}) {
    return createEmbed(
        options.title || 'ℹ️ Information',
        message,
        0x0099ff,
        { footer: options.footer || 'Lily Bot • Information' }
    );
}

/**
 * Create a professional moderation action embed
 * @param {string} action - Action type (ban, kick, warn, etc.)
 * @param {Object} target - Target user object
 * @param {Object} moderator - Moderator user object
 * @param {string} reason - Action reason
 * @param {Object} options - Additional options
 * @returns {EmbedBuilder} - Moderation embed
 */
function createModerationEmbed(action, target, moderator, reason, options = {}) {
    const actionConfig = {
        ban: { emoji: '🔨', color: COLORS.ERROR, title: 'Member Banned', severity: 'HIGH' },
        kick: { emoji: '👢', color: COLORS.WARNING, title: 'Member Kicked', severity: 'MEDIUM' },
        warn: { emoji: '⚠️', color: COLORS.WARNING, title: 'Warning Issued', severity: 'LOW' },
        mute: { emoji: '🔇', color: COLORS.WARNING, title: 'Member Muted', severity: 'MEDIUM' },
        unban: { emoji: '🔓', color: COLORS.SUCCESS, title: 'Member Unbanned', severity: 'INFO' },
        clearwarn: { emoji: '🧹', color: COLORS.SUCCESS, title: 'Warnings Cleared', severity: 'INFO' }
    };

    const config = actionConfig[action.toLowerCase()] || { 
        emoji: '⚡', color: COLORS.PRIMARY, title: 'Moderation Action', severity: 'INFO' 
    };

    const embed = createEmbed(null, null, config.color, {
        footer: `Lily Security • ${config.severity} Priority`,
        thumbnail: target.displayAvatarURL({ dynamic: true, size: 128 }),
        ...options
    });

    // Professional header
    embed.setAuthor({
        name: `${config.emoji} ${config.title}`,
        iconURL: moderator.displayAvatarURL({ dynamic: true })
    });

    // Structured fields with better formatting
    embed.addFields([
        {
            name: '👤 Target User',
            value: `**${target.tag}**\n\`${target.id}\``,
            inline: true
        },
        {
            name: '👮 Moderator',
            value: `**${moderator.tag}**\n\`${moderator.id}\``,
            inline: true
        },
        {
            name: '🕐 Timestamp',
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true
        }
    ]);

    if (reason) {
        embed.addFields([{
            name: '📋 Reason',
            value: `\`\`\`${reason}\`\`\``,
            inline: false
        }]);
    }

    return embed;
}

/**
 * Create a professional appeal embed
 * @param {Object} options - Appeal options
 * @returns {EmbedBuilder} - Appeal embed
 */
function createAppealEmbed(options = {}) {
    const embed = createEmbed(null, null, COLORS.INFO, {
        footer: 'Lily Appeal System • Submit Your Request',
        ...options
    });

    embed.setAuthor({
        name: '📝 Submit an Appeal',
        iconURL: 'https://cdn.discordapp.com/emojis/appeal-icon.png'
    });

    embed.setDescription(`
**Need to appeal a moderation action?**

We believe in fair moderation and second chances. If you feel your punishment was unfair or you'd like to discuss your case, please submit an appeal.

**🔗 [Submit Appeal Form](${options.appealLink || 'https://forms.gle/UyogvAGTQiDCbP2J6'})**

**What to include in your appeal:**
• Explanation of the situation
• Why you believe the action was unfair
• What you've learned from the experience
• How you'll contribute positively moving forward

*Appeals are reviewed within 24-48 hours by our moderation team.*
    `);

    return embed;
}

module.exports = {
    createEmbed,
    createErrorEmbed,
    createSuccessEmbed,
    createWarningEmbed,
    createInfoEmbed,
    createModerationEmbed,
    createAppealEmbed,
    COLORS
};
