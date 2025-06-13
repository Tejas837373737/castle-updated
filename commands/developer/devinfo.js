const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, version: djsVersion } = require('discord.js');
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
    // --- Data for Prefix Command ---
    name: 'devinfo',
    description: 'Displays detailed developer-only statistics for the bot.',
    aliases: ['di', 'debug'],
    developerOnly: true,

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('devinfo')
        .setDescription('Displays detailed developer-only statistics for the bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args, client) {
        if (message.author.id !== process.env.DEVELOPER_ID) return;
        const dbPingStart = Date.now();
        await mongoose.connection.db.admin().ping();
        const dbPing = `${Date.now() - dbPingStart}ms`;
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const cpuModel = os.cpus()[0].model.split('@')[0].trim();
        const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const botUptime = formatDuration(process.uptime());
        const systemUptime = formatDuration(os.uptime());
        const readyStateMap = { 0: '<:disconnect:1382722103295606804> Disconnected', 1: '<:connected:1382721986513338471> Connected', 2: 'Connecting', 3: 'Disconnecting' };
        const dbStatus = readyStateMap[mongoose.connection.readyState] || '❓ Unknown';
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle(`Developer Info for ${client.user.username}`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '<:settings:1382325149235286030> Core Stats', value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${totalMembers}`, inline: true },
                { name: '<a:uptime:1382724374054043709> Uptime', value: `**Bot:** ${botUptime}\n**System:** ${systemUptime}`, inline: true },
                { name: '<:nodeJS:1383038367981113399> Versions', value: `**Node.js:** ${process.version}\n**Discord.js:** v${djsVersion}\n**API Ping:** ${Math.round(client.ws.ping)}ms`, inline: true },
                { name: '<:user:1382323085000315082> Host', value: `**OS:** ${os.platform()}\n**CPU:** ${cpuModel}`, inline: true },
                { name: '<:connection:1382721918804824214> Memory', value: `**Usage:** ${memoryUsage} MB`, inline: true },
                { name: '<:databaseee:1383038066951848039> Database', value: `**Status:** ${dbStatus}\n**Ping:** ${dbPing}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Process ID (PID): ${process.pid}` });
        await message.channel.send({ embeds: [embed] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        if (interaction.user.id !== process.env.DEVELOPER_ID) {
            return interaction.reply({ content: 'This command is restricted to the bot developer.', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const dbPingStart = Date.now();
        await mongoose.connection.db.admin().ping();
        const dbPing = `${Date.now() - dbPingStart}ms`;
        const totalMembers = interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const cpuModel = os.cpus()[0].model.split('@')[0].trim();
        const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const botUptime = formatDuration(process.uptime());
        const readyStateMap = { 0: '<:disconnect:1382722103295606804> Disconnected', 1: '<:connected:1382721986513338471> Connected', 2: 'Connecting', 3: 'Disconnecting' };
        const dbStatus = readyStateMap[mongoose.connection.readyState] || '❓ Unknown';

        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle(`Developer Info for ${interaction.client.user.username}`)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                // --- THIS IS THE FIX ---
                // Changed 'client.guilds.cache.size' to 'interaction.client.guilds.cache.size'
                { name: '<:settings:1382325149235286030> Core Stats', value: `**Servers:** ${interaction.client.guilds.cache.size}\n**Users:** ${totalMembers}`, inline: true },
                { name: '<a:uptime:1382724374054043709> Uptime', value: `**Bot:** ${botUptime}`, inline: true },
                { name: '<:nodeJS:1383038367981113399> Versions', value: `**Node.js:** ${process.version}\n**Discord.js:** v${djsVersion}`, inline: true },
                { name: '<:user:1382323085000315082> Host', value: `**OS:** ${os.platform()}\n**CPU:** ${cpuModel}`, inline: true },
                { name: '<:connection:1382721918804824214> Memory', value: `**Usage:** ${memoryUsage} MB`, inline: true },
                { name: '<:databaseee:1383038066951848039> Database', value: `**Status:** ${dbStatus}\n**Ping:** ${dbPing}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Process ID (PID): ${process.pid}` });
        await interaction.editReply({ embeds: [embed] });
    }
};
