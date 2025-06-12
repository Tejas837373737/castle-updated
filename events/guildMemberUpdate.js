const { Events, EmbedBuilder } = require('discord.js');
const { sendServerLog } = require('../utils/serverlog');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember, client) {
        // Ignore bots
        if (newMember.user.bot) return;

        // --- Nickname Change Detection ---
        if (oldMember.nickname !== newMember.nickname) {
            await sendServerLog(
                client,
                newMember.guild,
                'Nickname Changed',
                '#3498db', // Blue
                [
                    { name: 'Member', value: `${newMember.user.tag} (${newMember.id})` },
                    { name: 'Before', value: `\`${oldMember.nickname || 'None'}\``, inline: true },
                    { name: 'After', value: `\`${newMember.nickname || 'None'}\``, inline: true }
                ],
                newMember.user.displayAvatarURL()
            );
        }

        // --- Role Change Detection ---
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        // Check if a role was added
        const addedRole = newRoles.find(role => !oldRoles.has(role.id));
        if (addedRole) {
            await sendServerLog(
                client,
                newMember.guild,
                'Role Added',
                '#2ecc71', // Emerald Green
                [
                    { name: 'Member', value: `${newMember.user.tag} (${newMember.id})` },
                    { name: 'Role Added', value: `${addedRole.name} (\`${addedRole.id}\`)` }
                ],
                newMember.user.displayAvatarURL()
            );
        }

        // Check if a role was removed
        const removedRole = oldRoles.find(role => !newRoles.has(role.id));
        if (removedRole) {
            await sendServerLog(
                client,
                newMember.guild,
                'Role Removed',
                '#e74c3c', // Red
                [
                    { name: 'Member', value: `${newMember.user.tag} (${newMember.id})` },
                    { name: 'Role Removed', value: `${removedRole.name} (\`${removedRole.id}\`)` }
                ],
                newMember.user.displayAvatarURL()
            );
        }
    },
};