const fs = require('fs');
const path = require('path');
const { canUseCommand } = require('../utils/permissions');
const { createModerationEmbed, createErrorEmbed } = require('../utils/embedBuilder');

const warningsFile = path.join(__dirname, '../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsFile)) return {};
    return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
}

function saveWarnings(data) {
    fs.writeFileSync(warningsFile, JSON.stringify(data, null, 2));
}

function parseDuration(input) {
    const match = input.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 5 * 60 * 1000;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * multipliers[unit];
}

module.exports = {
  ban: {
    name: 'ban',
    description: 'Ban a member',
    async execute(message, args, client, config) {
      if (!canUseCommand(message.member, 'ban')) return message.reply({ embeds: [createErrorEmbed('You do not have permission.')] });

      const member = message.mentions.members.first();
      const reason = args.slice(1).join(' ') || 'No reason';

      if (!member) return message.reply({ embeds: [createErrorEmbed('Mention someone to ban.')] });

      try {
        await member.send({ embeds: [createModerationEmbed('ban', member.user, message.author, reason)] }).catch(() => {});
        await member.ban({ reason });
        const embed = createModerationEmbed('ban', member.user, message.author, reason);
        await message.channel.send({ embeds: [embed] });

        const logChannel = message.guild.channels.cache.get(config.logChannelId);
        if (logChannel) logChannel.send({ embeds: [embed] });
      } catch {
        return message.reply({ embeds: [createErrorEmbed('Failed to ban.')] });
      }
    }
  },

  kick: {
    name: 'kick',
    description: 'Kick a member',
    async execute(message, args, client, config) {
      if (!canUseCommand(message.member, 'kick')) return message.reply({ embeds: [createErrorEmbed('You do not have permission.')] });

      const member = message.mentions.members.first();
      const reason = args.slice(1).join(' ') || 'No reason';

      if (!member) return message.reply({ embeds: [createErrorEmbed('Mention someone to kick.')] });

      try {
        await member.send({ embeds: [createModerationEmbed('kick', member.user, message.author, reason)] }).catch(() => {});
        await member.kick(reason);
        const embed = createModerationEmbed('kick', member.user, message.author, reason);
        await message.channel.send({ embeds: [embed] });

        const logChannel = message.guild.channels.cache.get(config.logChannelId);
        if (logChannel) logChannel.send({ embeds: [embed] });
      } catch {
        return message.reply({ embeds: [createErrorEmbed('Failed to kick.')] });
      }
    }
  },

  mute: {
    name: 'mute',
    description: 'Timeout a member',
    async execute(message, args, client, config) {
      if (!canUseCommand(message.member, 'mute')) return message.reply({ embeds: [createErrorEmbed('You do not have permission.')] });

      const member = message.mentions.members.first();
      const timeInput = args[1] || '5m';
      const durationMs = parseDuration(timeInput);
      const reason = args.slice(2).join(' ') || 'No reason';

      if (!member) return message.reply({ embeds: [createErrorEmbed('Mention someone to mute.')] });

      if (message.guild.ownerId !== message.member.id && member.roles.highest.position >= message.member.roles.highest.position) {
        return message.reply({ embeds: [createErrorEmbed('You cannot mute someone with an equal or higher role.')] });
      }

      try {
        await member.send({ embeds: [createModerationEmbed('mute', member.user, message.author, reason)] }).catch(() => {});
        await member.timeout(durationMs, reason);
        const embed = createModerationEmbed('mute', member.user, message.author, reason);
        await message.channel.send({ embeds: [embed] });

        const logChannel = message.guild.channels.cache.get(config.logChannelId);
        if (logChannel) logChannel.send({ embeds: [embed] });
      } catch (err) {
        console.error('Mute error:', err);
        return message.reply({ embeds: [createErrorEmbed('Failed to mute.')] });
      }
    }
  },

  warn: {
    name: 'warn',
    description: 'Warn a member',
    async execute(message, args, client, config) {
      if (!canUseCommand(message.member, 'warn')) return message.reply({ embeds: [createErrorEmbed('You do not have permission.')] });

      const member = message.mentions.members.first();
      const reason = args.slice(1).join(' ') || 'No reason';

      if (!member) return message.reply({ embeds: [createErrorEmbed('Mention someone to warn.')] });

      const data = loadWarnings();
      if (!data[member.id]) data[member.id] = [];
      data[member.id].push({ reason, date: new Date().toISOString(), mod: message.author.id });
      saveWarnings(data);

      try {
        await member.send({ embeds: [createModerationEmbed('warn', member.user, message.author, reason)] }).catch(() => {});
      } catch {}

      const embed = createModerationEmbed('warn', member.user, message.author, reason);
      const logChannel = message.guild.channels.cache.get(config.logChannelId);
      if (logChannel) logChannel.send({ embeds: [embed] });

      return message.reply({ content: `⚠️ Warned ${member.user.tag}`, embeds: [embed] });
    }
  },

  warnings: {
    name: 'warnings',
    description: 'Show warnings for a user',
    async execute(message, args) {
      if (!canUseCommand(message.member, 'warnings')) return message.reply({ embeds: [createErrorEmbed('You do not have permission.')] });

      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [createErrorEmbed('Mention someone to check warnings.')] });

      const data = loadWarnings();
      const userWarnings = data[member.id] || [];

      if (userWarnings.length === 0) {
        return message.reply({ embeds: [createModerationEmbed('warnings', member.user, message.author, 'No warnings found.')] });
      }

      let desc = `📋 Warnings for **${member.user.tag}**:\n\n`;
      userWarnings.forEach((w, i) => {
        desc += `\`${i + 1}.\` ${w.reason} — <@${w.mod}> (${new Date(w.date).toLocaleString()})\n`;
      });

      return message.channel.send({ embeds: [createModerationEmbed('warn', member.user, message.author, desc)] });
    }
  },

  clearwarn: {
    name: 'clearwarn',
    description: 'Clear warnings for a user',
    async execute(message, args) {
      if (!canUseCommand(message.member, 'clearwarn')) return message.reply({ embeds: [createErrorEmbed('You do not have permission.')] });

      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [createErrorEmbed('Mention someone to clear warnings.')] });

      const data = loadWarnings();
      data[member.id] = [];
      saveWarnings(data);

      const embed = createModerationEmbed('clearwarn', member.user, message.author, 'All warnings cleared.');
      return message.reply({ content: `✅ Cleared warnings for ${member.user.tag}`, embeds: [embed] });
    }
  },

  unban: {
    name: 'unban',
    description: 'Unban a user by ID',
    async execute(message, args, client, config) {
      if (!canUseCommand(message.member, 'unban')) return message.reply({ embeds: [createErrorEmbed('You do not have permission.')] });

      const userId = args[0];
      if (!userId) return message.reply({ embeds: [createErrorEmbed('Provide a user ID to unban.')] });

      try {
        await message.guild.members.unban(userId);
        const user = await client.users.fetch(userId);
        const embed = createModerationEmbed('unban', user, message.author, 'User has been unbanned.');
        return message.channel.send({ embeds: [embed] });
      } catch (err) {
        return message.reply({ embeds: [createErrorEmbed('User is not banned or invalid ID.')] });
      }
    }
  }
};
