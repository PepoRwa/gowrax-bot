const { ActivityType } = require('discord.js');

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} est prêt et organisé !`);
        
        // Configuration de base
        client.user.setActivity('GOWRAX Network', { type: ActivityType.Watching });
        client.user.setStatus('dnd');

        // --- CHECK DU STATUT AUTO AU DÉMARRAGE ---
        const heure = new Date().getHours();
        const estLaNuit = (heure >= 1 && heure < 9);
        
        console.log(`[Auto-Check] Il est ${heure}h. Mode détecté : ${estLaNuit ? 'NUIT 🌙' : 'OUVERT ✅'}`);

        // On récupère la commande pour utiliser sa fonction de génération d'embed
        const command = client.commands.get('staff-statut');
        const config = client.db.get('status_config');

        if (command && config) {
            try {
                const channel = await client.channels.fetch(config.channelId);
                const message = await channel.messages.fetch(config.messageId);
                
                // On génère l'embed selon si c'est la nuit ou pas (!estLaNuit car la fonction veut "estOuvert")
                const embed = command.genererEmbed(!estLaNuit);
                
                await message.edit({ embeds: [embed] });
                console.log(`[Auto-Check] Embed de statut mis à jour.`);
            } catch (err) {
                console.error("[Auto-Check] Impossible de mettre à jour l'embed au démarrage :", err.message);
            }
        }
    },
};