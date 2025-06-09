const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const UserWarnings = require('../../models/userWarnings');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'warn',
    description: 'Warns a user and logs the warning.',
    usage: '@user [reason]',
    // Ensure the 'async' keyword is here!
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')] });
        }

        const target = message.mentions.users.first();
        if (!target) return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('Please mention the user to warn.')] });

        const reason = args.slice(1).join(' ');
        if (!reason) return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('You must provide a reason for the warning.')] });

        const userWarnings = await UserWarnings.findOneAndUpdate(
            { guildId: message.guild.id, userId: target.id },
            { $push: { warnings: { moderator: message.author.id, reason: reason } } },
            { upsert: true, new: true }
        );

        const successEmbed = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('<a:Green_Tick:1381583016073363508> User Warned')
            .addFields(
                { name: 'User', value: target.tag, inline: true },
                { name: 'Moderator', value: message.author.tag, inline: true },
                { name: 'Total Warnings', value: `${userWarnings.warnings.length}` },
                { name: 'Reason', value: reason }
            ).setTimestamp();

        message.channel.send({ embeds: [successEmbed] });

        await sendModLog(
            message.client,
            message.guild,
            'User Warned ⚠️',
            '#ffc107',
            [
                { name: 'User', value: `${target.tag} (${target.id})` },
                { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                { name: 'Reason', value: reason }
            ]
        );
    },
};