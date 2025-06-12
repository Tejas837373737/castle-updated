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
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Can only be seen by Admins

    // --- Execute Function for Prefix Command ---
    async execute(message, args, client) {
        if (message.author.id !== process.env.DEVELOPER_ID) return;

        // --- Database Ping Measurement ---
        const dbPingStart = Date.now();
        await mongoose.connection.db.admin().ping();
        const dbPing = `${Date.now() - dbPingStart}ms`;

        // --- Data Collection ---
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const cpuModel = os.cpus()[0].model.split('@')[0].trim();
        const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const botUptime = formatDuration(process.uptime());
        const readyStateMap = { 0: '❌ Disconnected', 1: '✅ Connected', 2: 'Connecting', 3: 'Disconnecting' };
        const dbStatus = readyStateMap[mongoose.connection.readyState] || '❓ Unknown';
        
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle(`Developer Info for ${client.user.username}`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '📊 Core Stats', value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${totalMembers}`, inline: true },
                { name: '⏱️ Uptime', value: `**Bot:** ${botUptime}`, inline: true },
                { name: '⚙️ Versions', value: `**Node.js:** ${process.version}\n**Discord.js:** v${djsVersion}`, inline: true },
                { name: '💻 Host', value: `**OS:** ${os.platform()}\n**CPU:** ${cpuModel}`, inline: true },
                { name: '🧠 Memory', value: `**Usage:** ${memoryUsage} MB`, inline: true },
                { name: '🗃️ Database', value: `**Status:** ${dbStatus}\n**Ping:** ${dbPing}`, inline: true }
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

        // --- Database Ping Measurement ---
        const dbPingStart = Date.now();
        await mongoose.connection.db.admin().ping();
        const dbPing = `${Date.now() - dbPingStart}ms`;

        // --- Data Collection ---
        const totalMembers = interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const cpuModel = os.cpus()[0].model.split('@')[0].trim();
        const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const botUptime = formatDuration(process.uptime());
        const readyStateMap = { 0: '❌ Disconnected', 1: '✅ Connected', 2: 'Connecting', 3: 'Disconnecting' };
        const dbStatus = readyStateMap[mongoose.connection.readyState] || '❓ Unknown';

        // --- Embed Creation ---
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle(`Developer Info for ${interaction.client.user.username}`)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '📊 Core Stats', value: `**Servers:** ${interaction.client.guilds.cache.size}\n**Users:** ${totalMembers}`, inline: true },
                { name: '⏱️ Uptime', value: `**Bot:** ${botUptime}`, inline: true },
                { name: '⚙️ Versions', value: `**Node.js:** ${process.version}\n**Discord.js:** v${djsVersion}`, inline: true },
                { name: '💻 Host', value: `**OS:** ${os.platform()}\n**CPU:** ${cpuModel}`, inline: true },
                { name: '🧠 Memory', value: `**Usage:** ${memoryUsage} MB`, inline: true },
                { name: '🗃️ Database', value: `**Status:** ${dbStatus}\n**Ping:** ${dbPing}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Process ID (PID): ${process.pid}` });

        await interaction.editReply({ embeds: [embed] });
    }
};