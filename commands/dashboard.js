const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createEmbed, createSuccessEmbed, COLORS } = require('../utils/embedBuilder.js');
const { hasPermission } = require('../utils/permissions.js');
const { readFileSync, existsSync } = require('fs');
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

// Helper function to auto-delete message
async function autoDelete(message, delay = 15000) {
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

const dashboard = {
    async execute(message, args, client, config) {
        // Check permissions - accessible to all staff levels
        if (!hasPermission(message, [...ROLE_PERMISSIONS.FULL_MOD, ...ROLE_PERMISSIONS.JR_MOD, ...ROLE_PERMISSIONS.STAFF])) {
            const reply = await message.reply({ 
                embeds: [createErrorEmbed('You need staff permissions to access the dashboard.')] 
            });
            autoDelete(reply);
            return;
        }

        const guild = message.guild;
        const warnings = loadWarnings();
        
        // Calculate statistics
        const totalWarnings = Object.values(warnings).reduce((total, userWarns) => total + userWarns.length, 0);
        const usersWithWarnings = Object.keys(warnings).length;
        const averageWarnings = usersWithWarnings > 0 ? (totalWarnings / usersWithWarnings).toFixed(1) : 0;

        // Get recent activity (last 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentWarnings = Object.values(warnings)
            .flat()
            .filter(warn => new Date(warn.timestamp).getTime() > sevenDaysAgo);

        // Bot uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        const embed = createEmbed(null, null, COLORS.PRIMARY);

        embed.setAuthor({
            name: '🌸 Lily Moderation Dashboard',
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        });

        embed.setDescription(`
**Welcome to the Lily Moderation Dashboard**
*Professional server management at your fingertips*

**🏛️ Server Overview**
**Name:** ${guild.name}
**Members:** ${guild.memberCount.toLocaleString()}
**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>
        `);

        embed.addFields([
            {
                name: '📊 Moderation Statistics',
                value: [
                    `**Total Warnings:** ${totalWarnings.toLocaleString()}`,
                    `**Users with Warnings:** ${usersWithWarnings.toLocaleString()}`,
                    `**Average per User:** ${averageWarnings}`,
                    `**Recent (7 days):** ${recentWarnings.length.toLocaleString()}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🤖 Bot Status',
                value: [
                    `**Status:** 🟢 Online`,
                    `**Uptime:** ${days}d ${hours}h ${minutes}m`,
                    `**Latency:** ${client.ws.ping}ms`,
                    `**Memory:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB`
                ].join('\n'),
                inline: true
            },
            {
                name: '👥 Staff Team',
                value: [
                    `**Owner:** <@&1369700079719420015>`,
                    `**Co-Owner:** <@&1375554327988670514>`,
                    `**Moderators:** <@&1369699803121848371>`,
                    `**Jr Moderators:** <@&1373967179988598815>`,
                    `**Staff:** <@&1370083070811570257>`
                ].join('\n'),
                inline: false
            }
        ]);

        // Create action buttons
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_refresh')
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('dashboard_warnings')
                    .setLabel('⚠️ View Warnings')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('dashboard_appeal')
                    .setLabel('📝 Appeal Form')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('dashboard_help')
                    .setLabel('❓ Help')
                    .setStyle(ButtonStyle.Secondary)
            );

        embed.setImage('https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=200&fit=crop&crop=center');

        const reply = await message.reply({ 
            embeds: [embed],
            components: [actionRow]
        });

        // Auto-delete after 5 minutes for dashboard
        autoDelete(reply, 300000);
    }
};

const appeal = {
    async execute(message, args, client, config) {
        const { createAppealEmbed } = require('../utils/embedBuilder.js');
        
        const appealEmbed = createAppealEmbed({
            appealLink: 'https://forms.gle/UyogvAGTQiDCbP2J6'
        });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('📝 Submit Appeal')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://forms.gle/UyogvAGTQiDCbP2J6'),
                new ButtonBuilder()
                    .setLabel('📖 Appeal Guidelines')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/guidelines')
            );

        const reply = await message.reply({ 
            embeds: [appealEmbed],
            components: [actionRow]
        });

        // Don't auto-delete appeal messages - users might need time to read
    }
};

const stats = {
    async execute(message, args, client, config) {
        // Check permissions
        if (!hasPermission(message, [...ROLE_PERMISSIONS.FULL_MOD, ...ROLE_PERMISSIONS.JR_MOD])) {
            const reply = await message.reply({ 
                embeds: [createErrorEmbed('You need moderator permissions to view detailed statistics.')] 
            });
            autoDelete(reply);
            return;
        }

        const warnings = loadWarnings();
        const guild = message.guild;

        // Calculate detailed statistics
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;

        const allWarnings = Object.values(warnings).flat();
        
        const stats24h = allWarnings.filter(w => now - new Date(w.timestamp).getTime() < oneDay).length;
        const stats7d = allWarnings.filter(w => now - new Date(w.timestamp).getTime() < oneWeek).length;
        const stats30d = allWarnings.filter(w => now - new Date(w.timestamp).getTime() < oneMonth).length;

        // Top warned users
        const userWarningCounts = Object.entries(warnings)
            .map(([userId, warns]) => ({ userId, count: warns.length }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const embed = createEmbed(null, null, COLORS.INFO);

        embed.setAuthor({
            name: '📈 Detailed Moderation Statistics',
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        });

        embed.addFields([
            {
                name: '📊 Warning Trends',
                value: [
                    `**Last 24 Hours:** ${stats24h}`,
                    `**Last 7 Days:** ${stats7d}`,
                    `**Last 30 Days:** ${stats30d}`,
                    `**Total Warnings:** ${allWarnings.length}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🏆 Most Active Moderators',
                value: await getMostActiveModerators(allWarnings, client),
                inline: true
            },
            {
                name: '⚠️ Users with Most Warnings',
                value: await getTopWarnedUsers(userWarningCounts, client),
                inline: false
            }
        ]);

        const reply = await message.reply({ embeds: [embed] });
        autoDelete(reply, 30000);
    }
};

async function getMostActiveModerators(warnings, client) {
    const modCounts = {};
    warnings.forEach(warn => {
        modCounts[warn.moderator] = (modCounts[warn.moderator] || 0) + 1;
    });

    const topMods = Object.entries(modCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

    if (topMods.length === 0) return 'No data available';

    const result = [];
    for (const [modId, count] of topMods) {
        try {
            const user = await client.users.fetch(modId);
            result.push(`**${user.tag}:** ${count}`);
        } catch {
            result.push(`**Unknown User:** ${count}`);
        }
    }

    return result.join('\n') || 'No moderators found';
}

async function getTopWarnedUsers(userWarningCounts, client) {
    if (userWarningCounts.length === 0) return 'No warnings issued yet';

    const result = [];
    for (const { userId, count } of userWarningCounts) {
        try {
            const user = await client.users.fetch(userId);
            result.push(`**${user.tag}:** ${count} warnings`);
        } catch {
            result.push(`**Unknown User:** ${count} warnings`);
        }
    }

    return result.join('\n') || 'No users found';
}

module.exports = {
    dashboard,
    appeal,
    stats
};