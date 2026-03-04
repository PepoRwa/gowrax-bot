const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // --- CONFIGURATION ---
        const TICKET_CATEGORIES = ['1474110462470783212']; 
        const STAFF_ROLE_ID = '1472731688957251748';

        // 1. Filtres de base
        if (message.author.bot) return; // On ignore TOUS les bots ici pour éviter les boucles
        if (!message.channel.parentId || !TICKET_CATEGORIES.includes(message.channel.parentId)) return;
        
        // 2. SÉCURITÉ : Discord ne permet pas de changer le topic d'un THREAD
        // Si ton ticket est un fil de discussion, on s'arrête là.
        if (message.channel.isThread()) return;

        let status = "";

        // 3. Déterminer l'état selon l'auteur
        if (message.member && message.member.roles.cache.has(STAFF_ROLE_ID)) {
            status = `🟢 ÉTAT : RÉPONDU (par ${message.author.username})`;
        } else {
            status = "🔴 ÉTAT : EN ATTENTE DE RÉPONSE";
        }

        // 4. Mise à jour du Topic avec sécurité
        if (message.channel.topic !== status) {
            try {
                // On vérifie une dernière fois si le salon est accessible
                await message.channel.edit({ 
                    topic: status,
                    reason: 'Mise à jour automatique du statut du ticket'
                });
            } catch (error) {
                // Si le salon a disparu ou si on n'a pas les perm, on ne spam plus la console
                if (error.code === 10003) return; 
                console.error("Erreur mise à jour Topic Ticket:", error.message);
            }
        }
    },
};