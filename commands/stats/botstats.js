const { EmbedBuilder, version: djsVersion } = require('discord.js');
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
    name: 'botstats',
    description: 'Displays detailed statistics about the bot.',
    aliases: ['stats', 'info'],
    execute(message, args, client) {
        // --- Data Collection ---
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalCommands = client.commands.size;
        
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const uptime = formatUptime(client.uptime);
        
        // Mongoose connection status
        const readyStateMap = {
            0: '<a:wrong:1381568998847545428> Disconnected',
            1: '<a:Green_Tick:1381583016073363508> Connected',
            2: 'Connecting',
            3: 'Disconnecting',
        };
        const dbStatus = readyStateMap[mongoose.connection.readyState] || '❓ Unknown';

        // --- Embed Creation ---
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${client.user.username}'s Statistics`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                // Core Stats
                { name: '🌐 Servers', value: `**${client.guilds.cache.size}**`, inline: true },
                { name: '<:member:1382321501663006741> Users', value: `**${totalMembers}**`, inline: true },
                { name: '<:aromaxcode:1381560953744785408> Commands', value: `**${totalCommands}**`, inline: true },
                
                // Technical Info
                { name: 'Uptime', value: uptime, inline: false },
                { name: 'API Latency', value: `**${Math.round(client.ws.ping)}** ms`, inline: true },
                { name: 'RAM Usage', value: `**${memoryUsage}** MB`, inline: true },
                { name: 'Database', value: dbStatus, inline: true },

                // Version Info
                { name: 'Discord.js Version', value: `v${djsVersion}`, inline: true },
                { name: 'Node.js Version', value: process.version, inline: true },
                { name: 'Bot Created', value: `<t:${parseInt(client.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.username}` });
            
        message.channel.send({ embeds: [embed] });
    },
};