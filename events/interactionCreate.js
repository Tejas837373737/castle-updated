const { Events, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/guildConfig');
const fs = require('fs');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isStringSelectMenu()) return;

        const isDeveloper = interaction.user.id === process.env.DEVELOPER_ID;
        const prefix = process.env.PREFIX;

        // --- Handler for the Command Category Dropdown ---
        if (interaction.customId === 'command_category_select') {
            // --- THE FIX: Defer the reply immediately ---
            // This tells Discord "I got it, I'm working on it!" and shows a "Bot is thinking..." message.
            await interaction.deferReply({ ephemeral: true });

            const category = interaction.values[0].replace('category_', '');
            const commandFiles = fs.readdirSync(`./commands/${category}`).filter(file => file.endsWith('.js'));

            const categoryEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`<:admin:1382318092201492511> ${category.charAt(0).toUpperCase() + category.slice(1)} Commands`);

            let commandList = '';
            for (const file of commandFiles) {
                // The require path needs to be correct relative to this file's location.
                const command = require(`../commands/${category}/${file}`);
                if (command.developerOnly && !isDeveloper) continue;
                
                if (command.name && command.description) {
                    commandList += `**\`${prefix}${command.name}\`**\n${command.description}\n\n`;
                }
            }

            if (!commandList) commandList = 'No commands found in this category.';
            
            categoryEmbed.setDescription(commandList);

            // --- THE FIX: Edit the original deferred reply with the final content ---
            await interaction.editReply({ embeds: [categoryEmbed] });
            return;
        }

        // --- Handler for the Settings Dropdown ---
        if (interaction.customId === 'settings_select_menu') {
            await interaction.deferReply({ ephemeral: true }); // Also good practice to add it here

            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            const selectedValue = interaction.values[0];
            let title = '';
            let description = '';

            // This switch statement remains the same
            switch (selectedValue) {
                 case 'setting_mod_role':
                    title = '<:Adminn:1382326000574136361> Moderator Role';
                    description = `This role is required for moderation commands.\n\n**Currently Set To:** ${guildConfig?.modRole ? `<@&${guildConfig.modRole}>` : '`Not Set`'}\n**To Change:** \`${prefix}setmodrole @role\``;
                    break;
                case 'setting_manager_role':
                    title = '<:adminn1:1382325697963622481> Manager Role';
                    description = `This role is required for management commands.\n\n**Currently Set To:** ${guildConfig?.managerRoleId ? `<@&${guildConfig.managerRoleId}>` : '`Not Set`'}\n**To Change:** \`${prefix}setmanagerrole @role\``;
                    break;
                case 'setting_log_channels':
                    title = '<:settings:1382325149235286030> Logging Channels';
                    const modLog = guildConfig?.logChannelId ? `<#${guildConfig.logChannelId}>` : '`Not Set`';
                    const serverLog = guildConfig?.serverLogChannelId ? `<#${guildConfig.serverLogChannelId}>` : '`Not Set`';
                    const snipeLog = guildConfig?.snipeLogChannelId ? `<#${guildConfig.snipeLogChannelId}>` : '`Not Set`';
                    description = `**Mod Log:** ${modLog} (\`${prefix}setlogchannel\`)
                                   **Server Log:** ${serverLog} (\`${prefix}setserverlog\`)
                                   **Snipe Log:** ${snipeLog} (\`${prefix}setsnipelog\`)`;
                    break;
                case 'setting_message_count':
                    title = '<:chat:1382326680521277510> Message Counting Channels';
                    const channels = guildConfig?.countableChannels.map(id => `<#${id}>`).join(', ') || '`None`';
                    description = `The bot only counts messages in specific channels.\n\n**Currently Counting In:** ${channels}\n**To Add:** \`${prefix}add-count-channel\`\n**To Remove:** \`${prefix}remove-count-channel\``;
                    break;
            }

            const detailEmbed = new EmbedBuilder().setColor('#17a2b8').setTitle(title).setDescription(description);
            await interaction.editReply({ embeds: [detailEmbed] });
        }
    },
};