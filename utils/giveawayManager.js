const { EmbedBuilder } = require('discord.js');
const Giveaway = require('../models/giveaway');

async function endGiveaway(client, giveaway) {
    console.log(`[END_GIVEAWAY] Starting to process giveaway for prize: "${giveaway.prize}" (Message ID: ${giveaway.messageId})`);
    
    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) return console.error(`[END_GIVEAWAY_ERROR] Channel ${giveaway.channelId} not found or inaccessible.`);
    console.log(`[END_GIVEAWAY] Successfully fetched channel: #${channel.name}`);

    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (!message) return console.error(`[END_GIVEAWAY_ERROR] Giveaway message ${giveaway.messageId} not found.`);
    console.log(`[END_GIVEAWAY] Successfully fetched giveaway message.`);

    const reaction = message.reactions.cache.get('🎉');
    if (!reaction) {
        console.log('[END_GIVEAWAY] No 🎉 reaction found on the message. Ending with no winners.');
    }
    const users = await reaction?.users.fetch().catch(() => new Map()) || new Map();
    const participants = users.filter(user => !user.bot).map(user => user.id);
    console.log(`[END_GIVEAWAY] Found ${participants.length} valid participant(s).`);

    giveaway.participants = participants;
    let winners = [];
    if (participants.length > 0) {
        const winnerCount = Math.min(giveaway.winnerCount, participants.length);
        let potentialWinners = [...participants];
        for (let i = 0; i < winnerCount; i++) {
            const winnerIndex = Math.floor(Math.random() * potentialWinners.length);
            winners.push(potentialWinners[winnerIndex]);
            potentialWinners.splice(winnerIndex, 1);
        }
    }
    console.log(`[END_GIVEAWAY] Picked winners: [${winners.join(', ')}]`);

    giveaway.winners = winners;
    giveaway.ended = true;
    await giveaway.save();
    console.log('[END_GIVEAWAY] Saved final giveaway state to database.');

    const winnerTags = winners.map(id => `<@${id}>`).join(', ');
    const announcement = winners.length > 0 ? `Congratulations ${winnerTags}! You won the **${giveaway.prize}**!` : 'No one entered the giveaway, so there are no winners.';
    const endedEmbed = new EmbedBuilder()
        .setColor('#dc3545').setTitle(`🎁 Giveaway Ended! 🎁`)
        .setDescription(`**Prize:** ${giveaway.prize}\n\n**Winner(s):** ${winners.length > 0 ? winnerTags : 'None'}\nHosted by: <@${giveaway.hostedBy}>`)
        .setTimestamp(giveaway.endsAt).setFooter({ text: 'Giveaway ended' });

    await message.edit({ embeds: [endedEmbed], components: [] });
    console.log('[END_GIVEAWAY] Edited original giveaway message.');
    await channel.send(announcement);
    console.log('[END_GIVEAWAY] Sent winner announcement. Process complete.');
}

function startGiveawayChecker(client) {
    console.log('✅ Giveaway checker started. Will check for ended giveaways every 15 seconds.');
    setInterval(async () => {
        console.log('[GIVEAWAY_CHECKER] Running periodic check...');
        const expiredGiveaways = await Giveaway.find({ ended: false, endsAt: { $lte: new Date() } });

        if (expiredGiveaways.length > 0) {
            console.log(`[GIVEAWAY_CHECKER] Found ${expiredGiveaways.length} expired giveaway(s) to process.`);
            for (const giveaway of expiredGiveaways) {
                await endGiveaway(client, giveaway);
            }
        } else {
            console.log('[GIVEAWAY_CHECKER] No expired giveaways found.');
        }
    }, 15000); // Check every 15 seconds
}

module.exports = { startGiveawayChecker, endGiveaway };