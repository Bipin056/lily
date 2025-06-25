const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createEmbed, createErrorEmbed } = require('../utils/embedBuilder.js');

// Cooldown storage (in production, consider using a database)
const reportCooldowns = new Map();

// Helper function to auto-delete message
async function autoDelete(message, delay = 7000) {
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

// Helper function to send DM
async function sendDM(user, embed) {
    try {
        await user.send({ embeds: [embed] });
        return true;
    } catch {
        return false;
    }
}

const report = {
    async execute(message, args, client, config) {
        const userId = message.author.id;
        const now = Date.now();
        const cooldownTime = 30 * 1000; // 30 seconds

        // Check cooldown
        if (reportCooldowns.has(userId)) {
            const expirationTime = reportCooldowns.get(userId) + cooldownTime;
            if (now < expirationTime) {
                const timeLeft = Math.round((expirationTime - now) / 1000);
                const reply = await message.reply({ 
                    embeds: [createErrorEmbed(`❌ Please wait ${timeLeft} seconds before using this command again.`)] 
                });
                autoDelete(reply);
                return;
            }
        }

        // Parse arguments
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ Please mention a user to report.')] });
            autoDelete(reply);
            return;
        }

        if (targetUser.id === message.author.id) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ You cannot report yourself.')] });
            autoDelete(reply);
            return;
        }

        const reason = args.slice(1).join(' ');
        if (!reason) {
            const reply = await message.reply({ embeds: [createErrorEmbed('❌ Please provide a reason for the report.')] });
            autoDelete(reply);
            return;
        }

        // Set cooldown
        reportCooldowns.set(userId, now);

        try {
            // Get log channel
            const logChannel = client.channels.cache.get(config.logChannelId);
            if (!logChannel) {
                const reply = await message.reply({ embeds: [createErrorEmbed('❌ Log channel not found. Please contact an administrator.')] });
                autoDelete(reply);
                return;
            }

            // Create report embed
            const reportEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🚨 New Report')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Reported User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Reporter', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Channel', value: `${message.channel}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Message Link', value: `[Jump to Message](${message.url})`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Lily Bot • Report System' });

            // Send report to log channel
            const reportMessage = await logChannel.send({ embeds: [reportEmbed] });

            // Create thread for the report
            const threadName = `Report: ${targetUser.username}`;
            const thread = await reportMessage.startThread({
                name: threadName,
                autoArchiveDuration: 1440, // 24 hours
                reason: `Report thread for ${targetUser.tag}`
            });

            // Staff role IDs to add to thread
            const staffRoleIds = [
                '1369700079719420015', // Owner
                '1375554327988670514', // Co-Owner
                '1369699803121848371', // Moderator
                '1373967179988598815', // Jr Moderator
                '1370083070811570257'  // Nivaan Staff
            ];

            // Add staff members to thread
            const guild = message.guild;
            for (const roleId of staffRoleIds) {
                try {
                    const role = guild.roles.cache.get(roleId);
                    if (role) {
                        const membersWithRole = role.members;
                        for (const [memberId, member] of membersWithRole) {
                            try {
                                await thread.members.add(member.id);
                            } catch (error) {
                                console.error(`Failed to add ${member.user.tag} to report thread:`, error);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Failed to process role ${roleId}:`, error);
                }
            }

            // Send initial message in thread
            const threadEmbed = createEmbed(
                '📋 Report Details',
                `This is a private discussion thread for the report against ${targetUser.tag}.\n\nStaff members can discuss and take appropriate action here.`,
                0x0099ff
            );
            await thread.send({ embeds: [threadEmbed] });

            // Send confirmation DM to reporter
            const dmEmbed = createEmbed(
                '✅ Report Submitted',
                `Your report against **${targetUser.tag}** has been submitted successfully.\n\n**Reason:** ${reason}\n\nOur staff team will review your report and take appropriate action if necessary.`,
                0x00ff00
            );
            
            const dmSent = await sendDM(message.author, dmEmbed);

            // Send confirmation message
            const confirmationEmbed = createEmbed(
                '✅ Report Submitted',
                `Your report against **${targetUser.tag}** has been submitted successfully.\n\n**DM Sent:** ${dmSent ? '✅' : '❌'}\n**Report ID:** ${reportMessage.id}`,
                0x00ff00
            );

            const reply = await message.reply({ embeds: [confirmationEmbed] });
            autoDelete(reply);

        } catch (error) {
            console.error('Error processing report:', error);
            const errorEmbed = createErrorEmbed('❌ Failed to submit report. Please try again later or contact an administrator.');
            const reply = await message.reply({ embeds: [errorEmbed] });
            autoDelete(reply);
        }
    }
};

module.exports = {
    report
};
