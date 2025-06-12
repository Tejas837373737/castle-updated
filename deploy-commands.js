const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check for necessary variables
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
// We no longer need the GUILD_ID for global deployment
if (!token || !clientId) {
    console.error('Error: Missing required variables (TOKEN or CLIENT_ID) in your .env file.');
    process.exit(1);
}

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'executeSlash' in command) { // Check for executeSlash
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) global commands.`);

        // --- THE FIX: We use 'applicationCommands' instead of 'applicationGuildCommands' ---
        // This registers the commands globally to all servers.
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) global commands.`);
    } catch (error) {
        console.error(error);
    }
})();