const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const Giveaway = require('../../models/giveaway');
const ms = require('ms');
const { endGiveaway } = require('../../utils/giveawayManager');

// Define your custom emoji ID here to use it easily in both command types
const GIVEAWAY_EMOJI_ID = '1382330301006741566';
const GIVEAWAY_EMOJI_TAG = `<a:Giveaway:${GIVEAWAY_EMOJI_ID}>`;

module.exports = {
    // --- Data for Prefix Command ---
    name: 'giveaway',
    description: 'Manages the giveaway system.',
    usage: '<create|reroll|end|participants> [options]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manages the giveaway system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Starts a new giveaway.')
                .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 10m, 1h, 1d).').setRequired(true))
                .addIntegerOption(opt => opt.setName('winners').setDescription('The number of winners.').setRequired(true).setMinValue(1))
                .addStringOption(opt => opt.setName('prize').setDescription('The prize for the giveaway.').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('Picks a new winner for an ended giveaway.')
                .addStringOption(opt => opt.setName('message_id').setDescription('The message ID of the giveaway.').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('Ends a giveaway early.')
                .addStringOption(opt => opt.setName('message_id').setDescription('The message ID of the giveaway.').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('participants')
                .setDescription('Lists the participants of a giveaway.')
                .addStringOption(opt => opt.setName('message_id').setDescription('The message ID of the giveaway.').setRequired(true))),

    // --- Execute Function for Prefix Command ---
    async execute(message, args, client) {
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Permission Denied').setDescription('You do not have the Manager Role.')] });
        }

        const subCommand = args.shift()?.toLowerCase();
        
        switch (subCommand) {
            case 'create': {
                const duration = args[0];
                const winnerCount = parseInt(args[1]);
                const prize = args.slice(2).join(' ');
                if (!duration || !winnerCount || !prize || isNaN(winnerCount) || winnerCount < 1) return message.reply(`**Usage:** \`${process.env.PREFIX}giveaway create <duration> <winners> <prize>\``);
                const durationMs = ms(duration);
                if (!durationMs) return message.reply('Please provide a valid duration (e.g., 10m, 1h, 1d).');
                
                const endsAt = new Date(Date.now() + durationMs);
                const embed = new EmbedBuilder().setColor('#f1c40f').setTitle(`🎁 ${prize} 🎁`).setDescription(`React with ${GIVEAWAY_EMOJI_TAG} to enter!\nEnds: <t:${Math.floor(endsAt.getTime() / 1000)}:R>\nHosted by: ${message.author}`).setFooter({ text: `${winnerCount} winner(s) | Ends at`}).setTimestamp(endsAt);
                const defaultBanner = process.env.DEFAULT_GIVEAWAY_BANNER;
                if (defaultBanner) embed.setImage(defaultBanner);
                
                const giveawayMessage = await message.channel.send({ embeds: [embed] });
<<<<<<< HEAD
                await giveawayMessage.react(GIVEAWAY_EMOJI_ID);
=======
                await giveawayMessage.react('🎉');
>>>>>>> b10663632ba29a22c353f7d06e01ba6a178b7bbb

                const newGiveaway = new Giveaway({ messageId: giveawayMessage.id, channelId: message.channel.id, guildId: message.guild.id, prize, winnerCount, endsAt, hostedBy: message.author.id });
                await newGiveaway.save();
                await message.delete();
                break;
            }
            case 'reroll': {
                const messageId = args[0];
                if (!messageId) return message.reply('Please provide the message ID of the giveaway to reroll.');
                const giveaway = await Giveaway.findOne({ messageId, ended: true });
                if (!giveaway) return message.reply('Could not find an ended giveaway with that message ID.');
                if (giveaway.participants.length <= giveaway.winners.length) return message.reply('There are no unique participants left to choose from.');
                let newWinnerId;
                do { newWinnerId = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)]; } while (giveaway.winners.includes(newWinnerId));
                giveaway.winners.push(newWinnerId);
                await giveaway.save();
                await message.channel.send(`Congratulations <@${newWinnerId}>! You are the new winner of the **${giveaway.prize}**!`);
                break;
            }
            case 'end': {
                const messageId = args[0];
                if (!messageId) return message.reply('Please provide the message ID of the giveaway to end.');
                const giveaway = await Giveaway.findOne({ messageId, ended: false });
                if (!giveaway) return message.reply('Could not find an active giveaway with that message ID.');
                await endGiveaway(client, giveaway);
                await message.reply('The giveaway has been ended successfully.');
                break;
            }
            case 'participants': {
                const messageId = args[0];
                if (!messageId) return message.reply('Please provide the message ID of the giveaway to check.');
                const giveaway = await Giveaway.findOne({ messageId });
                if (!giveaway) return message.reply('Could not find a giveaway with that message ID in the database.');
                try {
                    const channel = await client.channels.fetch(giveaway.channelId);
                    const giveawayMessage = await channel.messages.fetch(giveaway.messageId);
                    const reaction = giveawayMessage.reactions.cache.get(GIVEAWAY_EMOJI_ID);
                    if (!reaction) return message.reply('No one has entered the giveaway yet.');
                    const reactionUsers = await reaction.users.fetch();
                    const participants = reactionUsers.filter(user => !user.bot);
                    const participantCount = participants.size;
                    if (participantCount === 0) return message.reply('No one has entered the giveaway yet.');
                    const displayLimit = 25;
                    const participantList = participants.first(displayLimit).map((user, i) => `**${i + 1}.** ${user.tag}`).join('\n');
                    let finalDescription = participantList;
                    if (participantCount > displayLimit) finalDescription += `\n... and **${participantCount - displayLimit}** more.`;
                    const embed = new EmbedBuilder().setColor('#0099ff').setTitle(`Participants for "${giveaway.prize}"`).setDescription(finalDescription).setFooter({ text: `Total Participants: ${participantCount}`});
                    await message.reply({ embeds: [embed] });
                } catch (error) { message.reply('Could not fetch the giveaway message. It may have been deleted.'); }
                break;
            }
            default:
                message.reply(`Invalid subcommand. Use \`create\`, \`reroll\`, \`end\`, or \`participants\`.`);
        }
    },
<<<<<<< HEAD

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId || !interaction.member.roles.cache.has(guildConfig.managerRoleId)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Permission Denied').setDescription('You do not have the Manager Role.')], ephemeral: true });
        }
        
        const subCommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true });

        try {
            switch (subCommand) {
                case 'create': {
                    const duration = interaction.options.getString('duration');
                    const winnerCount = interaction.options.getInteger('winners');
                    const prize = interaction.options.getString('prize');
                    const durationMs = ms(duration);
                    if (!durationMs) return interaction.editReply({ content: 'You provided an invalid duration. Please use a format like `10m`, `1h`, or `7d`.' });
                    const endsAt = new Date(Date.now() + durationMs);
                    const embed = new EmbedBuilder().setColor('#f1c40f').setTitle(`🎁 ${prize} 🎁`).setDescription(`React with ${GIVEAWAY_EMOJI_TAG} to enter!\nEnds: <t:${Math.floor(endsAt.getTime() / 1000)}:R>\nHosted by: ${interaction.user}`).setFooter({ text: `${winnerCount} winner(s) | Ends at`}).setTimestamp(endsAt);
                    const defaultBanner = process.env.DEFAULT_GIVEAWAY_BANNER;
                    if (defaultBanner) embed.setImage(defaultBanner);
                    const giveawayMessage = await interaction.channel.send({ embeds: [embed] });
                    await giveawayMessage.react(GIVEAWAY_EMOJI_ID);
                    const newGiveaway = new Giveaway({ messageId: giveawayMessage.id, channelId: interaction.channel.id, guildId: interaction.guild.id, prize, winnerCount, endsAt, hostedBy: interaction.user.id });
                    await newGiveaway.save();
                    return interaction.editReply({ content: `Giveaway for **${prize}** has been successfully started in ${interaction.channel}!` });
                }
                case 'reroll': {
                    const messageId = interaction.options.getString('message_id');
                    const giveaway = await Giveaway.findOne({ messageId, ended: true });
                    if (!giveaway) return interaction.editReply({ content: 'Could not find an ended giveaway with that message ID.' });
                    if (giveaway.participants.length <= giveaway.winners.length) return interaction.editReply({ content: 'There are no unique participants left to choose from.' });
                    let newWinnerId;
                    do { newWinnerId = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)]; } while (giveaway.winners.includes(newWinnerId));
                    giveaway.winners.push(newWinnerId);
                    await giveaway.save();
                    await interaction.channel.send(`Congratulations <@${newWinnerId}>! You are the new winner of the **${giveaway.prize}**!`);
                    return interaction.editReply({ content: `New winner has been announced for the **${giveaway.prize}** giveaway.` });
                }
                case 'end': {
                    const messageId = interaction.options.getString('message_id');
                    const giveaway = await Giveaway.findOne({ messageId, ended: false });
                    if (!giveaway) return interaction.editReply({ content: 'Could not find an active giveaway with that message ID.' });
                    await endGiveaway(interaction.client, giveaway);
                    return interaction.editReply({ content: 'The giveaway has been ended successfully.' });
                }
                case 'participants': {
                    const messageId = interaction.options.getString('message_id');
                    const giveaway = await Giveaway.findOne({ messageId });
                    if (!giveaway) return interaction.editReply({ content: 'Could not find a giveaway with that message ID.' });
                    const channel = await interaction.client.channels.fetch(giveaway.channelId);
                    const giveawayMessage = await channel.messages.fetch(giveaway.messageId);
                    const reaction = giveawayMessage.reactions.cache.get(GIVEAWAY_EMOJI_ID);
                    if (!reaction) return interaction.editReply({ content: 'No one has entered the giveaway yet.' });
                    const reactionUsers = await reaction.users.fetch();
                    const participants = reactionUsers.filter(user => !user.bot);
                    const participantCount = participants.size;
                    if (participantCount === 0) return interaction.editReply({ content: 'No one has entered the giveaway yet.' });
                    const displayLimit = 25;
                    const participantList = participants.first(displayLimit).map((user, i) => `**${i + 1}.** ${user.tag}`).join('\n');
                    let finalDescription = participantList;
                    if (participantCount > displayLimit) finalDescription += `\n... and **${participantCount - displayLimit}** more.`;
                    const embed = new EmbedBuilder().setColor('#0099ff').setTitle(`Participants for "${giveaway.prize}"`).setDescription(finalDescription).setFooter({ text: `Total Participants: ${participantCount}`});
                    return interaction.editReply({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('Giveaway slash command error:', error);
            await interaction.editReply({ content: 'An unexpected error occurred.' });
        }
    }
};
=======
};
>>>>>>> b10663632ba29a22c353f7d06e01ba6a178b7bbb
