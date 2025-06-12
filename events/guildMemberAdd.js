const { Events, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/guildConfig');
const { sendServerLog } = require('../utils/serverlog'); // Use our server log utility

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        // Use the centralized logging function
        await sendServerLog(
            client,
            member.guild,
            'Member Joined',
            '#28a745', // Green
            [
                { name: 'Member', value: `${member.user.tag} (${member.id})`, inline: false },
                { name: 'Account Created', value: `<t:${parseInt(member.user.createdTimestamp / 1000)}:R>`, inline: false }
            ],
            member.user.displayAvatarURL() // Use member's avatar as thumbnail
        );
    },
};