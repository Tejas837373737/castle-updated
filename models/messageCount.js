const { Schema, model } = require('mongoose');

const messageCountSchema = new Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    messageCount: { type: Number, default: 0 },
});

// Create a compound index to ensure each user only has one document per guild
messageCountSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = model('MessageCount', messageCountSchema);