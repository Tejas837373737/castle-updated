const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'ban',
    description: 'Bans a member from the server.',
    usage: '@user [reason]',
    // Ensure the 'async' keyword is here!
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')] });
        }

        const target = message.mentions.users.first();
        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('Please mention the user to ban.')] });
        }

        const member = message.guild.members.resolve(target);
        if (member && !member.bannable) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('I cannot ban this user. They may have a higher role than me.')] });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';
        await message.guild.bans.create(target.id, { reason });

        const successEmbed = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('<a:Green_Tick:1381583016073363508> User Banned')
            .addFields(
                { name: 'User', value: target.tag, inline: true },
                { name: 'Moderator', value: message.author.tag, inline: true },
                { name: 'Reason', value: reason }
            ).setTimestamp();
        await message.channel.send({ embeds: [successEmbed] });

        await sendModLog(
            message.client,
            message.guild,
            'User Banned 🔨',
            '#dc3545',
            [
                { name: 'User', value: `${target.tag} (${target.id})` },
                { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                { name: 'Reason', value: reason }
            ]
        );
    },
};