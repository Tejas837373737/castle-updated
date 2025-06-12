const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'unmute',
    description: 'Removes a timeout from a member by mention or ID.',
    usage: '<@user|userID> [reason]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Removes a timeout from a user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to unmute.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for unmuting.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role.')] });
        }
        if (!args[0]) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}unmute <@user|userID> [reason]\``)]});
        }
        let member;
        try {
            member = message.mentions.members.first() || await message.guild.members.fetch(args[0]);
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user in this server.')]});
        }
        const target = member.user;
        const reason = args.slice(1).join(' ') || 'No reason provided';
        if (!member.isCommunicationDisabled()) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> User Not Muted').setDescription(`${target.tag} is not currently timed out.`)]});
        }
        try {
            await member.timeout(null, reason);
            const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> User Unmuted').addFields({ name: 'User', value: target.tag, inline: true },{ name: 'Moderator', value: message.author.tag, inline: true },{ name: 'Reason', value: reason }).setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });
            await sendModLog(message.client, message.guild, 'User Unmuted 🔈', '#17a2b8', [{ name: 'User', value: `${target.tag} (${target.id})` },{ name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },{ name: 'Reason', value: reason }]);
        } catch (error) {
            console.error(error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('I was unable to unmute this member.')] });
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.modRole || !interaction.member.roles.cache.has(guildConfig.modRole)) {
            const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const member = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const target = member.user;

        if (!member.isCommunicationDisabled()) {
            const embed = new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> User Not Muted').setDescription(`${target.tag} is not currently timed out.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            await interaction.deferReply({ ephemeral: true });
            await member.timeout(null, reason);
            
            const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> User Unmuted').addFields({ name: 'User', value: target.tag, inline: true },{ name: 'Moderator', value: interaction.user.tag, inline: true },{ name: 'Reason', value: reason }).setTimestamp();
            await interaction.channel.send({ embeds: [successEmbed] });

            await interaction.editReply({ content: 'Unmute was successful.' });

            await sendModLog(interaction.client, interaction.guild, 'User Unmuted 🔈', '#17a2b8', [{ name: 'User', value: `${target.tag} (${target.id})` },{ name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },{ name: 'Reason', value: reason }]);
        } catch (error) {
            console.error('Failed to unmute user via slash command:', error);
            await interaction.editReply({ content: 'An error occurred while trying to unmute this user.' });
        }
    }
};