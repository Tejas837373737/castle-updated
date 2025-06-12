const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    // --- Data for both command types ---
    name: 'list-servers',
    description: 'Lists all servers the bot is in (with owner info) and DMs the list.',
    developerOnly: true,

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('list-servers')
        .setDescription('Lists all servers the bot is in and DMs the list.'),

    // --- Execute Function for Prefix Command ---
    async execute(message, args, client) {
        if (message.author.id !== process.env.DEVELOPER_ID) return;
        
        const workingMsg = await message.reply({ embeds: [new EmbedBuilder().setColor('#f1c40f').setDescription('Fetching server list and owners, please wait...')] });

        try {
            const guilds = client.guilds.cache;

            // --- THE UPGRADE: Asynchronously fetch owner for each guild ---
            const guildListPromises = guilds.map(async (guild) => {
                try {
                    const owner = await guild.fetchOwner();
                    return `- ${guild.name} (ID: ${guild.id}) | Owner: ${owner.user.tag} (${owner.id}) | Members: ${guild.memberCount}`;
                } catch {
                    // Fallback if owner can't be fetched for some reason
                    return `- ${guild.name} (ID: ${guild.id}) | Owner: Not Found | Members: ${guild.memberCount}`;
                }
            });

            // Wait for all owner fetches to complete
            const guildList = await Promise.all(guildListPromises);
            
            const content = `Server List (${guilds.size} total):\n\n${guildList.join('\n')}`;
            const buffer = Buffer.from(content, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: 'server-list.txt' });

            await message.author.send({
                content: 'Here is the list of servers I am currently in:',
                files: [attachment]
            });

            await workingMsg.edit({ embeds: [new EmbedBuilder().setColor('#28a745').setDescription('✅ I have sent the server list to your DMs.')] });

        } catch (error) {
            console.error('list-servers command error:', error);
            if (error.code === 50007) {
                await workingMsg.edit({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('I could not send you a DM. Please ensure your DMs are open.')] });
            } else {
                 await workingMsg.edit({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('An unexpected error occurred.')] });
            }
        }
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        if (interaction.user.id !== process.env.DEVELOPER_ID) {
            return interaction.reply({ content: 'This command is restricted to the bot developer.', ephemeral: true });
        }
        
        await interaction.deferReply({ ephemeral: true });

        try {
            const guilds = interaction.client.guilds.cache;
            
            // --- THE UPGRADE: Asynchronously fetch owner for each guild ---
            const guildListPromises = guilds.map(async (guild) => {
                try {
                    const owner = await guild.fetchOwner();
                    return `- ${guild.name} (ID: ${guild.id}) | Owner: ${owner.user.tag} (${owner.id}) | Members: ${guild.memberCount}`;
                } catch {
                    return `- ${guild.name} (ID: ${guild.id}) | Owner: Not Found | Members: ${guild.memberCount}`;
                }
            });
            const guildList = await Promise.all(guildListPromises);

            const content = `Server List (${guilds.size} total):\n\n${guildList.join('\n')}`;
            const buffer = Buffer.from(content, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: 'server-list.txt' });

            await interaction.user.send({
                content: 'Here is the list of servers I am currently in:',
                files: [attachment]
            });

            await interaction.editReply({ content: '✅ I have sent the server list to your DMs.' });

        } catch (error) {
            console.error('list-servers slash command error:', error);
            if (error.code === 50007) {
                await interaction.editReply({ content: 'I could not send you a DM. Please ensure your DMs are open.' });
            } else {
                await interaction.editReply({ content: 'An unexpected error occurred while generating the server list.' });
            }
        }
    }
};