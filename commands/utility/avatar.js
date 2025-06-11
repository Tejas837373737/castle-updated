const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'av',
    description: ' Displays a user\'s avatar by mention or ID.',
    aliases: ['icon', 'pfp'],
    usage: '[@user|userID]',
    // The function is now async to handle fetching users
    async execute(message, args, client) {
        let targetUser;

        try {
            // --- THE FIX: The Target Resolver Logic ---

            // 1. Check for a mentioned user first
            if (message.mentions.users.first()) {
                targetUser = message.mentions.users.first();
            } 
            // 2. If no mention, check if an argument (the ID) was provided
            else if (args[0]) {
                targetUser = await client.users.fetch(args[0]);
            } 
            // 3. If no mention and no ID, default to the command author
            else {
                targetUser = message.author;
            }
        } catch (error) {
            console.error('Error fetching user for avatar command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('User Not Found')
                .setDescription('Could not find that user. Please provide a valid mention or User ID.');
            return message.reply({ embeds: [errorEmbed] });
        }
        
        // --- Embed Creation (This part remains the same) ---
        const avatarPNG = targetUser.displayAvatarURL({ format: 'png', size: 1024 });
        const avatarJPG = targetUser.displayAvatarURL({ format: 'jpg', size: 1024 });
        const avatarWEBP = targetUser.displayAvatarURL({ format: 'webp', size: 1024 });
        const avatarGIF = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

        const avatarEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Avatar of ${targetUser.username}`)
            .setImage(avatarGIF)
            .setDescription(`Download as:\n[PNG](${avatarPNG}) | [JPG](${avatarJPG}) | [WEBP](${avatarWEBP})`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [avatarEmbed] });
    },
};