const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
// CORRECTED: Using the server log for a server management action
const { sendServerLog } = require('../../utils/serverlog');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'lock',
    description: 'Locks the current channel, preventing @everyone from sending messages.',
    usage: '',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Locks a channel, preventing @everyone from sending messages.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to lock (defaults to the current channel).')
                .addChannelTypes(ChannelType.GuildText)) // Only allow text channels
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for locking the channel.')),

    // --- Execute Function for Prefix Command (with log correction) ---
    async execute(message) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('The Manager Role has not been set up for this server.')] });
        }
        if (!message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required Manager Role.')] });
        }
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: false,
            });
            const successEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('Channel Locked <a:Green_Tick:1381583016073363508>')
                .setDescription(`This channel has been locked by ${message.author}.`);
            await message.channel.send({ embeds: [successEmbed] });

            // CORRECTED: Sending to server log instead of mod log
            await sendServerLog(message.client, message.guild, 'Channel Locked 🔒', '#dc3545',
                [{ name: 'Channel', value: `${message.channel}` }, { name: 'Manager', value: `${message.author.tag} (${message.author.id})` }]
            );
        } catch (error) {
            console.error(error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('I was unable to lock this channel. Please check my permissions.')] });
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !interaction.member.roles.cache.has(guildConfig.managerRoleId)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required Manager Role.')], ephemeral: true });
        }

        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        await interaction.deferReply({ ephemeral: true });

        try {
            await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false,
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('Channel Locked <a:Green_Tick:1381583016073363508>')
                .setDescription(`This channel has been locked by ${interaction.user}.`)
                .addFields({ name: 'Reason', value: reason });
            
            await targetChannel.send({ embeds: [successEmbed] });
            await interaction.editReply({ content: `Successfully locked ${targetChannel}.` });

            // CORRECTED: Sending to server log instead of mod log
            await sendServerLog(interaction.client, interaction.guild, 'Channel Locked 🔒', '#dc3545',
                [{ name: 'Channel', value: `${targetChannel}` }, { name: 'Manager', value: `${interaction.user.tag} (${interaction.user.id})` }, { name: 'Reason', value: reason }]
            );
        } catch (error) {
            console.error(`Failed to lock channel:`, error);
            await interaction.editReply({ content: `I was unable to lock this channel. Please check my permissions in ${targetChannel}.` });
        }
    }
};