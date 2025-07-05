const { EmbedBuilder } = require('discord.js');

// Color scheme
const COLORS = {
    PRIMARY: 0x7C3AED,
    SUCCESS: 0x10B981,
    ERROR: 0xEF4444,
    WARNING: 0xF59E0B,
    INFO: 0x3B82F6,
    SECONDARY: 0x6B7280,
    ACCENT: 0xEC4899
};

/**
 * Create a reusable base embed
 */
function createEmbed(title, description, color = COLORS.PRIMARY, options = {}) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTimestamp()
        .setFooter({
            text: options.footer || 'Lily Moderation • Secure & Professional',
            iconURL: options.footerIcon || 'https://cdn.discordapp.com/icons/yourserverid/youricon.png'
        });

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.fields) embed.addFields(options.fields);
    if (options.author) embed.setAuthor(options.author);

    return embed;
}

/**
 * Create an error embed
 */
function createErrorEmbed(message, options = {}) {
    return createEmbed(
        null,
        `🚫 **${options.title || 'Access Denied'}**\n\n${message}`,
        COLORS.ERROR,
        {
            footer: 'Lily • Error Handler',
            ...options
        }
    );
}

/**
 * Create a success embed
 */
function createSuccessEmbed(message, options = {}) {
    return createEmbed(
        null,
        `✅ **${options.title || 'Success'}**\n\n${message}`,
        COLORS.SUCCESS,
        {
            footer: 'Lily • Action Successful',
            ...options
        }
    );
}

/**
 * Create a warning embed
 */
function createWarningEmbed(message, options = {}) {
    return createEmbed(
        options.title || '⚠️ Warning',
        message,
        COLORS.WARNING,
        {
            footer: options.footer || 'Lily • Warning',
            ...options
        }
    );
}

/**
 * Create an info embed
 */
function createInfoEmbed(message, options = {}) {
    return createEmbed(
        options.title || 'ℹ️ Information',
        message,
        COLORS.INFO,
        {
            footer: options.footer || 'Lily • Information',
            ...options
        }
    );
}

/**
 * Create moderation log embed
 */
function createModerationEmbed(action, target, moderator, reason, options = {}) {
    const actionConfig = {
        ban: { emoji: '🔨', color: COLORS.ERROR, title: 'Member Banned' },
        kick: { emoji: '👢', color: COLORS.WARNING, title: 'Member Kicked' },
        warn: { emoji: '⚠️', color: COLORS.WARNING, title: 'Warning Issued' },
        mute: { emoji: '🔇', color: COLORS.WARNING, title: 'Member Muted' },
        unban: { emoji: '🔓', color: COLORS.SUCCESS, title: 'Member Unbanned' },
        clearwarn: { emoji: '🧹', color: COLORS.SUCCESS, title: 'Warnings Cleared' }
    };

    const config = actionConfig[action] || {
        emoji: '⚡', color: COLORS.PRIMARY, title: 'Moderation Action'
    };

    const embed = createEmbed(null, null, config.color, {
        footer: options.footer || 'Lily Moderation • Log',
        thumbnail: target.displayAvatarURL({ dynamic: true }),
        ...options
    });

    embed.setAuthor({
        name: `${config.emoji} ${config.title}`,
        iconURL: moderator.displayAvatarURL({ dynamic: true })
    });

    embed.addFields(
        { name: '👤 User', value: `**${target.tag}**\n\`${target.id}\``, inline: true },
        { name: '👮 Moderator', value: `**${moderator.tag}**\n\`${moderator.id}\``, inline: true },
        { name: '🕐 Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
    );

    if (reason) {
        embed.addFields({ name: '📄 Reason', value: `\`\`\`${reason}\`\`\`` });
    }

    return embed;
}

/**
 * Create appeal embed
 */
function createAppealEmbed(options = {}) {
    const embed = createEmbed(null, null, COLORS.INFO, {
        footer: 'Lily • Appeal System',
        ...options
    });

    embed.setAuthor({
        name: '📝 Submit an Appeal',
        iconURL: 'https://cdn.discordapp.com/emojis/appeal-icon.png'
    });

    embed.setDescription(`
If you believe your punishment was unfair or you want to appeal:

🔗 [Click here to submit an appeal](${options.appealLink || 'https://forms.gle/UyogvAGTQiDCbP2J6'})

**What to include:**
• What happened  
• Why it was unfair  
• What you've learned  
• How you'll be better

We’ll respond in 24–48 hours.  
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
