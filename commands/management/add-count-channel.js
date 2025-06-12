const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'add-count-channel',
    description: 'Adds a channel to the list of channels where messages are counted.',
    usage: '[#channel|channelID]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('add-count-channel')
        .setDescription('Adds a channel to the message counting list.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to start counting in. Defaults to the current channel.')
                .addChannelTypes(ChannelType.GuildText))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')] });
        }
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
        
        // Check if channel is already in the list to provide better feedback
        if (guildConfig.countableChannels && guildConfig.countableChannels.includes(channel.id)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('Already Added').setDescription(`${channel} is already on the message counting list.`)] });
        }

        await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { $addToSet: { countableChannels: channel.id } }, // $addToSet prevents duplicates
            { upsert: true }
        );
        await message.reply({ embeds: [new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> Channel Added').setDescription(`Messages in ${channel} will now be counted.`)] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !interaction.member.roles.cache.has(guildConfig.managerRoleId)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')], ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel') || interaction.channel;

        // Check if the channel is already in the list
        if (guildConfig.countableChannels && guildConfig.countableChannels.includes(channel.id)) {
            const alreadyAddedEmbed = new EmbedBuilder()
                .setColor('#ffc107')
                .setTitle('Already Added')
                .setDescription(`${channel} is already on the message counting list.`);
            return interaction.reply({ embeds: [alreadyAddedEmbed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            await GuildConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { $addToSet: { countableChannels: channel.id } },
                { upsert: true, new: true }
            );

            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> Channel Added')
                .setDescription(`Messages in ${channel} will now be counted.`);
            
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('add-count-channel slash command error:', error);
            await interaction.editReply({ content: 'An error occurred while adding the channel.' });
        }
    }
};