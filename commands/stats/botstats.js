const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'botstats',
    description: 'Displays statistics about the bot.',
    aliases: ['stats'],
    execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle( '<a:loadingapoints:1381563531110912063> Bot Statistics')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: 'Total Servers', value: `${client.guilds.cache.size}`, inline: true },
                { name: 'Total Users', value: `${client.users.cache.size}`, inline: true },
                { name: 'Uptime', value: `${Math.round(client.uptime / (1000 * 60 * 60))} hours`, inline: true },
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    },
};