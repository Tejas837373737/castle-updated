const { EmbedBuilder } = require('discord.js');
const MessageCount = require('../../models/messageCount');

module.exports = {
    name: 'leaderboard',
    description: 'Shows the message count leaderboard.',
    aliases: ['lb'],
    async execute(message) {
        const results = await MessageCount.find({ guildId: message.guild.id })
            .sort({ messageCount: -1 }) // Sort descending
            .limit(10); // Get top 10

        if (results.length === 0) {
            return message.reply('No message data found to create a leaderboard.');
        }

        const leaderboardString = await Promise.all(
            results.map(async (result, index) => {
                const user = await message.client.users.fetch(result.userId).catch(() => ({ tag: 'Unknown User' }));
                return `**${index + 1}.** ${user.tag} - **${result.messageCount}** messages`;
            })
        );
        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(`Message Leaderboard for ${message.guild.name}`)
            .setDescription(leaderboardString.join('\n'));
        await message.reply({ embeds: [embed] });
    },
};