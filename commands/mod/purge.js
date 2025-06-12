const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'purge',
    description: 'Deletes a specified number of messages, with optional filters.',
    aliases: ['delete', 'clear'],
    usage: '<amount> [@user | bots]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Deletes a specified number of messages.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100).')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user.'))
        .addBooleanOption(option =>
            option.setName('bots')
                .setDescription('Only delete messages from bots.')),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You must have the "Manage Messages" permission.')]});
        }
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')] });
        }
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid Amount').setDescription(`**Usage:** \`${process.env.PREFIX}purge <1-100> [@user | bots]\``)] });
        }
        await message.delete().catch(err => console.error("Could not delete purge command message:", err));
        const messagesToFetch = await message.channel.messages.fetch({ limit: 100 });
        let messagesToDelete = messagesToFetch.first(amount);
        const targetUser = message.mentions.users.first();
        const filterBots = args.some(arg => arg.toLowerCase() === 'bots');
        if (targetUser) {
            messagesToDelete = messagesToFetch.filter(m => m.author.id === targetUser.id).first(amount);
        } else if (filterBots) {
            messagesToDelete = messagesToFetch.filter(m => m.author.bot).first(amount);
        }
        if (messagesToDelete.length === 0) {
            const noMessagesEmbed = new EmbedBuilder().setColor('#ffc107').setTitle('No Messages Found').setDescription('No messages matching your criteria were found to delete.');
            return message.channel.send({ embeds: [noMessagesEmbed] }).then(msg => setTimeout(() => msg.delete(), 5000));
        }
        try {
            const deletedMessages = await message.channel.bulkDelete(messagesToDelete, true);
            if (guildConfig && guildConfig.snipeLogChannelId) {
                const snipeChannel = message.guild.channels.cache.get(guildConfig.snipeLogChannelId);
                if (snipeChannel) {
                    const transcriptContent = deletedMessages.map(m => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content || '(Attachment or Embed)'}`).reverse().join('\n');
                    const transcriptFile = new AttachmentBuilder(Buffer.from(transcriptContent), { name: `purge-${message.channel.name}-${Date.now()}.txt` });
                    const logEmbed = new EmbedBuilder().setColor('#6f42c1').setTitle('Message Purge Event').setDescription(`**${deletedMessages.size}** messages were purged from ${message.channel}.`).addFields({ name: 'Moderator', value: message.author.tag }).setTimestamp();
                    await snipeChannel.send({ embeds: [logEmbed], files: [transcriptFile] });
                }
            }
            let description = `<a:Green_Tick:1381583016073363508> Successfully deleted **${deletedMessages.size}** message(s).`;
            if (targetUser) description += ` from ${targetUser}.`;
            if (filterBots) description += ` from bots.`;
            const successEmbed = new EmbedBuilder().setColor('#28a745').setDescription(description);
            message.channel.send({ embeds: [successEmbed] }).then(msg => setTimeout(() => msg.delete(), 5000));
            await sendModLog(message.client, message.guild, 'Messages Purged 🗑️', '#6c757d', [{ name: 'Channel', value: `${message.channel}` }, { name: 'Moderator', value: `${message.author.tag}` }, { name: 'Details', value: `Deleted ${deletedMessages.size} message(s).` }]);
        } catch (error) {
            console.error('[PURGE] Error:', error);
            message.channel.send({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('An error occurred. I may not have permission, or messages may be older than 14 days.')] }).then(msg => setTimeout(() => msg.delete(), 5000));
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You must have the "Manage Messages" permission.')], ephemeral: true });
        }
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.modRole || !interaction.member.roles.cache.has(guildConfig.modRole)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role.')], ephemeral: true });
        }
        
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const filterBots = interaction.options.getBoolean('bots');

        await interaction.deferReply({ ephemeral: true });

        const messagesToFetch = await interaction.channel.messages.fetch({ limit: amount });
        let messagesToDelete = messagesToFetch;
        
        if (targetUser) {
            messagesToDelete = messagesToFetch.filter(m => m.author.id === targetUser.id);
        } else if (filterBots) {
            messagesToDelete = messagesToFetch.filter(m => m.author.bot);
        }

        if (messagesToDelete.size === 0) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('No Messages Found').setDescription('No messages matching your criteria were found to delete.')] });
        }

        try {
            const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

            if (guildConfig && guildConfig.snipeLogChannelId) {
                const snipeChannel = interaction.guild.channels.cache.get(guildConfig.snipeLogChannelId);
                if (snipeChannel) {
                    const transcriptContent = deletedMessages.map(m => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content || '(Attachment or Embed)'}`).reverse().join('\n');
                    const transcriptFile = new AttachmentBuilder(Buffer.from(transcriptContent), { name: `purge-${interaction.channel.name}-${Date.now()}.txt` });
                    const logEmbed = new EmbedBuilder().setColor('#6f42c1').setTitle('Message Purge Event').setDescription(`**${deletedMessages.size}** messages were purged from ${interaction.channel}.`).addFields({ name: 'Moderator', value: interaction.user.tag }).setTimestamp();
                    await snipeChannel.send({ embeds: [logEmbed], files: [transcriptFile] });
                }
            }

            let description = `<a:Green_Tick:1381583016073363508> Successfully deleted **${deletedMessages.size}** message(s).`;
            if (targetUser) description += ` from ${targetUser}.`;
            if (filterBots) description += ` from bots.`;
            const successEmbed = new EmbedBuilder().setColor('#28a745').setDescription(description);
            interaction.channel.send({ embeds: [successEmbed] }).then(msg => setTimeout(() => msg.delete(), 5000));
            
            await interaction.editReply({ content: 'Purge was successful.' });

            await sendModLog(interaction.client, interaction.guild, 'Messages Purged 🗑️', '#6c757d', [{ name: 'Channel', value: `${interaction.channel}` }, { name: 'Moderator', value: `${interaction.user.tag}` }, { name: 'Details', value: `Deleted ${deletedMessages.size} message(s).` }]);
        } catch (error) {
            console.error('[PURGE] Error:', error);
            interaction.editReply({ content: 'An error occurred. I may not have permission, or messages may be older than 14 days.' });
        }
    }
};