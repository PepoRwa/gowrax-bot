const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const STATUS_CHANNEL_ID = '1474203660568363176';
        console.log(`✅ ${client.user.tag} est prêt et déployé sur l'infrastructure YorkHost !`);
        
        // --- FONCTION DE MISE À JOUR DU STATUT ---
        const updateStatus = async () => {
            const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
            if (!channel) return;

            const ping = client.ws.ping;
            // Choix de la couleur en fonction du ping (si tout va mal, ça passe en rouge !)
            let pingColor = '#6F2DBD'; // Violet par défaut
            if (ping === -1) {
                 pingColor = '#F1C40F'; // API en chargement (jaune)
            } else if (ping > 500) {
                 pingColor = '#E74C3C'; // Ping catastrophique (rouge)
            }

            const embed = new EmbedBuilder()
                .setTitle('📡 GOWRAX - État des Services')
                .setColor(pingColor) 
                .setDescription('L’infrastructure de l’empire est actuellement **opérationnelle**. Tous les systèmes sont synchronisés avec le serveur principal.')
                .addFields(
                    { name: '🤖 Bot Status', value: '🟢 En ligne (H24)', inline: true },
                    { name: '🛠️ Infrastructure', value: 'Production', inline: true },
                    { name: '⚡ Latence API', value: ping === -1 ? `\`Calcul...\`` : `\`${ping}ms\``, inline: true },
                    { name: '📋 État des Modules', value: 
                        `🟢 **Architecture** : Stable\n` +
                        `🟢 **Personnel & Bios** : Actif\n` +
                        `🟢 **Système de Tickets** : Prêt\n` +
                        `🟢 **Base de données** : Connectée\n` +
                        `🔴 **Auto-Modération** : Indisponible` 
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'GOWRAX Network — Actualisation dynamique' });

            const messages = await channel.messages.fetch({ limit: 10 });
            const lastStatus = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title === '📡 GOWRAX - État des Services');

            if (lastStatus) {
                await lastStatus.edit({ embeds: [embed] }).catch(() => {});
            } else {
                await channel.send({ embeds: [embed] }).catch(() => {});
            }
        };

        // On l'exécute DIRECTEMENT au démarrage
        await updateStatus();

        // PUIS on lance la boucle d'actualisation toutes les 2 minutes
        setInterval(updateStatus, 120000); // 120 000 ms = Toutes les 2 minutes
    },
};