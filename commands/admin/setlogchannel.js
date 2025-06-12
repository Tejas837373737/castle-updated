const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'setlogchannel',
    description: 'Sets the channel where moderation logs will be sent.',
    aliases: ['setmodlog'],
    usage: '#channel',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('setlogchannel')
        .setDescription('Sets the channel for moderation action logs.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send logs to.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)) // Ensures only text channels can be selected
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Only visible to admins

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const noPermsEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You must be an administrator to use this command.');
            return message.reply({ embeds: [noPermsEmbed] });
        }
        // Updated to handle channel ID as well for flexibility
        const logChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!logChannel || logChannel.type !== ChannelType.GuildText) {
            const noChannelEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('You must mention a valid text channel or provide its ID.');
            return message.reply({ embeds: [noChannelEmbed] });
        }
        await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { logChannelId: logChannel.id },
            { upsert: true }
        );
        const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> Log Channel Set').setDescription(`Moderation logs will now be sent to ${logChannel}.`);
        await message.reply({ embeds: [successEmbed] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        // The setDefaultMemberPermissions on the builder handles the permission check for slash commands.
        const logChannel = interaction.options.getChannel('channel');

        await interaction.deferReply({ ephemeral: true });

        try {
            await GuildConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { logChannelId: logChannel.id },
                { upsert: true, new: true }
            );

            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> Log Channel Set')
                .setDescription(`Moderation logs will now be sent to ${logChannel}.`);
            
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('setlogchannel slash command error:', error);
            await interaction.editReply({ content: 'An error occurred while setting the log channel.' });
        }
    }
};