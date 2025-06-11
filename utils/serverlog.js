const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/guildConfig');

async function sendServerLog(client, guild, title, color, fields) {
    try {
        const guildConfig = await GuildConfig.findOne({ guildId: guild.id });
        if (!guildConfig || !guildConfig.serverLogChannelId) return; // Checks for serverLogChannelId

        const logChannel = await client.channels.fetch(guildConfig.serverLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;

        const logEmbed = new EmbedBuilder().setColor(color).setTitle(title).addFields(fields).setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
        console.error('Error sending server log:', error);
    }
}

module.exports = { sendServerLog };