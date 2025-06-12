const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const UserWarnings = require('../../models/userWarnings');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'warnings',
    description: 'Displays all warnings for a user by mention or ID.',
    usage: '[@user|userID]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Displays all warnings for a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose warnings you want to see (defaults to you).'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args, client) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role.')] });
        }
        let targetUser;
        try {
            if (message.mentions.users.first()) {
                targetUser = message.mentions.users.first();
            } else if (args[0]) {
                targetUser = await client.users.fetch(args[0]);
            } else {
                targetUser = message.author;
            }
        } catch (error) {
            const errorEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> User Not Found').setDescription('Could not find that user. Please provide a valid mention or User ID.');
            return message.reply({ embeds: [errorEmbed] });
        }
        const userWarnings = await UserWarnings.findOne({ guildId: message.guild.id, userId: targetUser.id });
        if (!userWarnings || userWarnings.warnings.length === 0) {
            const embed = new EmbedBuilder().setColor('#0099ff').setTitle(`Warnings for ${targetUser.tag}`).setDescription('This user has no warnings on record.');
            return message.channel.send({ embeds: [embed] });
        }
        const embed = new EmbedBuilder().setColor('#ffcc00').setTitle(`Warnings for ${targetUser.tag}`).setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
        for (const warning of userWarnings.warnings) {
            const moderator = await client.users.fetch(warning.moderator).catch(() => null);
            embed.addFields({
                name: `Warning ID: ${warning._id}`, // Using the unique warning ID
                value: `**Moderator:** ${moderator ? moderator.tag : 'Unknown'}\n**Reason:** ${warning.reason}\n**Date:** <t:${parseInt(warning.timestamp.getTime() / 1000)}:f>`,
                inline: false,
            });
        }
        await message.channel.send({ embeds: [embed] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.modRole || !interaction.member.roles.cache.has(guildConfig.modRole)) {
            const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // The target is the user option, or the person who ran the command if blank
        const targetUser = interaction.options.getUser('user') || interaction.user;

        await interaction.deferReply({ ephemeral: true });

        const userWarnings = await UserWarnings.findOne({ guildId: interaction.guild.id, userId: targetUser.id });

        if (!userWarnings || userWarnings.warnings.length === 0) {
            const embed = new EmbedBuilder().setColor('#0099ff').setTitle(`Warnings for ${targetUser.tag}`).setDescription('This user has no warnings on record.');
            return interaction.editReply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder().setColor('#ffcc00').setTitle(`Warnings for ${targetUser.tag}`).setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
        
        // Using a for...of loop to handle async fetch inside
        for (const warning of userWarnings.warnings) {
            const moderator = await interaction.client.users.fetch(warning.moderator).catch(() => null);
            embed.addFields({
                name: `Warning ID: ${warning._id}`,
                value: `**Moderator:** ${moderator ? moderator.tag : 'Unknown'}\n**Reason:** ${warning.reason}\n**Date:** <t:${parseInt(warning.timestamp.getTime() / 1000)}:f>`,
                inline: false,
            });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};