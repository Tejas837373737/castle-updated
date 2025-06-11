const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    name: 'remove-count-channel',
    description: 'Removes a channel from the message counting list.',
    usage: '[#channel|channelID]',
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')] });
        }
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
        await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { $pull: { countableChannels: channel.id } } // $pull removes the item from the array
        );
        await message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Channel Removed').setDescription(`Messages in ${channel} will no longer be counted.`)] });
    },
};