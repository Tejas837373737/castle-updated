const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    name: 'setmanagerrole',
    description: 'Sets the Manager role, allowed to use lock/unlock commands.',
    usage: '@role',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const noPermsEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('<a:wrong:1381568998847545428> Permission Denied')
                .setDescription('You must be an administrator to use this command.');
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role) {
            const noRoleEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('<a:wrong:1381568998847545428> Error')
                .setDescription('You must mention a role or provide a valid role ID.');
            return message.reply({ embeds: [noRoleEmbed] });
        }

        await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { managerRoleId: role.id },
            { upsert: true, new: true }
        );

        const successEmbed = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('<a:Green_Tick:1381583016073363508> Manager Role Set')
            .setDescription(`Users with the ${role} role can now use channel management commands.`);
        await message.reply({ embeds: [successEmbed] });
    },
};