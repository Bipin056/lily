const { EmbedBuilder } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../utils/embedBuilder.js');

const userinfo = {
    async execute(message, args, client, config) {
        const targetUser = message.mentions.users.first() || message.author;
        
        try {
            const member = await message.guild.members.fetch(targetUser.id);
            
            // Calculate account age
            const accountCreated = Math.floor(targetUser.createdTimestamp / 1000);
            const joinedServer = Math.floor(member.joinedTimestamp / 1000);
            
            // Get roles (excluding @everyone)
            const roles = member.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.toString())
                .join(', ') || 'None';

            const embed = createEmbed(null, null, COLORS.INFO);
            
            embed.setAuthor({
                name: `👤 ${targetUser.tag}`,
                iconURL: targetUser.displayAvatarURL({ dynamic: true })
            });

            embed.setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }));

            embed.setDescription(`
**User Profile Information**
Comprehensive details about ${targetUser.toString()}
            `);

            embed.addFields([
                {
                    name: '🏷️ Identity',
                    value: [
                        `**Username:** ${targetUser.tag}`,
                        `**ID:** \`${targetUser.id}\``,
                        `**Nickname:** ${member.nickname || 'None'}`,
                        `**Mention:** ${targetUser.toString()}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📅 Timestamps',
                    value: [
                        `**Account Created:** <t:${accountCreated}:R>`,
                        `**Joined Server:** <t:${joinedServer}:R>`,
                        `**Status:** ${member.presence?.status || 'offline'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎭 Roles & Permissions',
                    value: [
                        `**Highest Role:** ${member.roles.highest.toString()}`,
                        `**Role Count:** ${member.roles.cache.size - 1}`,
                        `**Roles:** ${roles.length > 100 ? 'Too many to display' : roles}`
                    ].join('\n'),
                    inline: false
                }
            ]);

            await message.reply({ embeds: [embed] });

        } catch (error) {
            const errorEmbed = createErrorEmbed(
                'Could not fetch user information. The user may not be in this server.',
                { title: 'User Not Found' }
            );
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};

const serverinfo = {
    async execute(message, args, client, config) {
        const guild = message.guild;
        
        try {
            // Fetch guild data
            await guild.fetch();
            
            // Calculate server stats
            const totalMembers = guild.memberCount;
            const onlineMembers = guild.members.cache.filter(member => 
                member.presence?.status === 'online' || 
                member.presence?.status === 'idle' || 
                member.presence?.status === 'dnd'
            ).size;
            
            const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
            const totalChannels = textChannels + voiceChannels;
            
            const serverCreated = Math.floor(guild.createdTimestamp / 1000);
            
            // Verification level
            const verificationLevels = {
                0: 'None',
                1: 'Low',
                2: 'Medium',
                3: 'High',
                4: 'Very High'
            };

            const embed = createEmbed(null, null, COLORS.PRIMARY);
            
            embed.setAuthor({
                name: `${guild.name} • Server Overview`,
                iconURL: guild.iconURL({ dynamic: true })
            });

            embed.setThumbnail(guild.iconURL({ dynamic: true, size: 256 }));

            embed.setDescription(`
**🆔 Server ID:** \`${guild.id}\`
**👑 Owner:** <@${guild.ownerId}>
**📅 Created:** <t:${serverCreated}:F> (<t:${serverCreated}:R>)
**🔒 Verification:** ${verificationLevels[guild.verificationLevel]}
            `);

            embed.addFields([
                {
                    name: '👥 Members',
                    value: [
                        `**Total:** ${totalMembers.toLocaleString()}`,
                        `**Online:** ${onlineMembers.toLocaleString()}`,
                        `**Offline:** ${(totalMembers - onlineMembers).toLocaleString()}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📢 Channels',
                    value: [
                        `**Total:** ${totalChannels}`,
                        `**📝 Text:** ${textChannels}`,
                        `**🔊 Voice:** ${voiceChannels}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💎 Nitro Boost',
                    value: [
                        `**Level:** ${guild.premiumTier}`,
                        `**Boosts:** ${guild.premiumSubscriptionCount || 0}`,
                        `**Boosters:** ${guild.members.cache.filter(m => m.premiumSince).size}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎭 Server Statistics',
                    value: [
                        `**Roles:** ${guild.roles.cache.size}`,
                        `**Emojis:** ${guild.emojis.cache.size}`,
                        `**Stickers:** ${guild.stickers.cache.size}`
                    ].join('\n'),
                    inline: true
                }
            ]);

            if (guild.features.length > 0) {
                const featuresFormatted = guild.features
                    .map(f => f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()))
                    .join(', ');
                embed.addFields([{
                    name: '✨ Special Features',
                    value: featuresFormatted,
                    inline: false
                }]);
            }

            if (guild.bannerURL()) {
                embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            const errorEmbed = createErrorEmbed('Could not fetch server information.');
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};

const help = {
    async execute(message, args, client, config) {
        const embed = createEmbed(null, null, COLORS.PRIMARY);
        
        embed.setAuthor({
            name: '🌸 Lily Moderation System',
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        });

        embed.setDescription(`
**Professional Discord Moderation**
*Secure, efficient, and comprehensive server management*

**🚀 Quick Links**
• \`${config.prefix}dashboard\` - Access moderation dashboard
• \`${config.prefix}appeal\` - Submit punishment appeals
• \`${config.prefix}stats\` - View detailed statistics
        `);

        embed.addFields([
            {
                name: '🔨 Moderation Commands',
                value: [
                    `\`${config.prefix}warn @user [reason]\``,
                    `\`${config.prefix}warnings @user\``,
                    `\`${config.prefix}clearwarn @user\``,
                    `\`${config.prefix}ban @user [reason]\``,
                    `\`${config.prefix}kick @user [reason]\``,
                    `\`${config.prefix}mute @user [minutes]\``,
                    `\`${config.prefix}unban <userID>\``
                ].join('\n'),
                inline: true
            },
            {
                name: '📊 Information & Utility',
                value: [
                    `\`${config.prefix}userinfo [@user]\``,
                    `\`${config.prefix}serverinfo\``,
                    `\`${config.prefix}dashboard\``,
                    `\`${config.prefix}stats\``,
                    `\`${config.prefix}appeal\``,
                    `\`${config.prefix}help\``
                ].join('\n'),
                inline: true
            },
            {
                name: '🛡️ Permission Hierarchy',
                value: [
                    '**🔴 Owner/Co-Owner:** Full Access',
                    '**🟠 Moderator:** All Moderation',
                    '**🟡 Jr Moderator:** Limited Mod',
                    '**🟢 Staff:** Warning Only'
                ].join('\n'),
                inline: false
            }
        ]);

        embed.setImage('https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=200&fit=crop&crop=center');

        await message.reply({ embeds: [embed] });
    }
};

const commands = {
    async execute(message, args, client, config) {
        const commandList = [
            '**Moderation:** warn, warnings, clearwarn, ban, kick, mute, unban',
            '**Information:** userinfo, serverinfo, help, commands',
            '**Utility:** report'
        ];

        const embed = createEmbed(
            '📝 Available Commands',
            commandList.join('\n\n'),
            0x0099ff
        );

        await message.reply({ embeds: [embed] });
    }
};

module.exports = {
    userinfo,
    serverinfo,
    help,
    commands
};
