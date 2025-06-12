const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MessageCount = require('../../models/messageCount');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'totalmessages',
    description: 'Shows the total number of messages counted in the server.',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('totalmessages')
        .setDescription('Shows the total number of messages counted in the server.'),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args, client) {
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

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        await interaction.deferReply();

        const result = await MessageCount.aggregate([
            { $match: { guildId: interaction.guild.id } },
            { $group: { _id: null, total: { $sum: '$messageCount' } } }
        ]);
        const totalCount = result[0]?.total || 0;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Total Messages in ${interaction.guild.name}`)
            .setDescription(`A grand total of **${totalCount.toLocaleString()}** messages have been counted across all designated channels.`);
            
        await interaction.editReply({ embeds: [embed] });
    }
};