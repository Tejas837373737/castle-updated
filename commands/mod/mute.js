const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');
const ms = require('ms');

module.exports = {
    name: 'mute',
    description: 'Mutes a member with an optional duration (defaults to permanent).',
    aliases: ['timeout'],
    usage: '<@user|userID> [duration] [reason]',
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')]});
        }

        // --- Target Resolver ---
        if (!args[0]) return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}mute <@user|userID> [duration] [reason]\``)]});
        
        let member;
        try {
            const mentionedUser = message.mentions.members.first();
            if (mentionedUser) {
                member = mentionedUser;
            } else {
                member = await message.guild.members.fetch(args[0]);
            }
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user in this server. Please provide a valid mention or User ID.')]});
        }
        const target = member.user;

        // --- NEW, FIXED Argument Parsing Logic ---
        const permanentDuration = 28 * 24 * 60 * 60 * 1000; // 28 days in milliseconds
        let durationMs;
        let durationArg;
        let reason;
        
        const potentialDuration = args[1];
        const parsedMs = ms(potentialDuration || '0'); // Try parsing the second argument

        if (typeof parsedMs === 'number' && parsedMs > 0) {
            // Case 1: A valid duration was provided as the second argument
            durationMs = parsedMs;
            durationArg = potentialDuration;
            reason = args.slice(2).join(' ') || 'No reason provided';
        } else {
            // Case 2: No valid duration found, so it's a permanent mute
            durationMs = permanentDuration;
            durationArg = 'Permanent (28 Days)';
            reason = args.slice(1).join(' ') || 'No reason provided';
        }

        if (durationMs > permanentDuration) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Duration Too Long').setDescription('The mute duration cannot exceed 28 days.')]});
        }
        
        // --- Action ---
        try {
            await member.timeout(durationMs, reason);

            // --- Confirmation & Logging ---
            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> User Muted')
                .addFields(
                    { name: 'User', value: target.tag, inline: true },
                    { name: 'Duration', value: durationArg, inline: true },
                    { name: 'Moderator', value: message.author.tag },
                    { name: 'Reason', value: reason }
                ).setTimestamp();
            await message.channel.send({ embeds: [successEmbed] });

            await sendModLog(
                message.client,
                message.guild,
                'User Muted 🔇',
                '#6c757d',
                [
                    { name: 'User', value: `${target.tag} (${target.id})` },
                    { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Duration', value: durationArg },
                    { name: 'Reason', value: reason }
                ]
            );
        } catch (error) {
            console.error(error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('I was unable to mute this member. They may have a higher role than me.')]});
        }
    },
};