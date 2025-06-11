const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'unban',
    description: 'Revokes the ban for a user using their user ID.',
    usage: '<userID>',
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role to use this command.')] });
        }

        // --- Target User ID Resolver (THE UPGRADE) ---
        const userIdArg = args[0];
        if (!userIdArg) {
            const noIdEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('<a:wrong:1381568998847545428> Error')
                .setDescription(`**Usage:** \`${process.env.PREFIX}unban <userID>\`\nYou must provide the User ID of the person you want to unban.`);
            return message.reply({ embeds: [noIdEmbed] });
        }
        // This removes the <@ > characters if a mention is passed, leaving only the ID.
        const userId = userIdArg.replace(/<@!?|>/g, '');

        // --- Action ---
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // Fetch the banned user to ensure they are actually banned and to get their tag
            const bannedUser = await message.guild.bans.fetch(userId);
            if (!bannedUser) {
                 return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('This user is not on the server\'s ban list.')] });
            }

            // Unban the user
            await message.guild.bans.remove(userId, reason);

            // --- Confirmation Message ---
            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> User Unbanned')
                .addFields(
                    { name: 'User', value: bannedUser.user.tag, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason }
                ).setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });

            // --- Logging ---
            await sendModLog(
                message.client,
                message.guild,
                'User Unbanned ✅',
                '#20c997', // Teal/green color
                [
                    { name: 'User', value: `${bannedUser.user.tag} (${bannedUser.user.id})` },
                    { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Reason', value: reason }
                ]
            );

        } catch (error) {
            console.error(error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('Could not unban this user. Please ensure the User ID is correct and the user is actually banned.')] });
        }
    },
};