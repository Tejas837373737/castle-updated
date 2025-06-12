const { EmbedBuilder } = require('discord.js');
const Giveaway = require('../models/giveaway');

async function endGiveaway(client, giveaway) {
    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) {
        console.error(`Giveaway End Error: Channel ${giveaway.channelId} could not be found.`);
        await Giveaway.updateOne({ _id: giveaway._id }, { ended: true });
        return;
    }

    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (!message) {
        console.error(`Giveaway End Error: Message ${giveaway.messageId} could not be found.`);
        await Giveaway.updateOne({ _id: giveaway._id }, { ended: true });
        return;
    }

    // --- THE FIX: Look for your specific custom emoji ID ---
    const reaction = message.reactions.cache.get('1382330301006741566');
    let participants = [];

    // Only fetch users if the reaction exists
    if (reaction) {
        const users = await reaction.users.fetch();
        participants = users.filter(user => !user.bot).map(user => user.id);
    }
    
    giveaway.participants = participants;
    let winners = [];

    if (participants.length > 0) {
        // Ensure we don't try to pick more winners than there are participants
        const winnerCount = Math.min(giveaway.winnerCount, participants.length);
        let potentialWinners = [...participants];

        for (let i = 0; i < winnerCount; i++) {
            const winnerIndex = Math.floor(Math.random() * potentialWinners.length);
            winners.push(potentialWinners[winnerIndex]);
            // Remove the winner from the potential list so they can't win twice
            potentialWinners.splice(winnerIndex, 1);
        }
    }
    
    giveaway.winners = winners;
    giveaway.ended = true;
    await giveaway.save();

    // --- Announcement Logic ---
    const winnerTags = winners.map(id => `<@${id}>`).join(', ');
    const announcement = winners.length > 0 
        ? `Congratulations ${winnerTags}! You won the **${giveaway.prize}**!`
        : 'No one entered the giveaway, so there are no winners.';

     const endedEmbed = new EmbedBuilder()
        .setColor('#dc3545')
        .setTitle(` Giveaway Ended! `)
        .setDescription(`**Prize:** ${giveaway.prize}\n\n**Winner(s):** ${winners.length > 0 ? winnerTags : 'None'}\nHosted by: <@${giveaway.hostedBy}>`)
        .setTimestamp(giveaway.endsAt)
        .setFooter({ text: 'Giveaway ended' });

    // Edit the original giveaway message and send a new one with the announcement
    await message.edit({ embeds: [endedEmbed], components: [] });
    await channel.send(announcement);
}

function startGiveawayChecker(client) {
    console.log('✅ Giveaway checker started. Will check for ended giveaways every 15 seconds.');
    setInterval(async () => {
        const expiredGiveaways = await Giveaway.find({ ended: false, endsAt: { $lte: new Date() } });

        if (expiredGiveaways.length > 0) {
            for (const giveaway of expiredGiveaways) {
                await endGiveaway(client, giveaway);
            }
        }
    }, 15000);
}

module.exports = { startGiveawayChecker, endGiveaway };
