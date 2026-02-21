const { Events, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // --- CONFIGURATION ---
        // Liste des catégories à surveiller (Litiges, Support, Recrutement)
        const TICKET_CATEGORIES = ['1474110462470783212']; 
        const STAFF_ROLE_ID = '1472731688957251748';

        // 1. On ignore les messages des bots (sauf le nôtre pour l'initialisation) et les messages hors catégories tickets
        if (message.author.bot && message.author.id !== message.client.user.id) return;
        if (!message.channel.parentId || !TICKET_CATEGORIES.includes(message.channel.parentId)) return;

        let status = "";

        // 2. Déterminer l'état selon l'auteur
        if (message.author.id === message.client.user.id) {
            // Si c'est le bot qui parle (message de bienvenue)
            status = "⚪ ÉTAT : OUVERT (En attente du staff)";
        } else if (message.member.roles.cache.has(STAFF_ROLE_ID)) {
            // Si c'est un membre du staff qui répond
            status = `🟢 ÉTAT : RÉPONDU (par ${message.author.username})`;
        } else {
            // Si c'est l'utilisateur (le créateur du ticket) qui parle
            status = "🔴 ÉTAT : EN ATTENTE DE RÉPONSE";
        }

        // 3. Mise à jour du Topic du salon (on évite de spammer l'API si le statut est déjà le même)
        if (message.channel.topic !== status) {
            try {
                await message.channel.setTopic(status);
            } catch (error) {
                console.error("Erreur mise à jour Topic Ticket:", error);
            }
        }
    },
};