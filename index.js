const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.snipes = new Map();
client.multiSnipes = new Map();
client.commands = new Collection();

console.log('--- Loading Commands ---');
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        try {
            const command = require(`./commands/${folder}/${file}`);
            client.commands.set(command.name, command);
            console.log(`- Loaded: ${file}`);
        } catch (error) {
            console.error(`Failed to load command ${file}:`, error);
        }
    }
}

console.log('--- Loading Events ---');
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    try {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`- Loaded: ${file}`);
    } catch (error) {
        console.error(`Failed to load event ${file}:`, error);
    }
}

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild || !message.content.startsWith(process.env.PREFIX)) return;
    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;
    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`Error executing ${commandName}`, error);
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB!');
        client.login(process.env.TOKEN);
    }).catch(err => console.error('DB Connection Error:', err));
    mongoose.connection.on('disconnected', () => {
    console.log('MongoDB: Connection disconnected.');
});