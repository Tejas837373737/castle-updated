const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    name: 'setsnipelog',
    description: 'Sets the channel where deleted message logs will be sent.',
    usage: '[#channel|channelID]',
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('The Manager Role has not been set up. An admin must run `!setmanagerrole` first.')] });
        }
        if (!message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required Manager Role to use this command.')] });
        }

        // --- Target Channel ---
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;

        // --- Database Action ---
        await GuildConfig.findOneAndUpdate(
            { guildId: message.guild.id },
            { snipeLogChannelId: channel.id },
            { upsert: true, new: true }
        );

        // --- Confirmation ---
        const successEmbed = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('<a:Green_Tick:1381583016073363508> Snipe Log Channel Set')
            .setDescription(`Deleted messages will now be logged in ${channel}.`);
        await message.reply({ embeds: [successEmbed] });
    },
};