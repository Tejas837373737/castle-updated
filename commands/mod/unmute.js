const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'unmute',
    description: 'Removes a timeout from a member by mention or ID.',
    usage: '<@user|userID> [reason]',
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role to use this command.')] });
        }

        // --- Target Resolver (THE UPGRADE) ---
        if (!args[0]) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}unmute <@user|userID> [reason]\``)]});
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

        // --- Action ---
        const reason = args.slice(1).join(' ') || 'No reason provided';

        // Check if the member is actually muted
        if (!member.isCommunicationDisabled()) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> User Not Muted').setDescription(`${target.tag} is not currently timed out.`)]});
        }

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
                ).setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });

            // --- Logging ---
            await sendModLog(
                message.client,
                message.guild,
                'User Unmuted 🔈',
                '#17a2b8', // Info blue/cyan
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