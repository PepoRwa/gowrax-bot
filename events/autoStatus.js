const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const STATUS_CHANNEL_ID = '1474203660568363176';
        console.log(`✅ ${client.user.tag} est prêt et déployé sur l'infrastructure YorkHost !`);
        
        const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('📡 GOWRAX - État des Services')
            // Utilisation du Violet Gowrax pour la cohérence graphique
            .setColor('#6F2DBD') 
            .setDescription('L’infrastructure de l’empire est actuellement **opérationnelle**. Tous les systèmes sont synchronisés avec le serveur principal.')
            .addFields(
                { name: '🤖 Bot Status', value: '🟢 En ligne (H24)', inline: true },
                { name: '🛠️ Infrastructure', value: 'Production', inline: true },
                { name: '⚡ Latence API', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '📋 État des Modules', value: 
                    `🟢 **Architecture** : Stable\n` +
                    `🟢 **Personnel & Bios** : Actif\n` +
                    `🟢 **Système de Tickets** : Prêt\n` +
                    `🟢 **Base de données** : Connectée\n` +
                    `🔴 **Auto-Modération** : Indisponible` 
                }
            )
            .setTimestamp()
            .setFooter({ text: 'GOWRAX Network — Pilier Technique' });

        const messages = await channel.messages.fetch({ limit: 10 });
        const lastStatus = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title === '📡 GOWRAX - État des Services');

        if (lastStatus) {
            await lastStatus.edit({ embeds: [embed] });
        } else {
            await channel.send({ embeds: [embed] });
        }
    },
};