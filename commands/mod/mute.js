const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');
const ms = require('ms');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'mute',
    description: 'Mutes a member with an optional duration (defaults to permanent).',
    aliases: ['timeout'],
    usage: '<@user|userID> [duration] [reason]',
    
    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Times out a user. Defaults to 28 days if no duration is provided.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to mute.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the mute (e.g., 10m, 1h, 7d). Optional.'))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the mute.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')]});
        }
        if (!args[0]) return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}mute <@user|userID> [duration] [reason]\``)]});
        let member;
        try {
            member = message.mentions.members.first() || await message.guild.members.fetch(args[0]);
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user in this server.')]});
        }
        const target = member.user;
        const permanentDuration = 28 * 24 * 60 * 60 * 1000;
        let durationMs, durationArg, reason;
        const potentialDuration = args[1];
        const parsedMs = ms(potentialDuration || '0');
        if (typeof parsedMs === 'number' && parsedMs > 0) {
            durationMs = parsedMs;
            durationArg = potentialDuration;
            reason = args.slice(2).join(' ') || 'No reason provided';
        } else {
            durationMs = permanentDuration;
            durationArg = 'Permanent (28 Days)';
            reason = args.slice(1).join(' ') || 'No reason provided';
        }
        if (durationMs > permanentDuration) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Duration Too Long').setDescription('The mute duration cannot exceed 28 days.')]});
        }
        try {
            await member.timeout(durationMs, reason);
            const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> User Muted').addFields({ name: 'User', value: target.tag, inline: true },{ name: 'Duration', value: durationArg, inline: true },{ name: 'Moderator', value: message.author.tag },{ name: 'Reason', value: reason }).setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });
            await sendModLog(message.client, message.guild, 'User Muted 🔇', '#6c757d', [{ name: 'User', value: `${target.tag} (${target.id})` },{ name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },{ name: 'Duration', value: durationArg },{ name: 'Reason', value: reason }]);
        } catch (error) {
            console.error(error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('I was unable to mute this member. They may have a higher role than me.')]});
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.modRole || !interaction.member.roles.cache.has(guildConfig.modRole)) {
            const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const member = interaction.options.getMember('target');
        const target = interaction.options.getUser('target');
        const durationInput = interaction.options.getString('duration');
        const reasonInput = interaction.options.getString('reason');

        if (!member.moderatable) {
            const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('I cannot mute this user. They may have a higher role than me.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const permanentDuration = 28 * 24 * 60 * 60 * 1000;
        let durationMs = permanentDuration;
        let durationArg = 'Permanent (28 Days)';
        const reason = reasonInput || 'No reason provided';
        
        if (durationInput) {
            const parsedMs = ms(durationInput);
            if (!parsedMs || parsedMs > permanentDuration) {
                const embed = new EmbedBuilder().setColor('#dc3545').setTitle('Invalid Duration').setDescription('Please provide a valid duration (e.g., 10m, 1h, 7d) that is less than 28 days.');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            durationMs = parsedMs;
            durationArg = durationInput;
        }

        try {
            await interaction.deferReply({ ephemeral: true });
            await member.timeout(durationMs, reason);
            
            const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> User Muted').addFields({ name: 'User', value: target.tag, inline: true },{ name: 'Duration', value: durationArg, inline: true },{ name: 'Moderator', value: interaction.user.tag },{ name: 'Reason', value: reason }).setTimestamp();
            await interaction.channel.send({ embeds: [successEmbed] });
            await interaction.editReply({ content: 'Mute was successful.' });

            await sendModLog(interaction.client, interaction.guild, 'User Muted 🔇', '#6c757d', [{ name: 'User', value: `${target.tag} (${target.id})` },{ name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },{ name: 'Duration', value: durationArg },{ name: 'Reason', value: reason }]);
        } catch (error) {
            console.error('Failed to mute user via slash command:', error);
            await interaction.editReply({ content: 'An error occurred while trying to mute this user.' });
        }
    }
};