const { EmbedBuilder, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendServerLog } = require('../../utils/serverlog');

module.exports = {
    name: 'say',
    description: 'Sends an anonymous embed from the bot to a specific channel.',
    aliases: ['embed'],
    usage: '<#channel|channelID> <Title> | <Description> (or just <message>)',
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('The Manager Role has not been set up.')] });
        }
        if (!message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Permission Denied').setDescription('You do not have the required Manager Role.')] });
        }

        // --- Argument Validation ---
        if (args.length < 2) {
            const usageEmbed = new EmbedBuilder()
                .setColor('#ffc107')
                .setTitle('Invalid Usage')
                .setDescription(`**Correct Usage:** \`${process.env.PREFIX}say <#channel> <message>\`\n\n**With a title:** \`${process.env.PREFIX}say <#channel> <Title> | <Description>\``);
            return message.reply({ embeds: [usageEmbed] });
        }

        // --- Target Channel Resolution ---
        const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!targetChannel || !targetChannel.isTextBased() || targetChannel.type === ChannelType.GuildVoice) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Invalid Channel').setDescription('Please specify a valid text channel.')] });
        }

        // --- Parse Title and Description ---
        const content = args.slice(1).join(' ');
        let title = null;
        let description = content;

        if (content.includes('|')) {
            const parts = content.split('|', 2);
            title = parts[0].trim();
            description = parts[1].trim();
        }

        if (!description) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('The description content cannot be empty.')] });
        }

        // --- Action: Build and Send the Embed ---
        try {
            const announcementEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setDescription(description)
                // The .setAuthor() line has been removed to make the embed anonymous.
                .setTimestamp(); // This adds just the time to the footer.

            if (title) {
                announcementEmbed.setTitle(title);
            }

            await targetChannel.send({ embeds: [announcementEmbed] });

            // --- Confirmation & Logging ---
            const successEmbed = new EmbedBuilder().setColor('#28a745').setDescription(`✅ Your anonymous embed has been sent to ${targetChannel}.`);
            message.reply({ embeds: [successEmbed] }).then(msg => setTimeout(() => msg.delete(), 5000));

            // The log will still record who sent it for accountability.
            await sendServerLog(
                message.client, message.guild, 'Anonymous Embed Sent', '#17a2b8',
                [
                    { name: 'Manager', value: message.author.tag, inline: true },
                    { name: 'Target Channel', value: `${targetChannel}`, inline: true },
                    { name: 'Content', value: `**Title:** ${title || 'None'}\n**Description:** ${description.substring(0, 500)}${description.length > 500 ? '...' : ''}` }
                ]
            );
        } catch (error) {
            console.error('Say/Embed command error:', error);
            if (error.code === 50013) {
                return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Bot Permission Error').setDescription(`I do not have permission to send messages in ${targetChannel}.`)] });
            }
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('An unexpected error occurred.')] });
        }
    },
};