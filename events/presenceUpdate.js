const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: Events.PresenceUpdate,
    async execute(oldPresence, newPresence) {
        if (!newPresence || !newPresence.activities || !newPresence.guild) return;

        const ROLE_SOUHAITE_ID = '1472732151425405141'; 
        const CHANNEL_ALERTE_ID = '1473308632564236411';
        const ROLE_NOTIF_ID = '1472735339796889784';

        const member = newPresence.member;
        if (!member || !member.roles.cache.has(ROLE_SOUHAITE_ID)) return;

        const stream = newPresence.activities.find(act => act.type === 1);
        const wasStreaming = oldPresence?.activities.find(act => act.type === 1);

        if (stream && !wasStreaming) {
            const channel = newPresence.guild.channels.cache.get(CHANNEL_ALERTE_ID);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setColor('#6F2DBD')
                .setTitle(`🔴 LIVE : ${newPresence.user.username} lance son stream !`)
                .setURL(stream.url)
                .setDescription(`**Titre :** ${stream.details || 'Pas de titre'}\n**Jeu :** ${stream.state || 'Jeu non défini'}`)
                .setThumbnail(newPresence.user.displayAvatarURL())
                .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.url.split('/').pop()}-1920x1080.jpg`)
                .setFooter({ text: 'GOWRAX Live System' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('Aller voir le live').setURL(stream.url).setStyle(ButtonStyle.Link)
            );

            await channel.send({ 
                content: `🔔 Hello <@&${ROLE_NOTIF_ID}>, un membre de la team est en live !`, 
                embeds: [embed],
                components: [row]
            });
        }
    },
};