const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const MessageCount = require('../../models/messageCount');
const { sendServerLog } = require('../../utils/serverlog');

module.exports = {
    name: 'reset-messages',
    description: 'Resets a user\'s message count to 0.',
    usage: '<@user|userID>',
    aliases: ['resetmsgs'],
    async execute(message, args) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')] });
        }

        // --- Argument Validation ---
        const targetUserArg = args[0];
        if (!targetUserArg) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> Invalid Usage').setDescription(`**Usage:** \`${process.env.PREFIX}reset-messages <@user|userID>\``)] });
        }

        // --- Target Resolution ---
        let targetUser;
        try {
            targetUser = message.mentions.users.first() || await message.client.users.fetch(targetUserArg);
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user.')] });
        }
        
        // --- Database Action ---
        await MessageCount.findOneAndUpdate(
            { guildId: message.guild.id, userId: targetUser.id },
            { $set: { messageCount: 0 } }, // Set count directly to 0
            { upsert: true }
        );

        // --- Confirmation ---
        const embed = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('<a:Green_Tick:1381583016073363508> Message Count Reset')
            .setDescription(`**${targetUser.tag}**'s message count has been reset to **0**.`);
        
        await message.reply({ embeds: [embed] });
        
        // --- Logging ---
        await sendServerLog(
            message.client, message.guild, 'Message Count Reset', '#ffc107',
            [
                { name: 'User', value: targetUser.tag, inline: true },
                { name: 'Manager', value: message.author.tag, inline: true },
            ]
        );
    },
};