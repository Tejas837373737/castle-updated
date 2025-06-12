const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const AFK = require('./models/afk');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// --- Memory & Command Collections ---
client.snipes = new Map();
client.multiSnipes = new Map();
client.commands = new Collection();

// --- Unified Command Loader ---
console.log('--- Loading All Commands ---');
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if (command.name) {
            command.folder = folder;
            client.commands.set(command.name, command);
            console.log(`- Loaded: ${folder}/${file}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "name" property.`);
        }
    }
}

// --- Event Handler ---
console.log('--- Loading Events ---');
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`- Loaded Event: ${file}`);
}


// ==========================================================
// --- FINAL MESSAGE HANDLER WITH PAGINATED AFK LOGIC ---
// ==========================================================
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // --- AFK System Logic ---

    // 1. Check if the message author is returning from AFK
    const afkData = await AFK.findOneAndDelete({ guildId: message.guild.id, userId: message.author.id });
    if (afkData) {
        const pings = afkData.pings || [];
        const itemsPerPage = 5;
        const totalPages = Math.ceil(pings.length / itemsPerPage);
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const currentPings = pings.slice(start, end);
            let description = `**Welcome back, ${message.member.displayName}!** I've removed your AFK status.`;

            const embed = new EmbedBuilder()
                .setColor(pings.length > 0 ? '#ffc107' : '#28a745')
                .setAuthor({ name: `${message.author.tag} is no longer AFK`, iconURL: message.author.displayAvatarURL() });

            if (pings.length > 0) {
                description += `\n\nYou were pinged **${pings.length}** time(s) while you were away:`;
                embed.addFields(currentPings.map(ping => ({
                    name: `Ping from ${ping.pingerTag}`,
                    value: `<t:${Math.floor(new Date(ping.timestamp).getTime() / 1000)}:R> [Jump to message](${ping.messageURL})`
                })));
                embed.setFooter({ text: `Page ${page + 1} of ${totalPages}` });
            }
            embed.setDescription(description);
            return embed;
        };
        
        const generateButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev_page').setLabel('◀️').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next_page').setLabel('▶️').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages - 1)
            );
        };

        const initialEmbed = generateEmbed(currentPage);
        const components = totalPages > 1 ? [generateButtons(currentPage)] : [];
        const replyMsg = await message.reply({ embeds: [initialEmbed], components: components, fetchReply: true });

        if (totalPages <= 1) return; // No need for a collector if there's only one page

        const filter = (i) => i.user.id === message.author.id;
        const collector = replyMsg.createMessageComponentCollector({ filter, time: 120000 }); // 2 minute timeout

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'next_page') currentPage++;
            else if (interaction.customId === 'prev_page') currentPage--;
            await interaction.update({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });
        });

        collector.on('end', () => {
            replyMsg.edit({ components: [] }).catch(err => console.error("AFK Paginator: Could not remove buttons.", err));
        });
    }

    // 2. Check if the message mentions anyone who is AFK
    const mentionedUsers = message.mentions.users;
    if (mentionedUsers.size > 0 && !afkData) {
        for (const [id, user] of mentionedUsers) {
            const mentionedAfkData = await AFK.findOne({ guildId: message.guild.id, userId: user.id });
            if (mentionedAfkData) {
                const afkNoticeEmbed = new EmbedBuilder().setColor('#ffc107').setDescription(`**${user.tag}** is currently AFK: ${mentionedAfkData.status} - <t:${Math.floor(mentionedAfkData.since.getTime() / 1000)}:R>`);
                message.reply({ embeds: [afkNoticeEmbed] }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 15000));
                mentionedAfkData.pings.push({ pingerId: message.author.id, pingerTag: message.author.tag, messageURL: message.url, timestamp: new Date(), content: message.content });
                await mentionedAfkData.save();
            }
        }
    }

    // --- Original Prefix Command Logic ---
    if (!message.content.startsWith(process.env.PREFIX)) return;
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


// --- Startup Logic (Unchanged) ---
(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connection established.');
        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error('❌ Bot startup failed:', error);
        process.exit(1);
    }
})();