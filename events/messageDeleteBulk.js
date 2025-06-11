const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageDeleteBulk,
    execute(messages, channel) {
        // --- THIS IS A CRITICAL CHECKPOINT ---
        console.log(`✅✅✅ [EVENT] BULK DELETE EVENT FIRED in #${channel.name}. Caught ${messages.size} messages.`);

        const multiSnipes = channel.client.multiSnipes;
        multiSnipes.set(channel.id, messages.reverse());
        
        console.log(`[EVENT] Set multi-snipe for channel ${channel.id}. The map now has ${multiSnipes.size} entries.`);

        setTimeout(() => {
            if (multiSnipes.has(channel.id)) {
                console.log(`[EVENT] Clearing bulk snipe for #${channel.name} after 5 minutes.`);
                multiSnipes.delete(channel.id);
            }
        }, 5 * 60 * 1000);
    },
};