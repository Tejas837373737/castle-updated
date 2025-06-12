const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GuildConfig = require('../models/guildConfig');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        // Ignore DMs, bots, and cases where the content hasn't changed
        if (!newMessage.guild || newMessage.author.bot || oldMessage.content === newMessage.content) {
            return;
        }

        // Fetch the server's configuration from the database
        const guildConfig = await GuildConfig.findOne({ guildId: newMessage.guild.id });
        if (!guildConfig || !guildConfig.snipeLogChannelId) {
            return; // If no snipe log channel is set, do nothing
        }

        const snipeChannel = await newMessage.guild.channels.fetch(guildConfig.snipeLogChannelId).catch(() => null);
        if (!snipeChannel) return;

        // Create the log embed
        const embed = new EmbedBuilder()
            .setColor('#f1c40f') // Yellow for an update
            .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.displayAvatarURL() })
            .setDescription(`**Message edited in ${newMessage.channel}**`)
            .addFields(
                { name: 'Before', value: `\`\`\`${oldMessage.content.slice(0, 1000) || ' '}\`\`\`` },
                { name: 'After', value: `\`\`\`${newMessage.content.slice(0, 1000) || ' '}\`\`\`` }
            )
            .setTimestamp()
            .setFooter({ text: `User ID: ${newMessage.author.id}` });
        
        // Create a button to jump to the message
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Jump to Message')
                .setStyle(ButtonStyle.Link)
                .setURL(newMessage.url)
        );

        try {
            await snipeChannel.send({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error(`Could not send edit snipe log for guild ${newMessage.guild.id}:`, error);
        }
    },
};