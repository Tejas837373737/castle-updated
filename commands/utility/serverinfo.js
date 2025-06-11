const { EmbedBuilder, ChannelType, GuildVerificationLevel, GuildExplicitContentFilter, GuildMFALevel } = require('discord.js');

module.exports = {
    name: 'serverinfo',
    description: 'Displays detailed information about the current server.',
    aliases: ['server', 'si'],
    async execute(message) {
        const { guild } = message;

        // --- Data Fetching & Formatting ---

        const owner = await guild.fetchOwner();
        
        // Channel counts
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
        
        // Member counts
        const totalMembers = guild.memberCount;
        const humanMembers = guild.members.cache.filter(member => !member.user.bot).size;
        const botMembers = guild.members.cache.filter(member => member.user.bot).size;

        // Server Features
        const features = guild.features.map(feature => `\`${feature.replace(/_/g, ' ')}\``).join(', ') || 'None';

        // Mappings for human-readable levels
        const verificationLevels = { [GuildVerificationLevel.None]: 'None', [GuildVerificationLevel.Low]: 'Low', [GuildVerificationLevel.Medium]: 'Medium', [GuildVerificationLevel.High]: 'High', [GuildVerificationLevel.VeryHigh]: 'Very High' };
        const explicitContentFilterLevels = { [GuildExplicitContentFilter.Disabled]: 'Disabled', [GuildExplicitContentFilter.MembersWithoutRoles]: 'No Role', [GuildExplicitContentFilter.AllMembers]: 'All Members' };
        const mfaLevels = { [GuildMFALevel.None]: 'Off', [GuildMFALevel.Elevated]: 'On' };
        const boostTiers = { 0: 'None', 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

        // --- Embed Creation ---

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .setImage(guild.bannerURL({ size: 512 })) // <-- NEW: Adds the server banner image
            .addFields(
                // --- General Info ---
                { name: '<a:vj_crown:1382334161704189952> Owner', value: owner.user.tag, inline: true },
                { name: '<:0information:1382323298763014175> Server ID', value: `\`${guild.id}\``, inline: true },
                { name: '📅 Created', value: `<t:${parseInt(guild.createdTimestamp / 1000)}:D> (<t:${parseInt(guild.createdTimestamp / 1000)}:R>)` }, // <-- NEW: Relative time

                // --- Counts ---
                { name: `💬 Channels (${textChannels + voiceChannels})`, value: `**${textChannels}** Text | **${voiceChannels}** Voice | **${categories}** Categories`, inline: false },
                { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: '🙂 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                
                // --- Boost Status ---
                { name: '✨ Boost Status', value: `**${boostTiers[guild.premiumTier]}** with **${guild.premiumSubscriptionCount || '0'}** boosts`, inline: true },

                // --- Security & System ---
                { name: '🔒 Security', value: `**Verification:** ${verificationLevels[guild.verificationLevel]}\n**Content Filter:** ${explicitContentFilterLevels[guild.explicitContentFilter]}\n**Moderator 2FA:** ${mfaLevels[guild.mfaLevel]}` },
                { name: '😴 AFK Channel', value: guild.afkChannel ? `**Channel:** ${guild.afkChannel.name}\n**Timeout:** ${guild.afkTimeout / 60} mins` : 'None' },

                // --- Server Features (NEW) ---
                { name: '🌟 Features', value: features || '`None`' }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};