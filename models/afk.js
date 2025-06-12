const { Schema, model } = require('mongoose');

const afkSchema = new Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: String, required: true },
    since: { type: Date, default: Date.now },
    pings: [{
        pingerId: { type: String, required: true },
        pingerTag: { type: String, required: true },
        messageURL: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        content: { type: String, required: true }
    }]
});

module.exports = model('AFK', afkSchema);