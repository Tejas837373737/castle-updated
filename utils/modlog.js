const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/guildConfig');

async function sendModLog(client, guild, title, color, fields) {
    try {
        // Find the guild's configuration
        const guildConfig = await GuildConfig.findOne({ guildId: guild.id });
        if (!guildConfig || !guildConfig.logChannelId) {
            // If no log channel is set, do nothing.
            return;
        }

        // Fetch the channel from the client's cache
        const logChannel = await client.channels.fetch(guildConfig.logChannelId);
        
        // Ensure the channel exists and is a text channel
        if (!logChannel || !logChannel.isTextBased()) {
            return;
        }

        // Create the embed
        const logEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .addFields(fields)
            .setTimestamp()
            .setFooter({ text: `Event Log | ${guild.name}` });

        // Send the message
        await logChannel.send({ embeds: [logEmbed] });

    } catch (error) {
        console.error('Error sending mod log:', error);
    }
}

module.exports = { sendModLog };