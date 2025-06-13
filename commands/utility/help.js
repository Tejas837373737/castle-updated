const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// This helper function builds the entire help panel to avoid duplicating code.
async function buildHelpPanel(client) {
    // --- Links ---
    let linksString = '';
    const inviteLink = process.env.BOT_INVITE_LINK;
    const supportLink = process.env.SUPPORT_SERVER_INVITE;
    if (inviteLink) linksString += `[Invite Me](${inviteLink})`;
    if (supportLink) {
        if (linksString) linksString += ' | ';
        linksString += `[Support Server](${supportLink})`;
    }

    // --- The Main Introduction Embed ---
    const mainEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Welcome to ${client.user.username}!`)
        .setDescription(`I'm a multi-purpose bot designed to help you manage and engage your community. You can find my features below.`)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { name: 'My Prefix', value: `My command prefix is \`${process.env.PREFIX}\``, inline: true },
            { name: 'Get Started', value: 'Use the dropdowns below to navigate commands or view settings.', inline: true }
        );
    if (linksString) {
        mainEmbed.addFields({ name: '<:links:1382722707740823562> Quick Links', value: linksString, inline: false });
    }

    // --- Dropdown for Command Categories ---
    const commandFolders = fs.readdirSync(path.join(__dirname, '..')); // Go up one level to find all command folders
    const commandDropdownOptions = commandFolders.map(folder => ({
        label: `${folder.charAt(0).toUpperCase() + folder.slice(1)} Commands`,
        value: `category_${folder}`,
        description: `Browse all commands in the ${folder} category.`,
    }));
    const commandSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('command_category_select')
        .setPlaceholder('Browse Command Categories...')
        .addOptions(commandDropdownOptions);

    // --- Dropdown for Server Settings ---
    const settingsSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('settings_select_menu')
        .setPlaceholder(' View & Manage Server Settings...')
        .addOptions([
            { label: 'Moderator Role', description: 'View/Set the role for moderation commands.', value: 'setting_mod_role', emoji: '<:Adminn:1382326000574136361>' },
            { label: 'Manager Role', description: 'View/Set the role for management commands.', value: 'setting_manager_role', emoji: '<:adminn1:1382325697963622481>' },
            { label: 'Logging Channels', description: 'View/Set all logging channels.', value: 'setting_log_channels', emoji: '<:settings:1382325149235286030>' },
            { label: 'Message Counting', description: 'Manage channels for message counting.', value: 'setting_message_count', emoji: '<:chat:1382326680521277510>' }
        ]);

    const commandActionRow = new ActionRowBuilder().addComponents(commandSelectMenu);
    const settingsActionRow = new ActionRowBuilder().addComponents(settingsSelectMenu);
    
    // Return the final message payload
    return { embeds: [mainEmbed], components: [commandActionRow, settingsActionRow] };
}


module.exports = {
    // --- Data for Prefix Command ---
    name: 'help',
    description: 'Displays an interactive help and settings panel.',
    aliases: ['settings', 'config'],

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays the interactive help and settings panel.'),

    // --- Execute Function for Prefix Command ---
    async execute(message, args, client) {
        const helpPanel = await buildHelpPanel(client);
        await message.reply(helpPanel);
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const helpPanel = await buildHelpPanel(interaction.client);
        await interaction.reply(helpPanel);
    }
};
