const { Events } = require('discord.js');
const GuildConfig = require('../models/guildConfig');
const MessageCount = require('../models/messageCount');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bots and DMs
        if (message.author.bot || !message.guild) return;

        // Fetch the guild's configuration
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });

        // If no config or no countable channels are set, do nothing.
        if (!guildConfig || !guildConfig.countableChannels || guildConfig.countableChannels.length === 0) {
            return;
        }

        // Check if the message was sent in one of the designated channels
        if (guildConfig.countableChannels.includes(message.channel.id)) {
            // If yes, find the user's document and increment their message count by 1
            // The { upsert: true } option creates a new document if one doesn't exist
            await MessageCount.findOneAndUpdate(
                { guildId: message.guild.id, userId: message.author.id },
                { $inc: { messageCount: 1 } },
                { upsert: true }
            );
        }
    },
};