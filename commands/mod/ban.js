const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'ban',
    description: 'Bans a member from the server by mention or ID.',
    usage: '<@user|userID> [reason]',
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')]});
        }

        // --- Target Resolver ---
        if (!args[0]) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}ban <@user|userID> [reason]\``)]});
        }
        
        let target;
        try {
            // This allows the command to accept a mention (<@...>) or a raw ID.
            const userId = args[0].replace(/<@!?|>/g, '');
            target = await message.client.users.fetch(userId);
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user. Please provide a valid mention or User ID.')]});
        }

        // Check if the user is a member of the server and if they are bannable
        const member = message.guild.members.resolve(target);
        if (member && !member.bannable) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('I cannot ban this user. They may have a higher role than me.')]});
        }
        
        // --- Action ---
        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await message.guild.bans.create(target.id, { reason });
            
            // --- FIX: Confirmation Message ---
            // This section was missing. It creates and sends the success message.
            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> User Banned')
                .addFields(
                    { name: 'User', value: target.tag, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });

            // --- FIX: Logging ---
            // This ensures the action is also sent to your mod-log channel.
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

        } catch (error) {
            console.error('Failed to ban user:', error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('An error occurred while trying to ban this user.')] });
        }
    },
};