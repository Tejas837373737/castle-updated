// events/ready.js
const { Events } = require('discord.js');
const { startGiveawayChecker } = require('../utils/giveawayManager'); 

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(` Ready! Logged in as ${client.user.tag} ✅✅✅`); // Added emojis to make it stand out
        // Your presence/activity code would also be here
        client.user.setActivity('/help');
        console.log('Giveaway checker started.');
        startGiveawayChecker(client);
    },
};
