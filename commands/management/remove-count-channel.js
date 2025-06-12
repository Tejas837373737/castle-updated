const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'remove-count-channel',
    description: 'Removes a channel from the message counting list.',
    usage: '[#channel|channelID]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('remove-count-channel')
        .setDescription('Removes a channel from the message counting list.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to stop counting messages in.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)) // Only allow text channels
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')] });
        }
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
        
        const updatedConfig = await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { $pull: { countableChannels: channel.id } }, // $pull removes the item from the array
            { new: true }
        );

        // Check if the channel was actually in the list to begin with
        if (guildConfig.countableChannels.includes(channel.id)) {
            await message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:Green_Tick:1381583016073363508> Channel Removed').setDescription(`Messages in ${channel} will no longer be counted.`)] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('Not Found').setDescription(`${channel} was not in the message counting list.`)] });
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !interaction.member.roles.cache.has(guildConfig.managerRoleId)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')], ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel');

        // Check if the channel is actually in the list before trying to remove it
        if (!guildConfig.countableChannels || !guildConfig.countableChannels.includes(channel.id)) {
            const notFoundEmbed = new EmbedBuilder()
                .setColor('#ffc107')
                .setTitle('Not Found')
                .setDescription(`${channel} is not currently in the message counting list.`);
            return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }
        
        // --- Database Action ---
        await GuildConfig.updateOne(
            { guildId: interaction.guild.id },
            { $pull: { countableChannels: channel.id } }
        );

        // --- Confirmation ---
        const successEmbed = new EmbedBuilder()
            .setColor('#dc3545')
            .setTitle('<a:Green_Tick:1381583016073363508> Channel Removed')
            .setDescription(`Messages in ${channel} will no longer be counted.`);
        
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
};