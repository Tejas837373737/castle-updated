const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendServerLog } = require('../../utils/serverlog');

// The parseEmoji helper function has been removed.

module.exports = {
    // --- Data for Prefix Command ---
    name: 'say',
    description: 'Sends an anonymous embed from the bot to a specific channel.',
    aliases: ['embed'],
    usage: '<#channel|channelID> <Title> | <Description> (or just <message>)',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Sends a message as the bot.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the message in.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send. Use "Title | Description" for a title.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // --- Execute Function for Prefix Command ---
    async execute(message, args, client) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Permission Denied').setDescription('You do not have the required Manager Role.')] });
        }
        if (args.length < 2) {
            const usageEmbed = new EmbedBuilder().setColor('#ffc107').setTitle('Invalid Usage').setDescription(`**Usage:** \`${process.env.PREFIX}say <#channel> <message>\`\n**With Title:** \`${process.env.PREFIX}say <#channel> <Title> | <Description>\``);
            return message.reply({ embeds: [usageEmbed] });
        }
        const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!targetChannel || !targetChannel.isTextBased()) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Invalid Channel').setDescription('Please specify a valid text channel.')] });
        }
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
        try {
            const announcementEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                // Now uses the raw description text
                .setDescription(description)
                .setTimestamp();
            if (title) {
                // Now uses the raw title text
                announcementEmbed.setTitle(title);
            }
            await targetChannel.send({ embeds: [announcementEmbed] });
            const successEmbed = new EmbedBuilder().setColor('#28a745').setDescription(`✅ Your anonymous embed has been sent to ${targetChannel}.`);
            message.reply({ embeds: [successEmbed] }).then(msg => setTimeout(() => msg.delete(), 5000));
            await sendServerLog(message.client, message.guild, 'Anonymous Embed Sent', '#17a2b8', [{ name: 'Manager', value: message.author.tag, inline: true }, { name: 'Target Channel', value: `${targetChannel}`, inline: true }, { name: 'Content', value: `**Title:** ${title || 'None'}\n**Description:** ${description.substring(0, 500)}` }]);
        } catch (error) {
            console.error('Say command error:', error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('An unexpected error occurred.')] });
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !interaction.member.roles.cache.has(guildConfig.managerRoleId)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Permission Denied').setDescription('You do not have the required Manager Role.')], ephemeral: true });
        }
        
        const targetChannel = interaction.options.getChannel('channel');
        const content = interaction.options.getString('message');
        
        let title = null;
        let description = content;
        if (content.includes('|')) {
            const parts = content.split('|', 2);
            title = parts[0].trim();
            description = parts[1].trim();
        }
        if (!description) {
            return interaction.reply({ content: 'The description content cannot be empty.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const announcementEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                // Now uses the raw description text
                .setDescription(description)
                .setTimestamp();
            if (title) {
                // Now uses the raw title text
                announcementEmbed.setTitle(title);
            }
            await targetChannel.send({ embeds: [announcementEmbed] });

            await interaction.editReply({ content: `✅ Your anonymous embed has been sent to ${targetChannel}.` });
            await sendServerLog(interaction.client, interaction.guild, 'Anonymous Embed Sent', '#17a2b8', [{ name: 'Manager', value: interaction.user.tag, inline: true }, { name: 'Target Channel', value: `${targetChannel}`, inline: true }, { name: 'Content', value: `**Title:** ${title || 'None'}\n**Description:** ${description.substring(0, 500)}` }]);
        } catch (error) {
            console.error('Say slash command error:', error);
            if (error.code === 50013) {
                return interaction.editReply({ content: `I do not have permission to send messages in ${targetChannel}.` });
            }
            await interaction.editReply({ content: 'An unexpected error occurred.' });
        }
    }
};