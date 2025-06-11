const { Schema, model } = require('mongoose');

const giveawaySchema = new Schema({
    messageId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    prize: { type: String, required: true },
    winnerCount: { type: Number, required: true },
    endsAt: { type: Date, required: true },
    hostedBy: { type: String, required: true },
    participants: { type: [String], default: [] },
    winners: { type: [String], default: [] },
    ended: { type: Boolean, default: false },
});

module.exports = model('Giveaway', giveawaySchema);