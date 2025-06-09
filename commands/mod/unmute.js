const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'unmute',
    description: 'Removes a timeout from a member.',
    usage: '@user [reason]',
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            const noPermsEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('<a:wrong:1381568998847545428> Permission Denied')
                .setDescription('You do not have the required moderator role to use this command.');
            return message.reply({ embeds: [noPermsEmbed] });
        }

        // --- Target User Check ---
        const target = message.mentions.users.first();
        if (!target) {
            const noTargetEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('<a:wrong:1381568998847545428> Error')
                .setDescription('Please mention the user to unmute.');
            return message.reply({ embeds: [noTargetEmbed] });
        }

        const member = message.guild.members.resolve(target);
        if (!member) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription("That user isn't in this guild.")] });
        }

        // --- Action ---
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // Passing 'null' to the timeout duration removes it
            await member.timeout(null, reason);

            // --- Confirmation Message ---
            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> User Unmuted')
                .addFields(
                    { name: 'User', value: target.tag, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });

            // --- Logging ---
            await sendModLog(
                message.client,
                message.guild,
                'User Unmuted 🔈',
                '#17a2b8', // A nice info blue/cyan color
                [
                    { name: 'User', value: `${target.tag} (${target.id})` },
                    { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Reason', value: reason }
                ]
            );

        } catch (error) {
            console.error(error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('I was unable to unmute this member.')] });
        }
    },
};