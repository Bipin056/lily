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

function deleteMessages(message, botMsg) {
    setTimeout(() => {
        if (message.deletable) message.delete().catch(() => {});
        if (botMsg?.deletable) botMsg.delete().catch(() => {});
    }, 5000);
}

function sendMinimalEmbed(message, content) {
    return message.channel.send({
        embeds: [{
            description: content,
            color: 0x9b59b6
        }]
    });
}

module.exports = {
    ban: {
    name: 'ban',
    description: 'Ban a member',
    async execute(message, args) {
        if (!canUseCommand(message.member, 'ban')) {
            const reply = await sendMinimalEmbed(message, '❌ You do not have permission.');
            return deleteMessages(message, reply);
        }

        const member = message.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'No reason';

        if (!member) {
            const reply = await sendMinimalEmbed(message, '❌ Mention someone to ban.');
            return deleteMessages(message, reply);
        }

        try {
            await member.send({
                embeds: [{
                    title: 'You have been banned',
                    description: `You were banned from ${message.guild.name}.\nReason: ${reason}`,
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
        } catch {}

        try {
            await member.ban({ reason });
            const botMsg = await sendMinimalEmbed(message, `✅ Banned ${member.user.tag}`);
            deleteMessages(message, botMsg);
        } catch {
            const reply = await sendMinimalEmbed(message, '❌ Failed to ban.');
            deleteMessages(message, reply);
        }
    }
},

kick: {
    name: 'kick',
    description: 'Kick a member',
    async execute(message, args) {
        if (!canUseCommand(message.member, 'kick')) {
            const reply = await sendMinimalEmbed(message, '❌ You do not have permission.');
            return deleteMessages(message, reply);
        }

        const member = message.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'No reason';

        if (!member) {
            const reply = await sendMinimalEmbed(message, '❌ Mention someone to kick.');
            return deleteMessages(message, reply);
        }

        try {
            await member.send(`You have been kicked from ${message.guild.name}.\nReason: ${reason}`).catch(() => {});
            await member.kick(reason);
            const botMsg = await sendMinimalEmbed(message, `✅ Kicked ${member.user.tag}`);
            deleteMessages(message, botMsg);
        } catch {
            const reply = await sendMinimalEmbed(message, '❌ Failed to kick.');
            deleteMessages(message, reply);
        }
    }
},

mute: {
    name: 'mute',
    description: 'Timeout a member',
    async execute(message, args) {
        if (!canUseCommand(message.member, 'mute')) {
            const reply = await sendMinimalEmbed(message, '❌ You do not have permission.');
            return deleteMessages(message, reply);
        }

        const member = message.mentions.members.first();
        const timeInput = args[1] || '5m';
        const durationMs = parseDuration(timeInput);

        if (!member) {
            const reply = await sendMinimalEmbed(message, '❌ Mention someone to mute.');
            return deleteMessages(message, reply);
        }

        if (message.guild.ownerId !== message.member.id) {
            if (member.roles.highest.position >= message.member.roles.highest.position) {
                const reply = await sendMinimalEmbed(message, '❌ You cannot mute someone with an equal or higher role.');
                return deleteMessages(message, reply);
            }
        }

        try {
            await member.send(`You have been muted in ${message.guild.name} for ${timeInput}.`).catch(() => {});
            await member.timeout(durationMs, 'Muted by moderator');
            const botMsg = await sendMinimalEmbed(message, `✅ Muted ${member.user.tag} for ${timeInput}`);
            deleteMessages(message, botMsg);
        } catch (error) {
            console.error('Mute error:', error);
            const reply = await sendMinimalEmbed(message, '❌ Failed to mute.');
            deleteMessages(message, reply);
        }
    }
},

    warn: {
        name: 'warn',
        description: 'Warn a member',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'warn')) {
                const reply = await sendMinimalEmbed(message, '❌ You do not have permission.');
                return deleteMessages(message, reply);
            }

            const member = message.mentions.members.first();
            const reason = args.slice(1).join(' ') || 'No reason';

            if (!member) {
                const reply = await sendMinimalEmbed(message, '❌ Mention someone to warn.');
                return deleteMessages(message, reply);
            }

            const data = loadWarnings();
            if (!data[member.id]) data[member.id] = [];
            data[member.id].push({ reason, date: new Date().toISOString(), mod: message.author.id });
            saveWarnings(data);

            try {
                await member.send(`You have been warned in ${message.guild.name}.
Reason: ${reason}`).catch(() => {});
            } catch {}

            const botMsg = await sendMinimalEmbed(message, `✅ Warned ${member.user.tag}`);
            deleteMessages(message, botMsg);
        }
    },

    warnings: {
        name: 'warnings',
        description: 'Show user warnings',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'warnings')) {
                const reply = await sendMinimalEmbed(message, '❌ You do not have permission.');
                return deleteMessages(message, reply);
            }

            const member = message.mentions.members.first();
            if (!member) {
                const reply = await sendMinimalEmbed(message, '❌ Mention someone to check warnings.');
                return deleteMessages(message, reply);
            }

            const data = loadWarnings();
            const userWarnings = data[member.id] || [];

            if (userWarnings.length === 0) {
                const reply = await sendMinimalEmbed(message, '✅ No warnings for this user.');
                return deleteMessages(message, reply);
            }

            let msg = `Warnings for **${member.user.tag}**:\n`;
            userWarnings.forEach((w, i) => {
                msg += `\`${i + 1}.\` ${w.reason} (by <@${w.mod}>)\n`;
            });

            message.channel.send({ embeds: [{ description: msg, color: 0xe67e22 }] });
        }
    },

    clearwarn: {
        name: 'clearwarn',
        description: 'Clear user warnings',
        async execute(message, args) {
            if (!canUseCommand(message.member, 'clearwarn')) {
                const reply = await sendMinimalEmbed(message, '❌ You do not have permission.');
                return deleteMessages(message, reply);
            }

            const member = message.mentions.members.first();
            if (!member) {
                const reply = await sendMinimalEmbed(message, '❌ Mention someone to clear warnings.');
                return deleteMessages(message, reply);
            }

            const data = loadWarnings();
            data[member.id] = [];
            saveWarnings(data);

            const botMsg = await sendMinimalEmbed(message, `✅ Cleared warnings for ${member.user.tag}`);
            deleteMessages(message, botMsg);
        }
    }
};

function parseDuration(input) {
    const match = input.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 5 * 60 * 1000; // default 5 min
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * multipliers[unit];
}
