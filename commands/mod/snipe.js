const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const fs = require('fs');

module.exports = {
    name: 'snipe',
    description: 'Shows the most recently deleted message(s) in a channel.',
    usage: '',
    async execute(message, args) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the moderator role.')] });
        }

        const multiSnipes = message.client.multiSnipes.get(message.channel.id);
        
        // --- THE FIX IS HERE ---
        // We check for multiSnipes (the array from purge) and its .length, not .size
        if (multiSnipes && multiSnipes.length > 0) {
            const transcriptContent = multiSnipes.map(m => {
                const attachments = m.attachments.map(a => `[Attachment: ${a.url}]`).join(' ');
                return `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content || '(No text content)'} ${attachments}`.trim();
            }).join('\n');

            const transcriptFileName = `transcript-${message.channel.id}-${Date.now()}.txt`;
            fs.writeFileSync(transcriptFileName, transcriptContent);
            
            await message.reply({ embeds: [new EmbedBuilder().setColor('#0099ff').setTitle('<a:Green_Tick:1381583016073363508> Bulk Delete Snipe').setDescription(`A transcript of **${multiSnipes.length}** deleted messages has been sent to your DMs.`)] });
            
            try {
                await message.author.send({ content: `Transcript for #${message.channel.name}:`, files: [transcriptFileName] });
            } catch (error) {
                message.channel.send('I couldn\'t DM you the transcript. Do you have DMs disabled?');
            } finally {
                fs.unlinkSync(transcriptFileName);
                message.client.multiSnipes.delete(message.channel.id);
            }
            return;
        }

        // Handle single deletes
        const snipes = message.client.snipes.get(message.channel.id);
        if (!snipes || snipes.length === 0) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#ffc107').setTitle('Nothing to Snipe').setDescription('There are no recently deleted messages to snipe in this channel.')] });
        }
        
        const snipe = snipes.shift(); 
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: snipe.author.tag, iconURL: snipe.author.displayAvatarURL() })
            .setDescription(snipe.content || '`No text content`')
            .setTimestamp(snipe.timestamp);
        if (snipe.attachments) {
            embed.setImage(snipe.attachments);
        }
        await message.channel.send({ embeds: [embed] });
    },
};