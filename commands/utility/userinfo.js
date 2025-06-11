const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const GuildConfig = require('../../models/guildConfig');

module.exports = {
    name: 'userinfo',
    description: 'Displays detailed information about a user by mention or ID.',
    aliases: ['whois', 'ui'],
    usage: '[@user|userID]',
    async execute(message, args) {
        let targetMember;

        // --- THE FIX: Robust Target Resolver ---
        try {
            // 1. Check for a mentioned user
            if (message.mentions.members.first()) {
                targetMember = message.mentions.members.first();
            } 
            // 2. If no mention, check if an ID was provided in arguments
            else if (args[0]) {
                targetMember = await message.guild.members.fetch(args[0]);
            } 
            // 3. If no mention or ID, default to the command author
            else {
                targetMember = message.member;
            }
        } catch (error) {
            console.error('Error fetching member for userinfo command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#dc3545')
                .setTitle('User Not Found')
                .setDescription('Could not find that user in this server. Please provide a valid mention or User ID.');
            return message.reply({ embeds: [errorEmbed] });
        }
        
        // Now that we have the member, get the full user object
        const targetUser = await targetMember.user.fetch({ force: true });
        const guildConfig = await GuildConfig.findOne({ guildId: message.guild.id });

        // --- Top Position Acknowledgement ---
        let acknowledgement = '';
        if (targetUser.id === message.guild.ownerId) {
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
            acknowledgement = '`<:member:1382321501663006741> Member`';
        }

        // --- Roles ---
        const userRoles = targetMember.roles.cache.sort((a, b) => b.position - a.position).map(role => role.toString()).slice(0, -1);
        let rolesToDisplay = userRoles.join(', ');
        if (userRoles.length === 0) {
            rolesToDisplay = '`None`';
        } else if (rolesToDisplay.length > 1024) {
            rolesToDisplay = `${rolesToDisplay.substring(0, 1010)}... and more`;
        }
        
        // --- Notable Permissions ---
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
                { name: '<:member:1382321501663006741> User', value: `${targetMember} (\`${targetUser.id}\`)`, inline: true },
                { name: '<:aromaxcode:1381560953744785408> Nickname', value: `\`${targetMember.nickname || 'None'}\``, inline: true },
                { name: '<:user:1382323085000315082> Acknowledgement', value: acknowledgement, inline: true },
                { name: '<:0information:1382323298763014175> Account Created', value: `<t:${parseInt(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '<:MekoJoin:1382323474470539285> Joined Server', value: `<t:${parseInt(targetMember.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '<a:_DownArrow:1382323886582136935> Highest Role', value: `${targetMember.roles.highest}`, inline: true},
                { name: `<a:_DownArrow:1382323886582136935> Roles [${userRoles.length}]`, value: rolesToDisplay, inline: false },
                { name: '<:member:1382324110880800768> Notable Permissions', value: notableServerPerms || '`None`', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};