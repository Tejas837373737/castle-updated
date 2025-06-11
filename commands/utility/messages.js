const { EmbedBuilder } = require('discord.js');
const MessageCount = require('../../models/messageCount');

module.exports = {
    name: 'messages',
    description: 'Shows how many messages a user has sent in counted channels.',
    usage: '[@user|userID]',
    async execute(message, args) {
        const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]) : message.author);
        const userCount = await MessageCount.findOne({ guildId: message.guild.id, userId: targetUser.id });
        const count = userCount ? userCount.messageCount : 0;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() })
            .setDescription(`**${count}** messages sent in counted channels.`);
        await message.reply({ embeds: [embed] });
    },
};