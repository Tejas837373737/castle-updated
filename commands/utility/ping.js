const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'ping',
    description: "Replies with the bot's latency.",

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Replies with the bot's latency."),

    // --- Execute Function for Prefix Command (Unchanged) ---
    execute(message, args, client) {
        const pingEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setDescription('Pinging...');

        message.channel.send({ embeds: [pingEmbed] }).then(sent => {
            const latency = sent.createdTimestamp - message.createdTimestamp;
            const apiLatency = Math.round(client.ws.ping);

            const pongEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('<a:uptime:1382724374054043709> Latency')
                .addFields(
                    { name: 'Round-trip Latency', value: `**${latency}ms**`, inline: true },
                    { name: 'API Latency', value: `**${apiLatency}ms**`, inline: true }
                );
            sent.edit({ embeds: [pongEmbed] });
        });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        // Send an initial reply and fetch it to calculate latency
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

        // Calculate latencies
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const pongEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('<a:uptime:1382724374054043709> Latency')
            .addFields(
                { name: 'Round-trip Latency', value: `**${latency}ms**`, inline: true },
                { name: 'API Latency', value: `**${apiLatency}ms**`, inline: true }
            );

        // Edit the original reply with the final embed
        await interaction.editReply({ content: '', embeds: [pongEmbed] });
    }
};
