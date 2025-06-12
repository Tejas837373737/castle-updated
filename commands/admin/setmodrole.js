const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js'); // <-- FIX IS HERE
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'setmodrole',
    description: 'Sets the moderator role for this server.',
    usage: '@role',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('setmodrole')
        .setDescription('Sets the role for core moderation commands (kick, ban, etc).')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to designate as Moderator.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // --- Execute Function for Prefix Command ---
    async execute(message, args) {
        // This line will now work because PermissionsBitField is imported
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const noPermsEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You must be an administrator to use this command.');
            return message.reply({ embeds: [noPermsEmbed] });
        }
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role) {
            const noRoleEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('You must mention a role or provide a valid role ID.');
            return message.reply({ embeds: [noRoleEmbed] });
        }
        if (role.managed || role.id === message.guild.id) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid Role').setDescription('You cannot set a bot role or @everyone as the moderator role.')] });
        }
        await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { modRole: role.id },
            { upsert: true, new: true }
        );
        const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> Moderator Role Set').setDescription(`The moderator role has been successfully set to ${role}.`);
        await message.reply({ embeds: [successEmbed] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        // The Administrator check for slash commands is handled by setDefaultMemberPermissions
        const role = interaction.options.getRole('role');
        if (role.managed || role.id === interaction.guild.id) {
            const embed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid Role').setDescription('You cannot set a bot role or the @everyone role as the moderator role.');
            return interaction.reply({ embeds: [embed], ephemeral: true, flags: 64 });
        }
        await interaction.deferReply({ ephemeral: true, flags: 64 });
        try {
            await GuildConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { modRole: role.id },
                { upsert: true, new: true }
            );
            const successEmbed = new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> Moderator Role Set').setDescription(`The moderator role has been successfully set to ${role}.`);
            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('setmodrole slash command error:', error);
            await interaction.editReply({ content: 'An error occurred while setting the moderator role.' });
        }
    }
};