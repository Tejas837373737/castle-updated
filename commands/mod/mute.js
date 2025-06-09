const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');
const ms = require('ms');

module.exports = {
    name: 'mute',
    description: 'Mutes a member for a specified time.',
    aliases: ['timeout'],
    usage: '@user <duration> [reason]',
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')] });
        }

        // --- Target User Check ---
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription(`**Usage:** \`${process.env.PREFIX}mute @user <duration> [reason]\``)] });
        }

        const member = message.guild.members.resolve(target);
        if (!member) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription("That user isn't in this guild.")] });
        }
        
        // --- Argument Validation (The Fix) ---
        const durationArg = args[1];
        if (!durationArg) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Missing Argument').setDescription('You must provide a duration (e.g., 10m, 1h, 1d).')] });
        }

        const durationMs = ms(durationArg); // 'ms' will return a number in milliseconds or undefined
        if (typeof durationMs === 'undefined') {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid Duration').setDescription('You have provided an invalid duration. Please use a format like `10m`, `1h`, or `7d`.')] });
        }
        
        // Duration cannot exceed 28 days (Discord API limit)
        if (durationMs > 2419200000) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Duration Too Long').setDescription('The mute duration cannot exceed 28 days.')] });
        }

        // --- Action ---
        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            await member.timeout(durationMs, reason);

            // --- Confirmation Message ---
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

            // --- Logging ---
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
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('I was unable to mute this member. They may have a higher role than me.')] });
        }
    },
};