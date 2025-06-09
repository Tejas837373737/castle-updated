const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'kick',
    description: 'Kicks a member from the server.',
    usage: '@user [reason]',
    // Ensure the 'async' keyword is here!
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            const noPermsEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role to use this command.');
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const target = message.mentions.users.first();
        if (!target) {
            const noTargetEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('Please mention the user to kick.');
            return message.reply({ embeds: [noTargetEmbed] });
        }

        const member = message.guild.members.resolve(target);
        if (!member) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription("That user isn't in this guild.")] });
        }
        if (!member.kickable) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('I cannot kick this user. They may have a higher role than me.')] });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';
        await member.kick(reason);

        const successEmbed = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('<a:Green_Tick:1381583016073363508> User Kicked')
            .addFields(
                { name: 'User', value: target.tag, inline: true },
                { name: 'Moderator', value: message.author.tag, inline: true },
                { name: 'Reason', value: reason }
            ).setTimestamp();
        await message.channel.send({ embeds: [successEmbed] });

        await sendModLog(
            message.client,
            message.guild,
            'User Kicked 👢',
            '#ff9900',
            [
                { name: 'User', value: `${target.tag} (${target.id})` },
                { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                { name: 'Reason', value: reason }
            ]
        );
    },
};