const { EmbedBuilder } = require('discord.js');
const MessageCount = require('../../models/messageCount');

module.exports = {
    name: 'totalmessages',
    description: 'Shows the total number of messages counted in the server.',
    async execute(message) {
        const result = await MessageCount.aggregate([
            { $match: { guildId: message.guild.id } },
            { $group: { _id: null, total: { $sum: '$messageCount' } } }
        ]);
        const totalCount = result[0]?.total || 0;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Total Messages in ${message.guild.name}`)
            .setDescription(`A grand total of **${totalCount.toLocaleString()}** messages have been counted across all designated channels.`);
        await message.reply({ embeds: [embed] });
    },
};