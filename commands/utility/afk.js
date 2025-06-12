const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AFK = require('../../models/afk');

module.exports = {
    // --- Data for both command types ---
    name: 'afk',
    description: 'Sets your status to AFK (Away From Keyboard).',
    usage: '[reason]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Sets your status to AFK.')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for being AFK.')),

    // --- Execute Functions (Logic is identical for both) ---
    async execute(message) {
        const reason = message.content.split(' ').slice(1).join(' ') || 'No reason provided';
        await setAFK(message.member, reason, message.reply.bind(message));
    },

    async executeSlash(interaction) {
        const reason = interaction.options.getString('reason') || 'No reason provided';
        await interaction.deferReply({ ephemeral: true });
        await setAFK(interaction.member, reason, interaction.editReply.bind(interaction));
    }
};

// Helper function to avoid code duplication
async function setAFK(member, reason, reply) {
    try {
        const afkData = await AFK.findOne({ guildId: member.guild.id, userId: member.id });
        if (afkData) {
            await reply({ content: 'You are already set as AFK.', ephemeral: true });
            return;
        }

        const newAFK = new AFK({
            guildId: member.guild.id,
            userId: member.id,
            status: reason,
        });
        await newAFK.save();

        const afkEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setDescription(`**${member.displayName}** is now AFK: ${reason}`);
        
        // This reply can be public to announce the AFK status
        await reply({ embeds: [afkEmbed], ephemeral: false });

    } catch (error) {
        console.error('AFK command error:', error);
        await reply({ content: 'An error occurred while setting your AFK status.', ephemeral: true });
    }
}