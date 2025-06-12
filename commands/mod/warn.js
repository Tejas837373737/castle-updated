const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const UserWarnings = require('../../models/userWarnings');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'warn',
    description: 'Warns a user by mention or ID, logs it, and DMs them.',
    usage: '<@user|userID> [reason]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warns a user, logs it, and sends them a DM.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to warn.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the warning.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')] });
        }
        if (!args[0]) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}warn <@user|userID> [reason]\``)]});
        }
        let member;
        try {
            member = message.mentions.members.first() || await message.guild.members.fetch(args[0]);
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user in this server.')]});
        }
        const target = member.user;
        const reason = args.slice(1).join(' ');
        if (!reason) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('You must provide a reason for the warning.')] });
        }
        if (target.id === message.author.id) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> Wait a second...').setDescription('You can\'t warn yourself!')]});
        }
        if (target.id === message.client.user.id) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> Wait a second...').setDescription('You can\'t warn me!')]});
        }
        const userWarnings = await UserWarnings.findOneAndUpdate({ guildId: message.guild.id, userId: target.id }, { $push: { warnings: { moderator: message.author.id, reason: reason } } }, { upsert: true, new: true });
        let dmSent = true;
        try {
            const dmEmbed = new EmbedBuilder().setColor('#ffc107').setTitle(`You have been warned in ${message.guild.name}`).addFields({ name: 'Reason', value: reason },{ name: 'Moderator', value: message.author.tag }).setTimestamp();
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            dmSent = false;
            console.log(`Could not DM user ${target.tag}. They may have DMs disabled.`);
        }
        const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> User Warned').addFields({ name: 'User', value: target.tag, inline: true },{ name: 'Moderator', value: message.author.tag, inline: true },{ name: 'Total Warnings', value: `${userWarnings.warnings.length}`},{ name: 'Reason', value: reason }).setFooter({ text: `User notified via DM: ${dmSent ? '✅ Yes' : '❌ No'}` });
        message.channel.send({ embeds: [successEmbed] });
        await sendModLog(message.client, message.guild, 'User Warned ⚠️', '#ffc107', [{ name: 'User', value: `${target.tag} (${target.id})` },{ name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },{ name: 'Reason', value: reason }]);
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.modRole || !interaction.member.roles.cache.has(guildConfig.modRole)) {
            const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');

        if (target.id === interaction.user.id) {
            const embed = new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> Wait a second...').setDescription('You can\'t warn yourself!');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (target.id === interaction.client.user.id) {
            const embed = new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> Wait a second...').setDescription('You can\'t warn me!');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: true });

        const userWarnings = await UserWarnings.findOneAndUpdate({ guildId: interaction.guild.id, userId: target.id }, { $push: { warnings: { moderator: interaction.user.id, reason: reason } } }, { upsert: true, new: true });
        
        let dmSent = true;
        try {
            const dmEmbed = new EmbedBuilder().setColor('#ffc107').setTitle(`You have been warned in ${interaction.guild.name}`).addFields({ name: 'Reason', value: reason },{ name: 'Moderator', value: interaction.user.tag }).setTimestamp();
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            dmSent = false;
            console.log(`Could not DM user ${target.tag}. They may have DMs disabled.`);
        }

        const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> User Warned').addFields({ name: 'User', value: target.tag, inline: true },{ name: 'Moderator', value: interaction.user.tag, inline: true },{ name: 'Total Warnings', value: `${userWarnings.warnings.length}`},{ name: 'Reason', value: reason }).setFooter({ text: `User notified via DM: ${dmSent ? '✅ Yes' : '❌ No'}` });
        await interaction.channel.send({ embeds: [successEmbed] });

        await interaction.editReply({ content: 'Warning was successful.' });

        await sendModLog(interaction.client, interaction.guild, 'User Warned ⚠️', '#ffc107', [{ name: 'User', value: `${target.tag} (${target.id})` },{ name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },{ name: 'Reason', value: reason }]);
    }
};