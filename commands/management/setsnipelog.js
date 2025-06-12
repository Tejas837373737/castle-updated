const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'setsnipelog',
    description: 'Sets the channel where deleted message logs will be sent.',
    usage: '[#channel|channelID]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('setsnipelog')
        .setDescription('Sets the channel for automatic deleted message logs.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send snipe logs to. Defaults to the current channel.')
                .addChannelTypes(ChannelType.GuildText)) // Only allow text channels
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('The Manager Role has not been set up. An admin must run `!setmanagerrole` first.')] });
        }
        if (!message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required Manager Role to use this command.')] });
        }
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
        await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { snipeLogChannelId: channel.id },
            { upsert: true, new: true }
        );
        const successEmbed = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('<a:Green_Tick:1381583016073363508> Snipe Log Channel Set')
            .setDescription(`Deleted messages will now be logged in ${channel}.`);
        await message.reply({ embeds: [successEmbed] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !interaction.member.roles.cache.has(guildConfig.managerRoleId)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required Manager Role.')], ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel') || interaction.channel;

        await interaction.deferReply({ ephemeral: true });

        try {
            await GuildConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { snipeLogChannelId: channel.id },
                { upsert: true, new: true }
            );

            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> Snipe Log Channel Set')
                .setDescription(`Deleted messages will now be automatically logged in ${channel}.`);
            
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('setsnipelog slash command error:', error);
            await interaction.editReply({ content: 'An error occurred while setting the snipe log channel.' });
        }
    }
};