const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    name: 'add-count-channel',
    description: 'Adds a channel to the list of channels where messages are counted.',
    usage: '[#channel|channelID]',
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')] });
        }
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
        await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { $addToSet: { countableChannels: channel.id } }, // $addToSet prevents duplicates
            { upsert: true }
        );
        await message.reply({ embeds: [new EmbedBuilder().setColor('#28a745').setTitle('<a:Green_Tick:1381583016073363508> Channel Added').setDescription(`Messages in ${channel} will now be counted.`)] });
    },
};