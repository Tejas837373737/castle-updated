const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'unban',
    description: 'Revokes the ban for a member using their user ID.',
    usage: '<userID> [reason]',
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

        // --- Target User ID Check ---
        const userId = args[0];
        if (!userId) {
            const noIdEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('<a:wrong:1381568998847545428> Error')
                .setDescription('You must provide the User ID of the person you want to unban.');
            return message.reply({ embeds: [noIdEmbed] });
        }

        // --- Action ---
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // Fetch the banned user to ensure they are actually banned
            const bannedUser = await message.guild.bans.fetch(userId);
            if (!bannedUser) {
                 return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('This user is not banned from the server.')] });
            }

            // Unban the user
            await message.guild.bans.remove(userId, reason);

            // --- Confirmation Message ---
            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> User Unbanned')
                .addFields(
                    // We use bannedUser.user.tag because we fetched the ban information
                    { name: 'User', value: bannedUser.user.tag, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });

            // --- Logging ---
            await sendModLog(
                message.client,
                message.guild,
                'User Unbanned ✅',
                '#20c997', // A teal/green color
                [
                    { name: 'User', value: `${bannedUser.user.tag} (${bannedUser.user.id})` },
                    { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Reason', value: reason }
                ]
            );

        } catch (error) {
            console.error(error);
            // Catch errors, such as if the user ID is invalid or the user isn't banned
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('Could not unban this user. Please ensure the User ID is correct and the user is actually banned.')] });
        }
    },
};