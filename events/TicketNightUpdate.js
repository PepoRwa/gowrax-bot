const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // 1. Config des heures de nuit
        const heure = new Date().getHours();
        const estLaNuit = (heure >= 1 && heure < 10);

        // 2. Filtres de sécurité
        if (!estLaNuit || message.author.bot) return;

        // ID de la catégorie des tickets
        const CATEGORIE_TICKETS = '1474110462470783212';

        // On vérifie si le salon appartient à la catégorie ou si c'est un thread lié à cette catégorie
        const estDansLaCategorie = message.channel.parentId === CATEGORIE_TICKETS || 
                                   (message.channel.isThread() && message.channel.parent?.parentId === CATEGORIE_TICKETS);

        if (!estDansLaCategorie) return;

        try {
            // 3. Récupération des 15 derniers messages pour éviter le spam
            const messages = await message.channel.messages.fetch({ limit: 15 });
            
            // On check si le bot a déjà envoyé l'avertissement
            const dejaPrevenu = messages.some(m => 
                m.author.id === message.client.user.id && 
                m.embeds[0]?.title?.includes('RÈGLEMENT DE NUIT')
            );

            // 4. Envoi de l'embed de nuit
            if (!dejaPrevenu) {
                const embedNuit = new EmbedBuilder()
                    .setTitle('🌙 TICKET EN ATTENTE (RÈGLEMENT DE NUIT)')
                    .setColor('#1A1C2E')
                    .setDescription(
                        "Bonjour ! Tu écris pendant les heures de repos du staff (01h-10h).\n\n" +
                        "🚫 **RÈGLES DU STAFF :**\n" +
                        "• **Priorité Diminuée** : Relancer ton ticket inutilement fera passer ta demande après les autres.\n" +
                        "• **Sanction Pings** : Mentionner des membres du staff (même en ligne) est formellement interdit.\n\n" +
                        "*Le repos de l'équipe est sacré. Ton ticket sera traité par ordre d'arrivée dès 10h00.*"
                    )
                    .setTimestamp()
                    .setFooter({ text: 'GOWRAX E-Sport • Protection du Staff' });

                await message.channel.send({ embeds: [embedNuit] });
            }
        } catch (error) {
            console.error("Erreur dans TicketNightUpdate :", error);
        }
    }
};