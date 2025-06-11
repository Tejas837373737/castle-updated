const { EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'purge',
    description: 'Deletes a specified number of messages, with optional filters.',
    aliases: ['delete', 'clear'],
    usage: '<amount> [@user | bots]',
    async execute(message, args) {
        // --- Permission Check ---
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
             return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You must have the "Manage Messages" permission to use this command.')]});
        }
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role to use this command.')] });
        }

        // --- Argument Validation ---
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Invalid Amount').setDescription(`**Usage:** \`${process.env.PREFIX}purge <1-100> [@user | bots]\``)] });
        }
        
        // This deletes the command message itself for a clean channel
        await message.delete().catch(err => console.error("Could not delete purge command message:", err));

        // --- Message Fetching and Filtering ---
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

        // --- Action ---
        try {
            const deletedMessages = await message.channel.bulkDelete(messagesToDelete, true);

            // --- Automatic Transcript Logging ---
            if (guildConfig && guildConfig.snipeLogChannelId) {
                const snipeChannel = message.guild.channels.cache.get(guildConfig.snipeLogChannelId);
                if (snipeChannel) {
                    const transcriptContent = deletedMessages.map(m => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content || '(Attachment or Embed)'}`).reverse().join('\n');
                    const transcriptFile = new AttachmentBuilder(Buffer.from(transcriptContent), { name: `purge-${message.channel.name}-${Date.now()}.txt` });
                    const logEmbed = new EmbedBuilder()
                        .setColor('#6f42c1')
                        .setTitle('Message Purge Event')
                        .setDescription(`**${deletedMessages.size}** messages were purged from ${message.channel}.`)
                        .addFields({ name: 'Moderator', value: message.author.tag })
                        .setTimestamp();
                    await snipeChannel.send({ embeds: [logEmbed], files: [transcriptFile] });
                }
            }
            
            // --- FIX: Restored Confirmation Message ---
            let description = `<a:Green_Tick:1381583016073363508> Successfully deleted **${deletedMessages.size}** message(s).`;
            if (targetUser) description += ` from ${targetUser}.`;
            if (filterBots) description += ` from bots.`;

            const successEmbed = new EmbedBuilder().setColor('#28a745').setDescription(description);
            message.channel.send({ embeds: [successEmbed] }).then(msg => setTimeout(() => msg.delete(), 5000));

            // --- Mod Log ---
            await sendModLog(
                message.client, message.guild, 'Messages Purged 🗑️', '#6c757d',
                [{ name: 'Channel', value: `${message.channel}` }, { name: 'Moderator', value: `${message.author.tag}` }, { name: 'Details', value: `Deleted ${deletedMessages.size} message(s).` }]
            );

        } catch (error) {
            console.error('[PURGE] Error:', error);
            message.channel.send({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('An error occurred. I may not have permission, or messages may be older than 14 days.')] }).then(msg => setTimeout(() => msg.delete(), 5000));
        }
    },
};