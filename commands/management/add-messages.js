const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const MessageCount = require('../../models/messageCount');
const { sendServerLog } = require('../../utils/serverlog');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'add-messages',
    description: 'Manually adds or subtracts messages from a user\'s count.',
    usage: '<@user|userID> <amount>',
    aliases: ['addmsgs'],

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('add-messages')
        .setDescription('Manually adjusts a user\'s message count.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose count you want to adjust.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of messages to add (can be negative to subtract).')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Permission Denied').setDescription('You do not have the Manager Role.')] });
        }
        const targetUserArg = args[0];
        const amountArg = args[1];
        if (!targetUserArg || !amountArg) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('Invalid Usage').setDescription(`**Usage:** \`${process.env.PREFIX}add-messages <@user|userID> <amount>\``)] });
        }
        const amount = parseInt(amountArg);
        if (isNaN(amount)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Invalid Amount').setDescription('The amount must be a valid number.')] });
        }
        let targetUser;
        try {
            const userId = targetUserArg.replace(/<@!?|>/g, '');
            targetUser = await message.client.users.fetch(userId);
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user.')] });
        }
        const updatedUserCount = await MessageCount.findOneAndUpdate(
            { guildId: message.guild.id, userId: targetUser.id },
            { $inc: { messageCount: amount } },
            { upsert: true, new: true }
        );
        const embed = new EmbedBuilder()
            .setColor(amount > 0 ? '#28a745' : '#dc3545')
            .setTitle('<a:Green_Tick:1381583016073363508> Message Count Adjusted')
            .setDescription(`Adjusted **${targetUser.tag}**'s message count by **${amount.toLocaleString()}**.`)
            .addFields({ name: 'New Total', value: `**${updatedUserCount.messageCount.toLocaleString()}** messages` });
        await message.reply({ embeds: [embed] });
        await sendServerLog(
            message.client, message.guild, 'Message Count Manually Adjusted', '#0099ff',
            [
                { name: 'User', value: targetUser.tag, inline: true },
                { name: 'Amount', value: `${amount > 0 ? '+' : ''}${amount.toLocaleString()}`, inline: true },
                { name: 'Manager', value: message.author.tag, inline: true },
                { name: 'New Total', value: `${updatedUserCount.messageCount.toLocaleString()}`, inline: false }
            ]
        );
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !interaction.member.roles.cache.has(guildConfig.managerRoleId)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Permission Denied').setDescription('You do not have the Manager Role.')], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        
        await interaction.deferReply({ ephemeral: true });

        try {
            const updatedUserCount = await MessageCount.findOneAndUpdate(
                { guildId: interaction.guild.id, userId: targetUser.id },
                { $inc: { messageCount: amount } },
                { upsert: true, new: true }
            );

            const embed = new EmbedBuilder()
                .setColor(amount > 0 ? '#28a745' : '#dc3545')
                .setTitle('<a:Green_Tick:1381583016073363508> Message Count Adjusted')
                .setDescription(`Adjusted **${targetUser.tag}**'s message count by **${amount.toLocaleString()}**.`)
                .addFields({ name: 'New Total', value: `**${updatedUserCount.messageCount.toLocaleString()}** messages` });
            
            // Reply to the interaction privately so only the manager sees it
            await interaction.editReply({ embeds: [embed] });

            // Send the log to the server log channel
            await sendServerLog(
                interaction.client, interaction.guild, 'Message Count Manually Adjusted', '#0099ff',
                [
                    { name: 'User', value: targetUser.tag, inline: true },
                    { name: 'Amount', value: `${amount > 0 ? '+' : ''}${amount.toLocaleString()}`, inline: true },
                    { name: 'Manager', value: interaction.user.tag, inline: true },
                    { name: 'New Total', value: `${updatedUserCount.messageCount.toLocaleString()}`, inline: false }
                ]
            );
        } catch (error) {
            console.error('Add-messages slash command error:', error);
            await interaction.editReply({ content: 'An error occurred while adjusting the message count.' });
        }
    }
};