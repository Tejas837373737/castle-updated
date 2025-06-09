const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'help',
    description: 'Lists all available commands or info about a specific command.',
    aliases: ['commands'],
    execute(message, args, client) {
        // The prefix is fetched from your .env file
        const prefix = process.env.PREFIX;

        // If no arguments are provided (i.e., just '!help')
        if (!args.length) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(' <a:Moderation:1381564322278281246> Bot Commands')
                .setDescription(`Here is a list of all available commands.\nFor more details on a specific command, type \`${prefix}help [command name]\`.`);

            // Read the sub-folders in the 'commands' directory
            const commandFolders = fs.readdirSync('./commands');

            for (const folder of commandFolders) {
                // Get all the command files in the sub-folder
                const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
                
                // Map the command files to a string with their name and description
                const commandList = commandFiles
                    .map(file => {
                        const command = require(`../${folder}/${file}`);
                        return `\`${command.name}\``; // Just show the command name
                    })
                    .join(', '); // Join with a comma and space

                if (commandList) {
                    // Add a field to the embed for each category
                    helpEmbed.addFields({
                        // Capitalize the folder name for the field title
                        name: `**${folder.charAt(0).toUpperCase() + folder.slice(1)}**`,
                        value: commandList,
                    });
                }
            }

            return message.channel.send({ embeds: [helpEmbed] });
        }

        // If a specific command is asked for (e.g., '!help kick')
        const commandName = args[0].toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) {
            return message.reply('That\'s not a valid command!');
        }

        // Create an embed for the specific command
        const commandEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Command: \`  ${command.name}\``)
            .setDescription(command.description || 'No description available.');

        if (command.aliases) {
            commandEmbed.addFields({ name: 'Aliases', value: `\`${command.aliases.join(', ')}\``, inline: true });
        }

        // A good practice is to add a 'usage' property to your command files
        if (command.usage) {
            commandEmbed.addFields({ name: 'Usage', value: `\`${prefix}${command.name} ${command.usage}\``, inline: true });
        }

        return message.channel.send({ embeds: [commandEmbed] });
    },
};