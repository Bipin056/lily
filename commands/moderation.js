const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { hasPermission } = require('../utils/permissions.js');
const { createEmbed, createErrorEmbed, createSuccessEmbed, createModerationEmbed, createAppealEmbed, COLORS } = require('../utils/embedBuilder.js');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');
const warnsPath = join(__dirname, '../data/warns.json');

// Role IDs for permission checking
const ROLE_PERMISSIONS = {
    FULL_MOD: ['1369700079719420015', '1375554327988670514', '1369699803121848371'], // Owner, Co-Owner, Moderator
    JR_MOD: ['1373967179988598815'], // Jr Moderator
    STAFF: ['1370083070811570257'] // Nivaan Staff
};

// Helper function to load warnings
function loadWarnings() {
    if (!existsSync(warnsPath)) {
        return {};
    }
    try {
        const data = readFileSync(warnsPath, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Helper function to save warnings
function saveWarnings(warnings) {
    try {
        writeFileSync(warnsPath, JSON.stringify(warnings, null, 2));
    } catch (error) {
        console.error('Failed to save warnings:', error);
    }
}

// Helper function to send DM with optional components
async function sendDM(user, embed, components = null) {
    try {
        const options = { embeds: [embed] };
        if (components) {
            options.components = [components];
        }
        await user.send(options);
        return true;
    } catch {
        return false;
    }
}

// Helper function to auto-delete message with professional timing
async function autoDelete(message, delay = 12000) {
    setTimeout(async () => {
        try {
            if (message.deletable) {
                await message.delete();
            }
        } catch (error) {
            console.error('Failed to auto-delete message:', error);
        }
    }, delay);
}

const warn = {
    async execute(message, args, client, config) {
        // Check permissions
        if (!hasPermission(message, [...ROLE_PERMISSIONS.FULL_MOD, ...ROLE_PERMISSIONS.JR_MOD, ...ROLE_PERMISSIONS.STAFF])) {
            const reply = await message.reply({ embeds: [createErrorEmbed('You need staff permissions to issue warnings.')] });
            autoDelete(reply);
            return;
        }

        // Parse arguments
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            const reply = await message.reply({ embeds: [createErrorEmbed('Please mention a user to warn.', { title: 'User Required' })] });
            autoDelete(reply);
            return;
        }

        if (targetUser.bot) {
            const reply = await message.reply({ embeds: [createErrorEmbed('Cannot warn bot users.', { title: 'Invalid Target' })] });
            autoDelete(reply);
            return;
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        // Load warnings and add new warning
        const warnings = loadWarnings();
        if (!warnings[targetUser.id]) {
            warnings[targetUser.id] = [];
        }

        const warning = {
            id: Date.now(),
            reason: reason,
            moderator: message.author.id,
            timestamp: new Date().toISOString()
        };

        warnings[targetUser.id].push(warning);
        saveWarnings(warnings);

        // Create professional DM embed
        const dmEmbed = createEmbed(null, null, COLORS.WARNING);
        dmEmbed.setAuthor({
            name: '⚠️ Official Warning',
            iconURL: message.guild.iconURL({ dynamic: true })
        });
        dmEmbed.setDescription(`
You have received an official warning in **${message.guild.name}**.

**📋 Reason:** ${reason}
**👮 Issued by:** ${message.author.tag}
**🕐 Date:** <t:${Math.floor(Date.now() / 1000)}:F>

Please review our server rules to avoid future infractions. Repeated violations may result in more severe consequences.
        `);
        dmEmbed.addFields([{
            name: '📝 Need to Appeal?',
            value: `[Submit an Appeal](${config.appealLink || 'https://forms.gle/appeal'})`,
            inline: false
        }]);

        // Send DM
        const dmSent = await sendDM(targetUser, dmEmbed);

        // Create professional response embed using moderation embed
        const responseEmbed = createModerationEmbed('warn', targetUser, message.author, reason);
        responseEmbed.addFields([{
            name: '📨 Notification Status',
            value: dmSent ? '✅ User notified via DM' : '❌ Could not send DM',
            inline: true
        }]);

        const reply = await message.reply({ embeds: [responseEmbed] });
        autoDelete(reply);
    }
};

const warnings = {
    async execute(message, args, client, config) {
        // Check permissions
        if (!hasPermission(message, [...ROLE_PERMISSIONS.FULL_MOD, ...ROLE_PERMISSIONS.JR_MOD])) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ You don\'t have permission to use this command.')] });
            autoDelete(reply);
            return;
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ Please mention a user to check warnings.')] });
            autoDelete(reply);
            return;
        }

        const warnings = loadWarnings();
        const userWarnings = warnings[targetUser.id] || [];

        const embed = createEmbed(null, null, userWarnings.length === 0 ? COLORS.SUCCESS : COLORS.WARNING);
        
        embed.setAuthor({
            name: '📋 Warning History',
            iconURL: targetUser.displayAvatarURL({ dynamic: true })
        });

        if (userWarnings.length === 0) {
            embed.setDescription(`
**${targetUser.tag}** has a clean record.

✅ No warnings on file
🏆 Exemplary member behavior
            `);
        } else {
            const warningList = userWarnings.map((warn, index) => {
                const date = new Date(warn.timestamp).toLocaleDateString();
                const moderator = client.users.cache.get(warn.moderator)?.tag || 'Unknown Moderator';
                return `**${index + 1}.** ${warn.reason}\n\`${date}\` • Issued by **${moderator}**`;
            }).join('\n\n');

            embed.setDescription(`
**User:** ${targetUser.tag}
**Total Warnings:** ${userWarnings.length}
**Status:** ${userWarnings.length >= 3 ? '🔴 High Risk' : userWarnings.length >= 2 ? '🟡 Moderate Risk' : '🟢 Low Risk'}

**Warning Details:**
${warningList}
            `);
        }

        const reply = await message.reply({ embeds: [embed] });
        autoDelete(reply);
    }
};

const clearwarn = {
    async execute(message, args, client, config) {
        // Check permissions
        if (!hasPermission(message, [...ROLE_PERMISSIONS.FULL_MOD, ...ROLE_PERMISSIONS.JR_MOD])) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ You don\'t have permission to use this command.')] });
            autoDelete(reply);
            return;
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ Please mention a user to clear warnings.')] });
            autoDelete(reply);
            return;
        }

        const warnings = loadWarnings();
        const userWarnings = warnings[targetUser.id] || [];
        const warningCount = userWarnings.length;

        // Clear warnings
        delete warnings[targetUser.id];
        saveWarnings(warnings);

        const embed = createEmbed(
            '🗑️ Warnings Cleared',
            `**User:** ${targetUser.tag}\n**Cleared:** ${warningCount} warning(s)`,
            0x00ff00
        );

        const reply = await message.reply({ embeds: [embed] });
        autoDelete(reply);
    }
};

const ban = {
    async execute(message, args, client, config) {
        // Check permissions
        if (!hasPermission(message, ROLE_PERMISSIONS.FULL_MOD)) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ You don\'t have permission to use this command.')] });
            autoDelete(reply);
            return;
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ Please mention a user to ban.')] });
            autoDelete(reply);
            return;
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // Check if user is in guild
            const member = await message.guild.members.fetch(targetUser.id);
            
            // Create professional ban DM embed
            const dmEmbed = createEmbed(null, null, COLORS.ERROR);
            dmEmbed.setAuthor({
                name: '🔨 Server Ban Notice',
                iconURL: message.guild.iconURL({ dynamic: true })
            });
            dmEmbed.setDescription(`
**You have been banned from ${message.guild.name}**

**📋 Reason:** ${reason}
**👮 Issued by:** ${message.author.tag}
**🕐 Date:** <t:${Math.floor(Date.now() / 1000)}:F>

**Appeal Process:**
If you believe this ban was unfair or you'd like to discuss your case, you can submit an appeal using the button below. Appeals are reviewed within 24-48 hours.
            `);

            // Add appeal button to ban DM
            const banDmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('📝 Submit Ban Appeal')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://forms.gle/UyogvAGTQiDCbP2J6')
                );

            const dmSent = await sendDM(targetUser, dmEmbed, banDmRow);

            // Ban the user
            await member.ban({ reason: `${reason} - by ${message.author.tag}` });

            // Create professional moderation embed
            const responseEmbed = createModerationEmbed('ban', targetUser, message.author, reason);

            const reply = await message.reply({ embeds: [responseEmbed] });
            autoDelete(reply);

        } catch (error) {
            const errorEmbed = createErrorEmbed('❌ Failed to ban user. They may not be in the server or I lack permissions.');
            const reply = await message.reply({ embeds: [errorEmbed] });
            autoDelete(reply);
        }
    }
};

const kick = {
    async execute(message, args, client, config) {
        // Check permissions
        if (!hasPermission(message, ROLE_PERMISSIONS.FULL_MOD)) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ You don\'t have permission to use this command.')] });
            autoDelete(reply);
            return;
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ Please mention a user to kick.')] });
            autoDelete(reply);
            return;
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // Check if user is in guild
            const member = await message.guild.members.fetch(targetUser.id);
            
            // Send DM before kicking
            const dmEmbed = createEmbed(
                '👢 You have been kicked',
                `You have been kicked from **${message.guild.name}**\n\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`,
                0xffa500
            );

            const dmSent = await sendDM(targetUser, dmEmbed);

            // Kick the user
            await member.kick(`${reason} - by ${message.author.tag}`);

            const responseEmbed = createEmbed(
                '👢 User Kicked',
                `**User:** ${targetUser.tag} (${targetUser.id})\n**Reason:** ${reason}\n**DM Sent:** ${dmSent ? '✅' : '❌'}`,
                0xffa500
            );

            const reply = await message.reply({ embeds: [responseEmbed] });
            autoDelete(reply);

        } catch (error) {
            const errorEmbed = createErrorEmbed('❌ Failed to kick user. They may not be in the server or I lack permissions.');
            const reply = await message.reply({ embeds: [errorEmbed] });
            autoDelete(reply);
        }
    }
};

const mute = {
    async execute(message, args, client, config) {
        // Check permissions
        if (!hasPermission(message, [...ROLE_PERMISSIONS.FULL_MOD, ...ROLE_PERMISSIONS.JR_MOD])) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ You don\'t have permission to use this command.')] });
            autoDelete(reply);
            return;
        }

        const targetUser = message.mentions.users.first();
        const duration = parseInt(args[1]) || 10; // Default 10 minutes

        if (!targetUser) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ Please mention a user to mute.')] });
            autoDelete(reply);
            return;
        }

        if (duration > 2419200) { // Max 28 days in seconds
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ Timeout duration cannot exceed 28 days.')] });
            autoDelete(reply);
            return;
        }

        try {
            const member = await message.guild.members.fetch(targetUser.id);
            const timeoutDuration = duration * 60 * 1000; // Convert minutes to milliseconds

            await member.timeout(timeoutDuration, `Muted by ${message.author.tag}`);

            const embed = createEmbed(
                '🔇 User Muted',
                `**User:** ${targetUser.tag} (${targetUser.id})\n**Duration:** ${duration} minutes\n**Moderator:** ${message.author.tag}`,
                0xffa500
            );

            const reply = await message.reply({ embeds: [embed] });
            autoDelete(reply);

        } catch (error) {
            const errorEmbed = createErrorEmbed('❌ Failed to mute user. They may not be in the server or I lack permissions.');
            const reply = await message.reply({ embeds: [errorEmbed] });
            autoDelete(reply);
        }
    }
};

const unban = {
    async execute(message, args, client, config) {
        // Check permissions
        if (!hasPermission(message, ROLE_PERMISSIONS.FULL_MOD)) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ You don\'t have permission to use this command.')] });
            autoDelete(reply);
            return;
        }

        const userId = args[0];
        if (!userId) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ Please provide a user ID to unban.')] });
            autoDelete(reply);
            return;
        }

        try {
            // Check if user is banned
            const bans = await message.guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (!bannedUser) {
                const reply = await message.reply({ embeds: [createErrorEmbed('❌ User is not banned or user ID is invalid.')] });
                autoDelete(reply);
                return;
            }

            // Unban the user
            await message.guild.members.unban(userId, `Unbanned by ${message.author.tag}`);

            const embed = createEmbed(
                '🔓 User Unbanned',
                `**User:** ${bannedUser.user.tag} (${userId})\n**Moderator:** ${message.author.tag}`,
                0x00ff00
            );

            const reply = await message.reply({ embeds: [embed] });
            autoDelete(reply);

        } catch (error) {
            const errorEmbed = createErrorEmbed('❌ Failed to unban user. Please check the user ID and my permissions.');
            const reply = await message.reply({ embeds: [errorEmbed] });
            autoDelete(reply);
        }
    }
};

module.exports = {
    warn,
    warnings,
    clearwarn,
    ban,
    kick,
    mute,
    unban
};
