const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const Giveaway = require('../../models/giveaway');
const ms = require('ms');
const { endGiveaway } = require('../../utils/giveawayManager');

module.exports = {
    name: 'giveaway',
    description: 'Manages the giveaway system.',
    usage: '<create|reroll|end|list|participants> [options]',
    async execute(message, args, client) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Permission Denied').setDescription('You do not have the Manager Role.')] });
        }

        const subCommand = args[0]?.toLowerCase();
        
        switch (subCommand) {
            case 'create': {
                const duration = args[1];
                const winnerCount = parseInt(args[2]);
                const prize = args.slice(3).join(' ');

                if (!duration || !winnerCount || !prize || isNaN(winnerCount)) {
                    return message.reply(`**Usage:** \`${process.env.PREFIX}giveaway create <duration> <winners> <prize>\`\n**Example:** \`1d 1 Nitro\``);
                }
                if (winnerCount < 1) {
                    return message.reply('The number of winners must be at least 1.');
                }
                const durationMs = ms(duration);
                if (!durationMs) {
                    return message.reply('Please provide a valid duration (e.g., 10m, 1h, 1d).');
                }
                
                const endsAt = new Date(Date.now() + durationMs);

                const embed = new EmbedBuilder()
                    .setColor('#f1c40f')
                    .setTitle(` ${prize} `)
                    .setDescription(`React with <a:Giveaway:1382330301006741566>  to enter!\nEnds: <t:${Math.floor(endsAt.getTime() / 1000)}:R>\nHosted by: ${message.author}`)
                    // --- THIS LINE ADDS THE WINNER COUNT TO THE FOOTER ---
                    .setFooter({ text: `${winnerCount} winner(s) | Ends at`})
                    .setTimestamp(endsAt);
                
                const giveawayMessage = await message.channel.send({ embeds: [embed] });
                await giveawayMessage.react('🎉');

                const newGiveaway = new Giveaway({
                    messageId: giveawayMessage.id,
                    channelId: message.channel.id,
                    guildId: message.guild.id,
                    prize,
                    winnerCount,
                    endsAt,
                    hostedBy: message.author.id,
                });
                await newGiveaway.save();
                
                await message.delete();
                break;
            }
            case 'reroll': {
                const messageId = args[1];
                if (!messageId) return message.reply('Please provide the message ID of the giveaway to reroll.');
                
                const giveaway = await Giveaway.findOne({ messageId, ended: true });
                if (!giveaway) return message.reply('Could not find an ended giveaway with that message ID.');
                
                if (giveaway.participants.length === 0) return message.reply('There were no participants to reroll from.');

                let newWinnerId = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
                let attempts = 0;
                while (giveaway.winners.includes(newWinnerId) && attempts < giveaway.participants.length) {
                    newWinnerId = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
                    attempts++;
                }

                if (giveaway.winners.includes(newWinnerId) && giveaway.participants.length > giveaway.winners.length) return message.reply('A new unique winner could not be found.');
                
                giveaway.winners.push(newWinnerId);
                await giveaway.save();

                await message.channel.send(`Congratulations <@${newWinnerId}>! You are the new winner of the **${giveaway.prize}**!`);
                break;
            }
            case 'end': {
                const messageId = args[1];
                if (!messageId) return message.reply('Please provide the message ID of the giveaway to end.');
                
                const giveaway = await Giveaway.findOne({ messageId, ended: false });
                if (!giveaway) return message.reply('Could not find an active giveaway with that message ID.');
                
                await endGiveaway(client, giveaway);
                await message.reply('The giveaway has been ended successfully.');
                break;
            }
            case 'participants': {
                const messageId = args[1];
                if (!messageId) return message.reply('Please provide the message ID of the giveaway to check.');

                const giveaway = await Giveaway.findOne({ messageId });
                if (!giveaway) return message.reply('Could not find a giveaway with that message ID in the database.');
                
                try {
                    const channel = await client.channels.fetch(giveaway.channelId);
                    const giveawayMessage = await channel.messages.fetch(giveaway.messageId);
                    const reaction = giveawayMessage.reactions.cache.get('🎉');
                    
                    if (!reaction) return message.reply('Could not find any participants.');

                    const reactionUsers = await reaction.users.fetch();
                    const participants = reactionUsers.filter(user => !user.bot);
                    const participantCount = participants.size;

                    if (participantCount === 0) return message.reply('No one has entered the giveaway yet.');

                    const displayLimit = 25;
                    const participantList = participants.first(displayLimit).map((user, i) => `**${i + 1}.** ${user.tag} (\`${user.id}\`)`).join('\n');
                    let finalDescription = participantList;
                    
                    if (participantCount > displayLimit) {
                        finalDescription += `\n... and **${participantCount - displayLimit}** more.`;
                    }

                    const embed = new EmbedBuilder().setColor('#0099ff').setTitle(`Participants for "${giveaway.prize}"`).setDescription(finalDescription).setFooter({ text: `Total Participants: ${participantCount}`});
                    await message.reply({ embeds: [embed] });

                } catch (error) {
                    console.error('Could not fetch giveaway participants:', error);
                    message.reply('Could not fetch the giveaway message from Discord. It may have been deleted.');
                }
                break;
            }
            default:
                message.reply(`Invalid subcommand. Use \`create\`, \`reroll\`, \`end\`, or \`participants\`.`);
        }
    },
};
