const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const UserWarnings = require('../../models/userWarnings');

module.exports = {
    name: 'warnings',
    description: 'Displays all warnings for a user by mention or ID.',
    usage: '[@user|userID]',
    // The execute function now needs the 'client' object to fetch users by ID
    async execute(message, args, client) {
        // --- Permission Check ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !message.member.roles.cache.has(guildConfig.modRole)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required moderator role to use this command.')] });
        }

        let targetUser;
        try {
            // --- THE FIX: The Target Resolver Logic ---
            // 1. Check for a mentioned user
            if (message.mentions.users.first()) {
                targetUser = message.mentions.users.first();
            } 
            // 2. If no mention, check if an ID was provided
            else if (args[0]) {
                targetUser = await client.users.fetch(args[0]);
            } 
            // 3. If no mention or ID, default to the command author
            else {
                targetUser = message.author;
            }
        } catch (error) {
            console.error('Error fetching user for warnings command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('<a:wrong:1381568998847545428> User Not Found')
                .setDescription('Could not find that user. Please provide a valid mention or User ID.');
            return message.reply({ embeds: [errorEmbed] });
        }

        // --- Database Action ---
        const userWarnings = await UserWarnings.findOne({
            guildId: message.guild.id,
            userId: targetUser.id, // Use the resolved target's ID
        });

        if (!userWarnings || userWarnings.warnings.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Warnings for ${targetUser.tag}`)
                .setDescription('This user has no warnings on record.');
            return message.channel.send({ embeds: [embed] });
        }

        // --- Embed Creation ---
        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle(`Warnings for ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

        // Loop through the warnings and add them as fields
        for (let i = 0; i < userWarnings.warnings.length; i++) {
            const warning = userWarnings.warnings[i];
            // Fetch moderator username, provide a fallback if not found
            const moderator = await client.users.fetch(warning.moderator).catch(() => null);
            embed.addFields({
                name: `Warning ${i + 1}`,
                value: `**Moderator:** ${moderator ? moderator.tag : 'Unknown'}\n**Reason:** ${warning.reason}\n**Date:** <t:${parseInt(warning.timestamp.getTime() / 1000)}:f>`,
                inline: false,
            });
        }

        await message.channel.send({ embeds: [embed] });
    },
};