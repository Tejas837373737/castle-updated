const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const MessageCount = require('../../models/messageCount');
const { sendServerLog } = require('../../utils/serverlog');

module.exports = {
    name: 'add-messages',
    description: 'Manually adds or subtracts messages from a user\'s count.',
    usage: '<@user|userID> <amount>',
    aliases: ['addmsgs'],
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Permission Denied').setDescription('You do not have the Manager Role.')] });
        }

        // --- Argument Validation ---
        const targetUserArg = args[0];
        const amountArg = args[1];
        if (!targetUserArg || !amountArg) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('Invalid Usage').setDescription(`**Usage:** \`${process.env.PREFIX}add-messages <@user|userID> <amount>\``)] });
        }

        const amount = parseInt(amountArg);
        if (isNaN(amount)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Invalid Amount').setDescription('The amount must be a valid number.')] });
        }

        // --- Target Resolution ---
        let targetUser;
        try {
            targetUser = message.mentions.users.first() || await message.client.users.fetch(targetUserArg);
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user.')] });
        }
        
        // --- Database Action ---
        const updatedUserCount = await MessageCount.findOneAndUpdate(
            { guildId: message.guild.id, userId: targetUser.id },
            { $inc: { messageCount: amount } },
            { upsert: true, new: true } // Creates doc if none exists, returns the new doc
        );

        // --- Confirmation ---
        const embed = new EmbedBuilder()
            .setColor(amount > 0 ? '#28a745' : '#dc3545')
            .setTitle('<a:Green_Tick:1381583016073363508> Message Count Adjusted')
            .setDescription(`Adjusted **${targetUser.tag}**'s message count by **${amount.toLocaleString()}**.`)
            .addFields({ name: 'New Total', value: `**${updatedUserCount.messageCount.toLocaleString()}** messages` });
        
        await message.reply({ embeds: [embed] });
        
        // --- Logging ---
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
};