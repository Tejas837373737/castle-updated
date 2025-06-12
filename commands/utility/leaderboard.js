const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MessageCount = require('../../models/messageCount');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'leaderboard',
    description: 'Shows the message count leaderboard.',
    aliases: ['lb'],

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the message count leaderboard.'),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args, client) { // Added client for consistency
        const results = await MessageCount.find({ guildId: message.guild.id })
            .sort({ messageCount: -1 })
            .limit(10);

        if (results.length === 0) {
            return message.reply('No message data found to create a leaderboard.');
        }

        // Using a for...of loop is safer for async operations inside
        const leaderboardEntries = [];
        let i = 1;
        for (const result of results) {
            const user = await client.users.fetch(result.userId).catch(() => ({ tag: 'Unknown User' }));
            leaderboardEntries.push(`**${i}.** ${user.tag} - **${result.messageCount.toLocaleString()}** messages`);
            i++;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(`Message Leaderboard for ${message.guild.name}`)
            .setDescription(leaderboardEntries.join('\n'));
        await message.reply({ embeds: [embed] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        await interaction.deferReply();

        const results = await MessageCount.find({ guildId: interaction.guild.id })
            .sort({ messageCount: -1 })
            .limit(10);

        if (results.length === 0) {
            return interaction.editReply('No message data found to create a leaderboard.');
        }

        const leaderboardEntries = [];
        let i = 1;
        for (const result of results) {
            const user = await interaction.client.users.fetch(result.userId).catch(() => ({ tag: 'Unknown User' }));
            leaderboardEntries.push(`**${i}.** ${user.tag} - **${result.messageCount.toLocaleString()}** messages`);
            i++;
        }

        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(`Message Leaderboard for ${interaction.guild.name}`)
            .setDescription(leaderboardEntries.join('\n'));
        
        await interaction.editReply({ embeds: [embed] });
    }
};