const fs = require('fs');
const path = require('path');
const { canUseCommand } = require('../utils/permissions');
const warningsFile = path.join(__dirname, '../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsFile)) return {};
    return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
}

function saveWarnings(data) {
    fs.writeFileSync(warningsFile, JSON.stringify(data, null, 2));
}

module.exports = {
    ban: {
        name: 'ban',
        description: 'Ban a member',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'ban')) {
                const reply = await message.reply('❌');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            const member = message.mentions.members.first();
            const reason = args.slice(1).join(' ') || 'No reason';

            if (!member) {
                const reply = await message.reply('❌ Mention someone to ban.');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            try {
                await member.send({
                    embeds: [{
                        title: 'You have been banned',
                        description: `You were banned from ${message.guild.name}.
Reason: ${reason}`,
                        color: 0xff0000
                    }],
                    components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            label: 'Submit Appeal',
                            style: 5,
                            url: 'https://forms.gle/ikqag2LDvputPLhK7'
                        }]
                    }]
                });
            } catch (err) {
                console.log(`Couldn't send ban DM to ${member.user.tag}`);
            }

            try {
                await member.ban({ reason });
                const botMsg = await message.channel.send(`✅ Banned ${member.user.tag}`);
                setTimeout(() => {
                    message.delete().catch(() => {});
                    botMsg.delete().catch(() => {});
                }, 5000);
            } catch {
                const reply = await message.reply('❌ Failed to ban.');
                setTimeout(() => reply.delete().catch(() => {}), 5000);
            }
        }
    },

    kick: {
        name: 'kick',
        description: 'Kick a member',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'kick')) {
                const reply = await message.reply('❌');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            const member = message.mentions.members.first();
            const reason = args.slice(1).join(' ') || 'No reason';

            if (!member) {
                const reply = await message.reply('❌ Mention someone to kick.');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            try {
                await member.send(`You have been kicked from ${message.guild.name}.
Reason: ${reason}`).catch(() => {});
                await member.kick(reason);
                const botMsg = await message.channel.send(`✅ Kicked ${member.user.tag}`);
                setTimeout(() => {
                    message.delete().catch(() => {});
                    botMsg.delete().catch(() => {});
                }, 5000);
            } catch {
                const reply = await message.reply('❌ Failed to kick.');
                setTimeout(() => reply.delete().catch(() => {}), 5000);
            }
        }
    },

    mute: {
        name: 'mute',
        description: 'Timeout a member',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'mute')) {
                const reply = await message.reply('❌');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            const member = message.mentions.members.first();
            const minutes = parseInt(args[1]) || 5;

            if (!member) {
                const reply = await message.reply('❌ Mention someone to mute.');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            try {
                await member.send(`You have been muted in ${message.guild.name} for ${minutes} minutes.`).catch(() => {});
                await member.timeout(minutes * 60 * 1000, 'Muted by moderator');
                const botMsg = await message.channel.send(`✅ Muted ${member.user.tag} for ${minutes} min`);
                setTimeout(() => {
                    message.delete().catch(() => {});
                    botMsg.delete().catch(() => {});
                }, 5000);
            } catch {
                const reply = await message.reply('❌ Failed to mute.');
                setTimeout(() => reply.delete().catch(() => {}), 5000);
            }
        }
    },

    unban: {
        name: 'unban',
        description: 'Unban a user',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'unban')) {
                const reply = await message.reply('❌');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            const userId = args[0];
            if (!userId) {
                const reply = await message.reply('❌ Provide user ID to unban.');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            try {
                await message.guild.bans.remove(userId);
                const botMsg = await message.channel.send(`✅ Unbanned <@${userId}>`);
                setTimeout(() => {
                    message.delete().catch(() => {});
                    botMsg.delete().catch(() => {});
                }, 5000);
            } catch {
                const reply = await message.reply('❌ Failed to unban.');
                setTimeout(() => reply.delete().catch(() => {}), 5000);
            }
        }
    },

    warn: {
        name: 'warn',
        description: 'Warn a member',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'warn')) {
                const reply = await message.reply('❌');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            const member = message.mentions.members.first();
            const reason = args.slice(1).join(' ') || 'No reason';

            if (!member) {
                const reply = await message.reply('❌ Mention someone to warn.');
                return setTimeout(() => reply.delete().catch(() => {}), 5000);
            }

            const data = loadWarnings();
            if (!data[member.id]) data[member.id] = [];
            data[member.id].push({ reason, date: new Date().toISOString(), mod: message.author.id });
            saveWarnings(data);

            try {
                await member.send(`You have been warned in ${message.guild.name}.
Reason: ${reason}`).catch(() => {});
            } catch {}

            const botMsg = await message.channel.send(`✅ Warned ${member.user.tag}`);
            setTimeout(() => {
                message.delete().catch(() => {});
                botMsg.delete().catch(() => {});
            }, 5000);
        }
    },

    warnings: {
        name: 'warnings',
        description: 'Show user warnings',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'warnings')) {
                return message.reply('❌');
            }

            const member = message.mentions.members.first();
            if (!member) return message.reply('❌ Mention someone.');

            const data = loadWarnings();
            const userWarnings = data[member.id] || [];

            if (userWarnings.length === 0) return message.reply('✅ No warnings.');

            let msg = `Warnings for **${member.user.tag}**:\n`;
            userWarnings.forEach((w, i) => {
                msg += `\`${i + 1}.\` ${w.reason} (by <@${w.mod}>)\n`;
            });

            message.reply(msg);
        }
    },

    clearwarn: {
        name: 'clearwarn',
        description: 'Clear user warnings',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'clearwarn')) {
                return message.reply('❌');
            }

            const member = message.mentions.members.first();
            if (!member) return message.reply('❌ Mention someone.');

            const data = loadWarnings();
            data[member.id] = [];
            saveWarnings(data);

            const reply = await message.reply(`✅ Cleared warnings for ${member.user.tag}`);
            setTimeout(() => reply.delete().catch(() => {}), 5000);
        }
    }
};
