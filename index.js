const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { config } = require('dotenv');
const { join } = require('path');
const { readFileSync, existsSync } = require('fs');

// Load environment variables
config();

// __dirname is available in CommonJS

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

// Configuration from environment variables
const config_data = {
    token: process.env.TOKEN,
    prefix: process.env.PREFIX || '!',
    appealLink: process.env.APPEAL_LINK || 'https://discord.gg/appeal',
    logChannelId: process.env.LOG_CHANNEL_ID
};

// Command collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Import command modules
const moderationCommands = require('./commands/moderation.js');
const infoCommands = require('./commands/info.js');
const dashboardCommands = require('./commands/dashboard.js');
const appealCommands = require('./commands/appeals.js');

// Register all commands
const allCommands = {
    ...moderationCommands,
    ...infoCommands,
    ...dashboardCommands,
    ...appealCommands
};

for (const [name, command] of Object.entries(allCommands)) {
    client.commands.set(name, command);
}

// Bot ready event
client.once(Events.ClientReady, () => {
    console.log(`✅ Lily Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`🌸 Professional moderation system active`);
    console.log(`📊 Dashboard: ${config_data.prefix}dashboard`);
    console.log(`📝 Appeals: ${config_data.prefix}appeal`);
    
    client.user.setActivity(`${config_data.prefix}dashboard | Professional Moderation`, { type: 'WATCHING' });
});

// Message handling
client.on(Events.MessageCreate, async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message starts with prefix
    if (!message.content.startsWith(config_data.prefix)) return;
    
    // Parse command and arguments
    const args = message.content.slice(config_data.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Get command from collection
    const command = client.commands.get(commandName);
    if (!command) return;
    
    try {
        // Execute command with config and client context
        await command.execute(message, args, client, config_data);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        
        const errorEmbed = {
            color: 0xff0000,
            title: '❌ Error',
            description: 'An error occurred while executing this command.',
            timestamp: new Date().toISOString(),
            footer: { text: 'Lily Bot • Error Handler' }
        };
        
        try {
            await message.reply({ embeds: [errorEmbed] });
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
});

// Error handling
client.on(Events.Error, error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Start web server for dashboard and appeals
if (process.env.NODE_ENV !== 'discord-only') {
    require('./server.js');
}

// Login to Discord
client.login(config_data.token).catch(error => {
    console.error('Failed to login to Discord:', error);
    process.exit(1);
});
