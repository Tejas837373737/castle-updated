const { EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    name: 'setlogchannel',
    description: 'Sets the channel where moderation logs will be sent.',
    aliases: ['setmodlog'],
    usage: '#channel',
    // Ensure the 'async' keyword is here!
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const noPermsEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('<a:wrong:1381568998847545428> Permission Denied')
                .setDescription('You must be an administrator to use this command.');
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const logChannel = message.mentions.channels.first();
        if (!logChannel || logChannel.type !== ChannelType.GuildText) {
            const noChannelEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('<a:wrong:1381568998847545428> Error')
                .setDescription('You must mention a valid text channel.');
            return message.reply({ embeds: [noChannelEmbed] });
        }

        await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { logChannelId: logChannel.id },
            { upsert: true }
        );

        const successEmbed = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('<a:Green_Tick:1381583016073363508> Log Channel Set')
            .setDescription(`Moderation logs will now be sent to ${logChannel}.`);
        await message.reply({ embeds: [successEmbed] });
    },
};