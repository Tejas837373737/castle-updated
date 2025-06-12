const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MessageCount = require('../../models/messageCount');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'messages',
    description: 'Shows how many messages a user has sent in counted channels.',
    usage: '[@user|userID]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('messages')
        .setDescription('Shows how many messages a user has sent in counted channels.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check. Defaults to you.')),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args, client) {
        let targetUser;
        try {
            const mentionedUser = message.mentions.users.first();
            if (mentionedUser) {
                targetUser = mentionedUser;
            } else if (args[0]) {
                targetUser = await client.users.fetch(args[0]);
            } else {
                targetUser = message.author;
            }
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('Could not find that user. Please provide a valid mention or User ID.')] });
        }
        
        const userCount = await MessageCount.findOne({ guildId: message.guild.id, userId: targetUser.id });
        const count = userCount ? userCount.messageCount : 0;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() })
            .setDescription(`Sent **${count.toLocaleString()}** messages in counted channels.`);
        
        await message.reply({ embeds: [embed] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        await interaction.deferReply();

        const userCount = await MessageCount.findOne({ guildId: interaction.guild.id, userId: targetUser.id });
        const count = userCount ? userCount.messageCount : 0;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() })
            .setDescription(`Sent **${count.toLocaleString()}** messages in counted channels.`);
            
        await interaction.editReply({ embeds: [embed] });
    }
};