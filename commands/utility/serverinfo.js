const { SlashCommandBuilder, EmbedBuilder, ChannelType, GuildVerificationLevel, GuildExplicitContentFilter, GuildMFALevel } = require('discord.js');


async function buildServerInfoEmbed(guild, requestingUser) {
   
    const owner = await guild.fetchOwner();
    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
    
   

    const banCount = await guild.bans.fetch().then(bans => bans.size).catch(() => 0);
    const features = guild.features.map(feature => `\`${feature.replace(/_/g, ' ')}\``).join(', ') || 'None';
    const verificationLevels = { [GuildVerificationLevel.None]: 'None', [GuildVerificationLevel.Low]: 'Low', [GuildVerificationLevel.Medium]: 'Medium', [GuildVerificationLevel.High]: 'High', [GuildVerificationLevel.VeryHigh]: 'Very High' };
    const explicitContentFilterLevels = { [GuildExplicitContentFilter.Disabled]: 'Disabled', [GuildExplicitContentFilter.MembersWithoutRoles]: 'No Role', [GuildExplicitContentFilter.AllMembers]: 'All Members' };
    const mfaLevels = { [GuildMFALevel.None]: 'Off', [GuildMFALevel.Elevated]: 'On' };
    const boostTiers = { 0: 'None', 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
        .setImage(guild.bannerURL({ size: 512 }))
        .addFields(
            { name: '<:owner:1382722862900580423> Owner', value: owner.user.tag, inline: true },
            { name: '<:user_id:1382723795680366703> Server ID', value: `\`${guild.id}\``, inline: true },
            { name: '<:calendar01:1383027832233660497> Created', value: `<t:${parseInt(guild.createdTimestamp / 1000)}:R>` },
            
            
            
            { name: `<:channels01:1383028429091508236> Channels (${textChannels + voiceChannels})`, value: `**${textChannels}** Text | **${voiceChannels}** Voice | **${categories}** Categories`, inline: false },
            { name: '<:connected:1382721986513338471> Roles', value: `${guild.roles.cache.size}`, inline: true },
            { name: '<:connecting:1382722037436649583> Emojis', value: `${guild.emojis.cache.size}`, inline: true },
            { name: '<:disconnect:1382722103295606804> Stickers', value: `${guild.stickers.cache.size}`, inline: true },
            { name: '<a:Moderation:1381564322278281246> Ban Count', value: `**${banCount}**`, inline: true },
            { name: '<:boost_2:1383026674869866586> Boost Status', value: `**${boostTiers[guild.premiumTier]}** with **${guild.premiumSubscriptionCount || '0'}** boosts`, inline: false },
            { name: '<:commands:1382948394473095250> Security', value: `**Verification:** ${verificationLevels[guild.verificationLevel]}\n**Content Filter:** ${explicitContentFilterLevels[guild.explicitContentFilter]}\n**Moderator 2FA:** ${mfaLevels[guild.mfaLevel]}` },
            { name: '<:utilities:1382723355073052692> Features', value: features || '`None`' }
        )
        .setTimestamp()
        .setFooter({ text: `Requested by ${requestingUser.username}`, iconURL: requestingUser.displayAvatarURL({ dynamic: true }) });

    return embed;
}


module.exports = {
    name: 'serverinfo',
    description: 'Displays detailed information about the current server.',
    aliases: ['server', 'si'],
    data: new SlashCommandBuilder().setName('serverinfo').setDescription('Displays detailed information about the current server.'),
    
   
    async execute(message) {
        const embed = await buildServerInfoEmbed(message.guild, message.author);
        await message.channel.send({ embeds: [embed] });
    },
    async executeSlash(interaction) {
        await interaction.deferReply();
        const embed = await buildServerInfoEmbed(interaction.guild, interaction.user);
        await interaction.editReply({ embeds: [embed] });
    }
};
