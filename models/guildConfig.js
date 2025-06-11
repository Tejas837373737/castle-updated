const { Schema, model } = require('mongoose');

// This schema defines how we'll store the moderator role for each server (guild).
const guildConfigSchema = new Schema({
    // The unique ID of the Discord server (e.g., '987654321098765432')
    guildId: {
        type: String,
        required: true,
        unique: true, // Each server should only have one entry
    },
    // The unique ID of the role designated as the moderator role
    modRole: {
        type: String,
        required: true,
    },
     logChannelId: {
        type: String,
        required: false,
     },
      managerRoleId: {
        type: String,
        required: false, // Optional, as not all servers may use it
    },
     snipeLogChannelId: {
        type: String,
        required: false,
    },
     serverLogChannelId: { // This is your new server log
        type: String,
        required: false,
    },
     countableChannels: {
        type: [String], // This will be an array of channel IDs
        default: [],
    },
});

// Creates and exports the Mongoose model based on the schema.
// 'GuildConfig' will be the name of the collection in MongoDB (usually pluralized to 'guildconfigs').
module.exports = model('GuildConfig', guildConfigSchema);