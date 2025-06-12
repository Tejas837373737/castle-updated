const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'unban',
    description: 'Revokes the ban for a user using their user ID.',
    usage: '<userID> [reason]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Revokes a ban for a user.')
        // For unban, we must ask for a string ID, as the user is not in the server to be tagged.
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user to unban.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the unban.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role.')] });
        }
        const userIdArg = args[0];
        if (!userIdArg) {
            const noIdEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}unban <userID>\`\nYou must provide the User ID of the person you want to unban.`);
            return message.reply({ embeds: [noIdEmbed] });
        }
        const userId = userIdArg.replace(/<@!?|>/g, '');
        const reason = args.slice(1).join(' ') || 'No reason provided';
        try {
            const bannedUser = await message.guild.bans.fetch(userId);
            if (!bannedUser) {
                 return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('This user is not on the server\'s ban list.')] });
            }
            await message.guild.bans.remove(userId, reason);
            const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> User Unbanned').addFields({ name: 'User', value: bannedUser.user.tag, inline: true },{ name: 'Moderator', value: message.author.tag, inline: true },{ name: 'Reason', value: reason }).setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });
            await sendModLog(message.client, message.guild, 'User Unbanned ✅', '#20c997', [{ name: 'User', value: `${bannedUser.user.tag} (${bannedUser.user.id})` },{ name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },{ name: 'Reason', value: reason }]);
        } catch (error) {
            console.error(error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('Could not unban this user. Please ensure the User ID is correct and the user is actually banned.')] });
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.modRole || !interaction.member.roles.cache.has(guildConfig.modRole)) {
            const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        await interaction.deferReply({ ephemeral: true });

        try {
            const bannedUser = await interaction.guild.bans.fetch(userId);
            if (!bannedUser) {
                const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('This user is not on the server\'s ban list.');
                return interaction.editReply({ embeds: [embed] });
            }

            await interaction.guild.bans.remove(userId, reason);
            
            const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> User Unbanned').addFields({ name: 'User', value: bannedUser.user.tag, inline: true },{ name: 'Moderator', value: interaction.user.tag, inline: true },{ name: 'Reason', value: reason }).setTimestamp();
            await interaction.channel.send({ embeds: [successEmbed] });
            
            await interaction.editReply({ content: 'Unban was successful.' });

            await sendModLog(interaction.client, interaction.guild, 'User Unbanned ✅', '#20c997', [{ name: 'User', value: `${bannedUser.user.tag} (${bannedUser.user.id})` },{ name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },{ name: 'Reason', value: reason }]);
        } catch (error) {
            console.error('Failed to unban user via slash command:', error);
            await interaction.editReply({ content: 'Could not unban this user. The ID may be invalid or they are not banned.' });
        }
    }
};