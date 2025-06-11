const { Events, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/guildConfig');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        // Save to memory for the !snipe command
        if (!message.author?.bot && message.guild) {
            const snipes = message.client.snipes;
            let channelSnipes = snipes.get(message.channel.id) || [];
            channelSnipes.unshift({
                content: message.content,
                author: message.author,
                timestamp: Date.now(),
                attachments: message.attachments.first() ? message.attachments.first().proxyURL : null
            });
            if (channelSnipes.length > 50) channelSnipes.pop();
            snipes.set(message.channel.id, channelSnipes);
        }
        
        // --- NEW: Automatic Logging ---
        if (!message.guild || message.author?.bot) return;

        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.snipeLogChannelId) return;

        const snipeChannel = message.guild.channels.cache.get(guildConfig.snipeLogChannelId);
        if (!snipeChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#dc3545')
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .addFields({ name: 'Channel', value: `${message.channel}`, inline: true})
            .setDescription(message.content || '`No text content`')
            .setTimestamp(Date.now())
            .setFooter({ text: `Message Deleted | User ID: ${message.author.id}` });
        
        if (message.attachments.size > 0) {
            embed.addFields({ name: 'Attachment', value: message.attachments.first().proxyURL });
        }

        try {
            await snipeChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Could not send snipe log for guild ${message.guild.id}:`, error);
        }
    },
};