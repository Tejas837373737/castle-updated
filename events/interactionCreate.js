const { Events, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/guildConfig');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        
        // --- Handler for Slash Commands ---
        if (interaction.isChatInputCommand()) {
            // THE FIX: It now looks in the main 'commands' collection.
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            
            // This checks if the command has been upgraded to handle slash commands
            if (!command.executeSlash) {
                return interaction.reply({ content: `The slash command version of \`${interaction.commandName}\` is not yet available.`, ephemeral: true, flags: 64 });
            }

            try {
                // It calls the specific 'executeSlash' function
                await command.executeSlash(interaction);
            } catch (error) {
                console.error(`Error executing slash command /${interaction.commandName}`, error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true, flags: 64 });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true, flags: 64 });
                }
            }
            return;
        }

        // --- Handler for Select Menu (Dropdown) Interactions ---
        if (interaction.isStringSelectMenu()) {
            const isDeveloper = interaction.user.id === process.env.DEVELOPER_ID;
            const prefix = process.env.PREFIX;

            await interaction.deferReply({ flags: 64 });

            // Handler for the Command Category Dropdown
            if (interaction.customId === 'command_category_select') {
                const category = interaction.values[0].replace('category_', '');
                
                // THE FIX: Get commands from the cache instead of reading files again.
                const categoryCommands = client.commands.filter(cmd => cmd.folder === category);

                const categoryEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} Commands`);

                let commandList = categoryCommands
                    .filter(cmd => !(cmd.developerOnly && !isDeveloper)) // Filter out dev commands for non-devs
                    .map(cmd => `**\`${prefix}${cmd.name}\`**\n${cmd.description || 'No description provided.'}\n`)
                    .join('\n');

                if (!commandList) commandList = 'No commands found in this category.';
                
                categoryEmbed.setDescription(commandList);
                await interaction.editReply({ embeds: [categoryEmbed] });
                return;
            }

            // Handler for the Settings Dropdown
            if (interaction.customId === 'settings_select_menu') {
                const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
                const selectedValue = interaction.values[0];
                let title = '';
                let description = '';
                // This switch statement with your custom emojis is preserved
                switch (selectedValue) {
                    case 'setting_mod_role':
                        title = '<:mod:1382722988050354266> Moderator Role';
                        description = `This role is required for moderation commands.\n\n**Currently Set To:** ${guildConfig?.modRole ? `<@&${guildConfig.modRole}>` : '`Not Set`'}\n**To Change:** \`${prefix}setmodrole @role\``;
                        break;
                    case 'setting_manager_role':
                        title = '<:admin:1382722924309381221> Manager Role';
                        description = `This role is required for management commands.\n\n**Currently Set To:** ${guildConfig?.managerRoleId ? `<@&${guildConfig.managerRoleId}>` : '`Not Set`'}\n**To Change:** \`${prefix}setmanagerrole @role\``;
                        break;
                    case 'setting_log_channels':
                        title = '<:settings:1382325149235286030> Logging Channels';
                        const modLog = guildConfig?.logChannelId ? `<#${guildConfig.logChannelId}>` : '`Not Set`';
                        const serverLog = guildConfig?.serverLogChannelId ? `<#${guildConfig.serverLogChannelId}>` : '`Not Set`';
                        const snipeLog = guildConfig?.snipeLogChannelId ? `<#${guildConfig.snipeLogChannelId}>` : '`Not Set`';
                        description = `**Mod Log:** ${modLog} (\`${prefix}setlogchannel\`)\n**Server Log:** ${serverLog} (\`${prefix}setserverlog\`)\n**Snipe Log:** ${snipeLog} (\`${prefix}setsnipelog\`)`;
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
        }
    },
};
