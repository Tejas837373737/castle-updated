const { Schema, model } = require('mongoose');

// This schema defines how we'll store warnings for users.
const userWarningsSchema = new Schema({
    // The ID of the server where the warning was issued.
    guildId: {
        type: String,
        required: true,
    },
    // The ID of the user who was warned.
    userId: {
        type: String,
        required: true,
    },
    // An array to hold all the warning objects.
    warnings: [
        {
            // The ID of the moderator who gave the warning.
            moderator: {
                type: String,
                required: true,
            },
            // The reason for the warning.
            reason: {
                type: String,
                required: true,
            },
            // The date and time the warning was issued.
            // It defaults to the current time when a new warning is created.
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

// Creates and exports the Mongoose model.
// 'UserWarnings' will be the name of the collection in MongoDB.
module.exports = model('UserWarnings', userWarningsSchema);