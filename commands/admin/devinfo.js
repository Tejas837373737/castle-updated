const { EmbedBuilder, version: djsVersion } = require('discord.js');
const mongoose = require('mongoose');
const os = require('os');

// Helper function to format seconds into readable time
function formatDuration(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `**${d}**d **${h}**h **${m}**m **${s}**s`;
}

module.exports = {
    name: 'devinfo',
    description: 'Displays detailed developer-only statistics for the bot.',
    aliases: ['di', 'debug'],
    developerOnly: true, // This flag marks the command as developer-only.
    async execute(message, args, client) {
        // Hard-gate to ensure only the developer can execute it.
        if (message.author.id !== process.env.DEVELOPER_ID) {
            return; 
        }

        // Data Collection
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const cpuModel = os.cpus()[0].model;
        const cpuCores = os.cpus().length;
        const osPlatform = os.platform();
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const nodeVersion = process.version;
        const botUptime = formatDuration(process.uptime());
        const systemUptime = formatDuration(os.uptime());
        const readyStateMap = { 0: '❌ Disconnected', 1: '✅ Connected', 2: 'Connecting', 3: 'Disconnecting' };
        const dbStatus = readyStateMap[mongoose.connection.readyState] || '❓ Unknown';
        
        // Embed Creation
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle(`Developer Info for ${client.user.username}`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '📊 Core Stats', value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${totalMembers}\n**Commands:** ${client.commands.size}` , inline: true },
                { name: '⏱️ Uptime', value: `**Bot:** ${botUptime}\n**System:** ${systemUptime}`, inline: true },
                { name: '⚙️ Versions & Ping', value: `**Node.js:** ${nodeVersion}\n**Discord.js:** v${djsVersion}\n**API Ping:** ${Math.round(client.ws.ping)}ms`, inline: true },
                { name: '💻 Host System', value: `**OS:** ${osPlatform}\n**CPU:** ${cpuModel} (${cpuCores} cores)`, inline: false },
                { name: '🧠 Memory', value: `**System:** ${freeMemory} GB / ${totalMemory} GB Free\n**Bot (RSS):** ${memoryUsage} MB`, inline: false },
                { name: '🗃️ Database', value: `**Status:** ${dbStatus}\n**Host:** ${mongoose.connection.host}`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Process ID (PID): ${process.pid}` });
            
        await message.channel.send({ embeds: [embed] });
    },
};