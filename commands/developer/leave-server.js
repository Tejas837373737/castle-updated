const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'leave-server',
    description: 'Forces the bot to leave a specified server.',
    usage: '<serverID>',
    developerOnly: true, // Ensures it's hidden from the help command for non-devs

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('leave-server')
        .setDescription('Forces the bot to leave a specified server.')
        .addStringOption(option =>
            option.setName('serverid')
                .setDescription('The ID of the server to leave.')
                .setRequired(true)),

    // --- Execute Function for Prefix Command ---
    async execute(message, args, client) {
        if (message.author.id !== process.env.DEVELOPER_ID) return;

        const guildId = args[0];
        if (!guildId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setDescription('You must provide a Server ID.')] });
        }

        // Find the guild (server) in the bot's cache
        const guild = await client.guilds.fetch(guildId).catch(() => null);

        if (!guild) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setDescription('I am not in a server with that ID.')] });
        }

        try {
            // Tell the bot to leave
            await guild.leave();
            await message.reply({ embeds: [new EmbedBuilder().setColor('#28a745').setDescription(`✅ Successfully left the server: **${guild.name}**`)] });
        } catch (error) {
            console.error(`Failed to leave guild ${guildId}:`, error);
            await message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setDescription('An error occurred while trying to leave the server.')] });
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        if (interaction.user.id !== process.env.DEVELOPER_ID) {
            return interaction.reply({ content: 'This command is restricted to the bot developer.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        
        const guildId = interaction.options.getString('serverid');
        const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);

        if (!guild) {
            return interaction.editReply({ content: 'I am not in a server with that ID.' });
        }

        try {
            await guild.leave();
            await interaction.editReply({ content: `✅ Successfully left the server: **${guild.name}**` });
        } catch (error) {
            console.error(`Failed to leave guild ${guildId} via slash command:`, error);
            await interaction.editReply({ content: 'An error occurred while trying to leave the server.' });
        }
    }
};