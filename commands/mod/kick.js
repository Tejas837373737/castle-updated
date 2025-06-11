const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'kick',
    description: 'Kicks a member from the server by mention or ID.',
    usage: '<@user|userID> [reason]',
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')]});
        }

        // --- Target Resolver ---
        if (!args[0]) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}kick <@user|userID> [reason]\``)]});
        }
        
        let member;
        try {
            const mentionedMember = message.mentions.members.first();
            if (mentionedMember) {
                member = mentionedMember;
            } else {
                member = await message.guild.members.fetch(args[0]);
            }
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user in this server. Please provide a valid mention or User ID.')]});
        }
        
        const target = member.user;

        // Check if the user is kickable
        if (!member.kickable) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('I cannot kick this user. They may have a higher role than me.')]});
        }

        // --- Action ---
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            await member.kick(reason);

            // --- FIX: Confirmation Message ---
            // This section was missing. It creates and sends the success message.
            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> User Kicked')
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
                'User Kicked 👢',
                '#ff9900', // Orange color
                [
                    { name: 'User', value: `${target.tag} (${target.id})` },
                    { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Reason', value: reason }
                ]
            );

        } catch (error) {
            console.error('Failed to kick user:', error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('An error occurred while trying to kick this user.')] });
        }
    },
};