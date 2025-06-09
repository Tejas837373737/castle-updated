const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'Displays a user\'s avatar in an embed with download links.',
    aliases: ['icon', 'pfp'],
    execute(message) {
        // Find the target user. If no user is mentioned, it defaults to the author of the message.
        const targetUser = message.mentions.users.first() || message.author;

        // Get the avatar URLs in different formats and sizes
        const avatarPNG = targetUser.displayAvatarURL({ format: 'png', size: 1024 });
        const avatarJPG = targetUser.displayAvatarURL({ format: 'jpg', size: 1024 });
        const avatarWEBP = targetUser.displayAvatarURL({ format: 'webp', size: 1024 });
        const avatarGIF = targetUser.displayAvatarURL({ dynamic: true, size: 1024 }); // For animated avatars

        // Create the embed message
        const avatarEmbed = new EmbedBuilder()
            .setColor('#0099ff') // You can set any hex color
            .setTitle(`Avatar of ${targetUser.username}`)
            .setImage(avatarGIF) // Set the main image to the user's avatar (dynamic to support GIFs)
            .setDescription(
                `Download as:\n` +
                `[PNG](${avatarPNG}) | ` +
                `[JPG](${avatarJPG}) | ` +
                `[WEBP](${avatarWEBP})`
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        // Send the embed as a reply
        message.channel.send({ embeds: [avatarEmbed] });
    },
};