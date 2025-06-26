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
                await member.send(`You have been kicked from ${message.guild.name}.
Reason: ${reason}`).catch(() => {});
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
            const minutes = parseInt(args[1]) || 5;

            if (!member) {
                const reply = await sendMinimalEmbed(message, '❌ Mention someone to mute.');
                return deleteMessages(message, reply);
            }

            if (member.roles.highest.position >= message.member.roles.highest.position && message.guild.ownerId !== message.member.id) {
                const reply = await sendMinimalEmbed(message, '❌ You cannot mute a user with higher or equal role.');
                return deleteMessages(message, reply);
            }

            try {
                await member.send(`You have been muted in ${message.guild.name} for ${minutes} minutes.`).catch(() => {});
                await member.timeout(minutes * 60 * 1000, 'Muted by moderator');
                const botMsg = await sendMinimalEmbed(message, `✅ Muted ${member.user.tag} for ${minutes} min`);
                deleteMessages(message, botMsg);
            } catch {
                const reply = await sendMinimalEmbed(message, '❌ Failed to mute.');
                deleteMessages(message, reply);
            }
        }
    },

    // other commands remain unchanged... (unban, warn, warnings, clearwarn)

};
