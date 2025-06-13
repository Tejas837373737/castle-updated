const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const mongoose = require('mongoose');

// Helper function to format uptime
function formatUptime(uptime) {
    const seconds = Math.floor((uptime / 1000) % 60);
    const minutes = Math.floor((uptime / (1000 * 60)) % 60);
    const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    return `**${days}**d **${hours}**h **${minutes}**m **${seconds}**s`;
}

module.exports = {
    // --- Data for Prefix Command ---
    name: 'botstats',
    description: 'Displays detailed statistics about the bot.',
    aliases: ['stats', 'info'],

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('botstats')
        .setDescription('Displays detailed statistics about the bot.'),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args, client) {
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalCommands = client.commands.size;
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const uptime = formatUptime(client.uptime);
        const readyStateMap = {
            0: '<:disconnect:1382722103295606804> Disconnected',
            1: '<:connected:1382721986513338471> Connected',
            2: 'Connecting',
            3: 'Disconnecting',
        };
        const dbStatus = readyStateMap[mongoose.connection.readyState] || '❓ Unknown';
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${client.user.username}'s Statistics`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '<:servers:1382722593571733614> Servers', value: `**${client.guilds.cache.size}**`, inline: true },
                { name: '<:users:1382722651885146186> Users', value: `**${totalMembers.toLocaleString()}**`, inline: true },
                { name: '<:utilities:1382723355073052692> Commands', value: `**${totalCommands}**`, inline: true },
                { name: '<a:uptime:1382724374054043709> Uptime', value: uptime, inline: false },
                { name: '<:connection:1382721918804824214> API Latency', value: `**${Math.round(client.ws.ping)}** ms`, inline: true },
                { name: '<:rampc:1383037798721912942> RAM Usage', value: `**${memoryUsage}** MB`, inline: true },
                { name: '<:databaseee:1383038066951848039> Database', value: dbStatus, inline: true },
                { name: '<:DiscordJS:1383038234094993519> Discord.js Version', value: `v${djsVersion}`, inline: true },
                { name: '<:nodeJS:1383038367981113399> Node.js Version', value: process.version, inline: true },
                { name: '<:discord_bot:1383038477624414270> Bot Created', value: `<t:${parseInt(client.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.username}` });
        await message.channel.send({ embeds: [embed] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const client = interaction.client;
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalCommands = client.commands.size;
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const uptime = formatUptime(client.uptime);
        const readyStateMap = {
             0: '<:disconnect:1382722103295606804> Disconnected',
            1: '<:connected:1382721986513338471> Connected',
            2: 'Connecting',
            3: 'Disconnecting',
        };
        const dbStatus = readyStateMap[mongoose.connection.readyState] || '❓ Unknown';
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${client.user.username}'s Statistics`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '<:servers:1382722593571733614> Servers', value: `**${client.guilds.cache.size}**`, inline: true },
                { name: '<:users:1382722651885146186> Users', value: `**${totalMembers.toLocaleString()}**`, inline: true },
                { name: '<:utilities:1382723355073052692> Commands', value: `**${totalCommands}**`, inline: true },
                { name: '<a:uptime:1382724374054043709> Uptime', value: uptime, inline: false },
                { name: '<:connection:1382721918804824214> API Latency', value: `**${Math.round(client.ws.ping)}** ms`, inline: true },
                { name: '<:rampc:1383037798721912942> RAM Usage', value: `**${memoryUsage}** MB`, inline: true },
                { name: '<:databaseee:1383038066951848039> Database', value: dbStatus, inline: true },
                { name: '<:DiscordJS:1383038234094993519> Discord.js Version', value: `v${djsVersion}`, inline: true },
                { name: '<:nodeJS:1383038367981113399> Node.js Version', value: process.version, inline: true },
                { name: '<:discord_bot:1383038477624414270> Bot Created', value: `<t:${parseInt(client.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.username}` });

        await interaction.reply({ embeds: [embed] });
    }
};
