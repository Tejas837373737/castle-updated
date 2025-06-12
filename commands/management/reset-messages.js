const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const MessageCount = require('../../models/messageCount');
const { sendServerLog } = require('../../utils/serverlog');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'reset-messages',
    description: 'Resets a user\'s message count to 0.',
    usage: '<@user|userID>',
    aliases: ['resetmsgs'],

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('reset-messages')
        .setDescription("Resets a user's message count to 0.")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose message count you want to reset.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args, client) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')] });
        }
        const targetUserArg = args[0];
        if (!targetUserArg) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('<a:wrong:1381568998847545428> Invalid Usage').setDescription(`**Usage:** \`${process.env.PREFIX}reset-messages <@user|userID>\``)] });
        }
        let targetUser;
        try {
            const userId = targetUserArg.replace(/<@!?|>/g, '');
            targetUser = await client.users.fetch(userId);
        } catch (error) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid User').setDescription('Could not find that user.')] });
        }
        await MessageCount.findOneAndUpdate(
            { guildId: message.guild.id, userId: targetUser.id },
            { $set: { messageCount: 0 } },
            { upsert: true }
        );
        const embed = new EmbedBuilder()
            .setColor('#28a745')
            .setTitle('<a:Green_Tick:1381583016073363508> Message Count Reset')
            .setDescription(`**${targetUser.tag}**'s message count has been reset to **0**.`);
        await message.reply({ embeds: [embed] });
        await sendServerLog(
            message.client, message.guild, 'Message Count Reset', '#ffc107',
            [{ name: 'User', value: targetUser.tag, inline: true }, { name: 'Manager', value: message.author.tag, inline: true }]
        );
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !interaction.member.roles.cache.has(guildConfig.managerRoleId)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the Manager Role.')], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        
        await interaction.deferReply({ ephemeral: true });

        try {
            await MessageCount.findOneAndUpdate(
                { guildId: interaction.guild.id, userId: targetUser.id },
                { $set: { messageCount: 0 } }, // Set count directly to 0
                { upsert: true }
            );

            const embed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('<a:Green_Tick:1381583016073363508> Message Count Reset')
                .setDescription(`**${targetUser.tag}**'s message count has been reset to **0**.`);
            
            await interaction.editReply({ embeds: [embed] });

            await sendServerLog(
                interaction.client, interaction.guild, 'Message Count Reset', '#ffc107',
                [{ name: 'User', value: targetUser.tag, inline: true }, { name: 'Manager', value: interaction.user.tag, inline: true }]
            );
        } catch (error) {
            console.error('Reset-messages slash command error:', error);
            await interaction.editReply({ content: 'An error occurred while resetting the message count.' });
        }
    }
};