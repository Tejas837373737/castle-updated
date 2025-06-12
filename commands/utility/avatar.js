const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // --- Data for Prefix Command ---
    name: 'avatar',
    description: 'Displays a user\'s avatar by mention or ID.',
    aliases: ['icon', 'pfp', 'avatar'],
    usage: '[@user|userID]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription("Get a user's avatar.")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose avatar you want to see. Defaults to you.')),

    // --- Execute Function for Prefix Command (Unchanged) ---
    async execute(message, args, client) {
        let targetUser;
        try {
            if (message.mentions.users.first()) {
                targetUser = message.mentions.users.first();
            } 
            else if (args[0]) {
                targetUser = await client.users.fetch(args[0]);
            } 
            else {
                targetUser = message.author;
            }
        } catch (error) {
            console.error('Error fetching user for avatar command:', error);
            const errorEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('User Not Found').setDescription('Could not find that user. Please provide a valid mention or User ID.');
            return message.reply({ embeds: [errorEmbed] });
        }
        
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

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        // Get the user from the option, or default to the user who ran the command
        const targetUser = interaction.options.getUser('user') || interaction.user;

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
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
        
        // This reply can be public
        await interaction.reply({ embeds: [avatarEmbed] });
    }
};