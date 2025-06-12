const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendServerLog } = require('../../utils/serverlog');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'role',
    description: 'Toggles a role for a user (adds if they don\'t have it, removes if they do).',
    usage: '<@user|userID> <@role|roleID>',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Toggles a role for a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to manage.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to add or remove.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args, client) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')] });
        }
        const [targetArg, roleArg] = args;
        if (!targetArg || !roleArg) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> Invalid Usage').setDescription(`**Usage:** \`${process.env.PREFIX}role <@user|userID> <@role|roleID>\``)] });
        }
        let targetMember;
        try {
            targetMember = message.mentions.members.first() || await message.guild.members.fetch(targetArg);
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user in this server.')] });
        }
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(roleArg.replace(/<@&|>/g, ''));
        if (!role) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid Role').setDescription('Could not find that role.')] });
        }
        if (role.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Error').setDescription('You cannot manage a role that is higher than your own.')] });
        }
        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Bot Permission Error').setDescription('I cannot manage a role higher than my own.')] });
        }
        try {
            if (targetMember.roles.cache.has(role.id)) {
                await targetMember.roles.remove(role);
                const successEmbed = new EmbedBuilder().setColor('#dc3545').setDescription(`<a:Green_Tick:1381583016073363508> Successfully **removed** the ${role} role from ${targetMember}.`);
                await message.reply({ embeds: [successEmbed] });
                await sendServerLog(message.client, message.guild, 'Role Removed', '#dc3545', [{ name: 'User', value: `${targetMember.user.tag}`, inline: true }, { name: 'Role', value: `${role.name}`, inline: true }, { name: 'Manager', value: message.author.tag }]);
            } else {
                await targetMember.roles.add(role);
                const successEmbed = new EmbedBuilder().setColor('#28a745').setDescription(`<a:Green_Tick:1381583016073363508> Successfully **added** the ${role} role to ${targetMember}.`);
                await message.reply({ embeds: [successEmbed] });
                await sendServerLog(message.client, message.guild, 'Role Added', '#28a745', [{ name: 'User', value: `${targetMember.user.tag}`, inline: true }, { name: 'Role', value: `${role.name}`, inline: true }, { name: 'Manager', value: message.author.tag }]);
            }
        } catch (error) {
            console.error('Role command error:', error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('An unexpected error occurred.')] });
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !interaction.member.roles.cache.has(guildConfig.managerRoleId)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')], ephemeral: true });
        }

        const targetMember = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        if (role.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Error').setDescription('You cannot manage a role that is higher than your own.')], ephemeral: true });
        }
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Bot Permission Error').setDescription('I cannot manage that role as it is higher than my own.')], ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: true });

        try {
            if (targetMember.roles.cache.has(role.id)) {
                await targetMember.roles.remove(role);
                const successEmbed = new EmbedBuilder().setColor('#dc3545').setDescription(`<a:Green_Tick:1381583016073363508> Successfully **removed** the ${role} role from ${targetMember}.`);
                await interaction.channel.send({ embeds: [successEmbed] });
                await interaction.editReply({ content: 'Role removed.' });
                await sendServerLog(interaction.client, interaction.guild, 'Role Removed', '#dc3545', [{ name: 'User', value: `${targetMember.user.tag}`, inline: true }, { name: 'Role', value: `${role.name}`, inline: true }, { name: 'Manager', value: interaction.user.tag }]);
            } else {
                await targetMember.roles.add(role);
                const successEmbed = new EmbedBuilder().setColor('#28a745').setDescription(`<a:Green_Tick:1381583016073363508> Successfully **added** the ${role} role to ${targetMember}.`);
                await interaction.channel.send({ embeds: [successEmbed] });
                await interaction.editReply({ content: 'Role added.' });
                await sendServerLog(interaction.client, interaction.guild, 'Role Added', '#28a745', [{ name: 'User', value: `${targetMember.user.tag}`, inline: true }, { name: 'Role', value: `${role.name}`, inline: true }, { name: 'Manager', value: interaction.user.tag }]);
            }
        } catch (error) {
            console.error('Role slash command error:', error);
            await interaction.editReply({ content: 'An unexpected error occurred while managing roles.' });
        }
    }
};