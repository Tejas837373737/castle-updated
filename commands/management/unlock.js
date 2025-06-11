const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
    name: 'unlock',
    description: 'Unlocks the current channel, allowing @everyone to send messages.',
    // Usage no longer has a reason
    usage: '',

    // 'args' parameter is removed as it's no longer needed
    async execute(message) {
        // --- Permission Check (Identical to lock command) ---
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!guildConfig || !guildConfig.managerRoleId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Error').setDescription('The Manager Role has not been set up for this server.')] });
        }
        if (!message.member.roles.cache.has(guildConfig.managerRoleId)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('<a:wrong:1381568998847545428> Permission Denied').setDescription('You do not have the required Manager Role to use this command.')] });
        }

        try {
            // --- Action: Reset Send Messages permission for @everyone to default ---
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: null, // Using null resets the permission to the default state
            });

            // --- Confirmation Message (Reason field removed) ---
            const successEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle('Channel Unlocked <a:Green_Tick:1381583016073363508>')
                .setDescription(`This channel has been unlocked by ${message.author}.`);
            await message.channel.send({ embeds: [successEmbed] });

            // --- Logging (Reason field removed) ---
            await sendModLog(
                message.client,
                message.guild,
                'Channel Unlocked 🔓',
                '#28a745', // Green
                [
                    { name: 'Channel', value: `${message.channel}` },
                    { name: 'Manager', value: `${message.author.tag} (${message.author.id})` }
                ]
            );

        } catch (error) {
            console.error(error);
            message.reply({ embeds: [new EmbedBuilder().setColor('#dc3545').setTitle('Error').setDescription('I was unable to unlock this channel. Please check my permissions.')] });
        }
    },
};