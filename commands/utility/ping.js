const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Replies with the bot\'s latency.',
    execute(message, args, client) {
        const pingEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setDescription('Pinging...');

        message.channel.send({ embeds: [pingEmbed] }).then(sent => {
            const latency = sent.createdTimestamp - message.createdTimestamp;
            const apiLatency = Math.round(client.ws.ping);

            const pongEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('<a:loadingapoints:1381563531110912063> Pong!')
                .addFields(
                    { name: 'Latency', value: `${latency}ms`, inline: true },
                    { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
                );
            sent.edit({ embeds: [pongEmbed] });
        });
    },
};