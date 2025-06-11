const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
// --- IMPORTANT: This line MUST require 'serverlog' ---
const { sendServerLog } = require('../../utils/serverlog');

module.exports = {
    name: 'role',
    description: 'Toggles a role for a user (adds if they don\'t have it, removes if they do).',
    usage: '<@user|userID> <@role|roleID>',
    async execute(message, args) {
        // --- Permission Checks (No changes here) ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428>Error').setDescription('The Manager Role has not been set up.')] });
        }
        if (!message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')] });
        }

        // --- Argument and Target Resolution (No changes here) ---
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
        
        // --- Hierarchy Checks (No changes here) ---
        if (role.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Error').setDescription('You cannot manage a role higher than your own.')] });
        }
        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Bot Permission Error').setDescription('I cannot manage a role higher than my own.')] });
        }

        // --- Toggle Logic ---
        try {
            if (targetMember.roles.cache.has(role.id)) {
                // --- REMOVE ROLE ---
                await targetMember.roles.remove(role);
                const successEmbed = new EmbedBuilder().setColor('#dc3545').setDescription(`<a:Green_Tick:1381583016073363508> Successfully **removed** the ${role} role from ${targetMember}.`);
                await message.reply({ embeds: [successEmbed] });
                
                // --- IMPORTANT: This now calls sendServerLog ---
                await sendServerLog(message.client, message.guild, 'Role Removed', '#dc3545', [{ name: 'User', value: `${targetMember.user.tag}`, inline: true }, { name: 'Role', value: `${role.name}`, inline: true }, { name: 'Manager', value: message.author.tag }]);

            } else {
                // --- ADD ROLE ---
                await targetMember.roles.add(role);
                const successEmbed = new EmbedBuilder().setColor('#28a745').setDescription(`<a:Green_Tick:1381583016073363508> Successfully **added** the ${role} role to ${targetMember}.`);
                await message.reply({ embeds: [successEmbed] });

                // --- IMPORTANT: This also calls sendServerLog ---
                await sendServerLog(message.client, message.guild, 'Role Added', '#28a745', [{ name: 'User', value: `${targetMember.user.tag}`, inline: true }, { name: 'Role', value: `${role.name}`, inline: true }, { name: 'Manager', value: message.author.tag }]);
            }
        } catch (error) {
            console.error('Role command error:', error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('An unexpected error occurred.')] });
        }
    },
};