const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const UserWarnings = require('../../models/userWarnings');

module.exports = {
    name: 'warnings',
    description: 'Displays all warnings for a specific user.',
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply('<a:wrong:1381568998847545428> You do not have the required moderator role to use this command.');
        }

        const target = message.mentions.users.first() || message.author;

        const userWarnings = await UserWarnings.findOne({
            guildId: message.guild.id,
            userId: target.id,
        });

        if (!userWarnings || userWarnings.warnings.length === 0) {
            return message.channel.send(`${target.tag} has no warnings.`);
        }

        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle(`<a:loadingapoints:1381563531110912063> Warnings for ${target.tag}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }));

        // Loop through the warnings and add them as fields
        for (let i = 0; i < userWarnings.warnings.length; i++) {
            const warning = userWarnings.warnings[i];
            const moderator = message.guild.members.cache.get(warning.moderator);
            embed.addFields({
                name: `Warning ${i + 1}`,
                value: `**Moderator:** ${moderator ? moderator.user.tag : 'Unknown'}\n**Reason:** ${warning.reason}\n**Date:** ${warning.timestamp.toLocaleDateString()}`,
                inline: false,
            });
        }

        message.channel.send({ embeds: [embed] });
    },
};