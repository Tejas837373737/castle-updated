const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'kick',
    description: 'Kicks a member from the server by mention or ID.',
    usage: '<@user|userID> [reason]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to kick.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for kicking.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')]});
        }

        // --- Target Resolver ---
        if (!args[0]) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}kick <@user|userID> [reason]\``)]});
        }
        
        let member;
        try {
            const mentionedMember = message.mentions.members.first();
            if (mentionedMember) {
                member = mentionedMember;
            } else {
                member = await message.guild.members.fetch(args[0]);
            }
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user in this server. Please provide a valid mention or User ID.')]});
        }
        
        const target = member.user;
        if (!member.kickable) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('I cannot kick this user. They may have a higher role than me.')]});
        }

        // --- Action ---
        const reason = args.slice(1).join(' ') || 'No reason provided';
        try {
            await member.kick(reason);

            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> User Kicked')
                .addFields(
                    { name: 'User', value: target.tag, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason }
                ).setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });

            await sendModLog(message.client, message.guild, 'User Kicked 👢', '#ff9900',
                [{ name: 'User', value: `${target.tag} (${target.id})` }, { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` }, { name: 'Reason', value: reason }]
            );
        } catch (error) {
            console.error('Failed to kick user:', error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('An error occurred while trying to kick this user.')] });
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        // Permission Check
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.modRole || !interaction.member.roles.cache.has(guildConfig.modRole)) {
            const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Get Options
        const member = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const target = member.user;

        // Hierarchy Check
        if (!member.kickable) {
            const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('I cannot kick this user. They may have a higher role than me.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Action
        try {
            await interaction.deferReply({ ephemeral: true });
            await member.kick(reason);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> User Kicked')
                .addFields(
                    { name: 'User', value: target.tag, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason }
                ).setTimestamp();
            
            await interaction.channel.send({ embeds: [successEmbed] });
            await interaction.editReply({ content: 'Kick was successful.' });

            await sendModLog(interaction.client, interaction.guild, 'User Kicked 👢', '#ff9900',
                [{ name: 'User', value: `${target.tag} (${target.id})` }, { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})` }, { name: 'Reason', value: reason }]
            );
        } catch (error) {
            console.error('Failed to kick user via slash command:', error);
            await interaction.editReply({ content: 'An error occurred while trying to kick this user.' });
        }
    }
};