const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

// This helper function builds the embed to avoid duplicating code.
async function buildUserInfoEmbed(targetMember, requestingUser) {
    const targetUser = await targetMember.user.fetch({ force: true });
    const guildConfig = await GuildConfig.findOne({ guildId: targetMember.guild.id });

    // --- Acknowledgements Logic ---
    let acknowledgement = '';
    if (targetUser.id === targetMember.guild.ownerId) {
        acknowledgement = ' Server Owner';
    } else if (targetMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
        acknowledgement = ' Administrator';
    } else if (guildConfig && guildConfig.managerRoleId && targetMember.roles.cache.has(guildConfig.managerRoleId)) {
        acknowledgement = ' Manager';
    } else if (guildConfig && guildConfig.modRole && targetMember.roles.cache.has(guildConfig.modRole)) {
        acknowledgement = ' Moderator';
    } else if (targetMember.premiumSince) {
        acknowledgement = ' Server Booster';
    } else if (targetUser.bot) {
        acknowledgement = ' Bot';
    } else {
        acknowledgement = '` Member`';
    }

    // --- Roles Logic ---
    const userRoles = targetMember.roles.cache.sort((a, b) => b.position - a.position).map(role => role.toString()).slice(0, -1);
    let rolesToDisplay = userRoles.join(', ');
    if (userRoles.length === 0) {
        rolesToDisplay = '`None`';
    } else if (rolesToDisplay.length > 1024) {
        rolesToDisplay = `${rolesToDisplay.substring(0, 1010)}... and more`;
    }
    
    // --- Permissions Logic ---
    const importantServerPerms = [
        { flag: 'Administrator', name: ' Admin' }, { flag: 'ManageGuild', name: ' Manage Server' },
        { flag: 'ManageRoles', name: ' Manage Roles' }, { flag: 'ManageChannels', name: ' Manage Channels' },
        { flag: 'BanMembers', name: ' Ban Members' }, { flag: 'KickMembers', name: ' Kick Members' },
        { flag: 'ModerateMembers', name: ' Timeout' }
    ];
    const notableServerPerms = importantServerPerms
        .filter(perm => targetMember.permissions.has(PermissionsBitField.Flags[perm.flag]))
        .map(perm => perm.name).join(', ');

    // --- Embed Creation ---
    const embed = new EmbedBuilder()
        .setColor(targetMember.displayHexColor === '#000000' ? '#0099ff' : targetMember.displayHexColor)
        .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .setImage(targetUser.bannerURL({ dynamic: true, size: 512 }))
        .addFields(
            { name: '<:user:1382323085000315082> User', value: `${targetMember} (\`${targetUser.id}\`)`, inline: true },
            { name: '<:nickname:1382723234767831130> Nickname', value: `\`${targetMember.nickname || 'None'}\``, inline: true },
            { name: '<:utilities:1382723355073052692> Acknowledgement', value: acknowledgement, inline: true },
            { name: '<:calendar01:1383027832233660497> Account Created', value: `<t:${parseInt(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '<:joineduser:1383034264039456884> Joined Server', value: `<t:${parseInt(targetMember.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: '<:highrole:1383034722107658271> Highest Role', value: `${targetMember.roles.highest}`, inline: true},
            { name: `<:settings:1382325149235286030> Roles [${userRoles.length}]`, value: rolesToDisplay, inline: false },
            { name: '<:commands:1382948394473095250> Notable Permissions', value: notableServerPerms || '`None`', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `Requested by ${requestingUser.username}`, iconURL: requestingUser.displayAvatarURL({ dynamic: true }) });
    
    return embed;
}

module.exports = {
    // --- Data for Prefix Command ---
    name: 'userinfo',
    description: 'Displays detailed information about a user by mention or ID.',
    aliases: ['whois', 'ui'],
    usage: '[@user|userID]',

    // --- Data for Slash Command ---
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Displays detailed information about a server member.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get info about. Defaults to you.')),

    // --- Execute Function for Prefix Command ---
    async execute(message, args, client) {
        let targetMember;
        try {
            if (message.mentions.members.first()) {
                targetMember = message.mentions.members.first();
            } else if (args[0]) {
                targetMember = await message.guild.members.fetch(args[0]);
            } else {
                targetMember = message.member;
            }
        } catch (error) {
            const errorEmbed = new EmbedBuilder().setColor('#dc3545').setTitle('User Not Found').setDescription('Could not find that user in this server. Please provide a valid mention or User ID.');
            return message.reply({ embeds: [errorEmbed] });
        }
        
        const embed = await buildUserInfoEmbed(targetMember, message.author);
        await message.channel.send({ embeds: [embed] });
    },

    // --- Execute Function for Slash Command ---
    async executeSlash(interaction) {
        const targetMember = interaction.options.getMember('user') || interaction.member;
        
        await interaction.deferReply();
        const embed = await buildUserInfoEmbed(targetMember, interaction.user);
        await interaction.editReply({ embeds: [embed] });
    }
};
