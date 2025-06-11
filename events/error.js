const { Events } = require('discord.js');

module.exports = {
    name: Events.Error,
    execute(error) {
        // This will catch generic client errors and prevent the bot from crashing.
        console.error('A client error occurred:', error);
        console.log('This is often due to a temporary network issue. The bot will attempt to recover.');
    },
};