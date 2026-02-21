const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff-statut')
        .setDescription('Gère la visibilité du support GOWRAX.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt => opt.setName('type').setDescription('Où envoyer le message ?').setRequired(true).addChoices(
            {name: '📢 Annonce Publique', value: 'public'},
            {name: '🎫 Dans ce Ticket', value: 'ticket'}
        ))
        .addStringOption(opt => opt.setName('etat').setDescription('État du support').setRequired(true).addChoices(
            {name: '🌙 Fermeture Nocturne', value: 'ferme'},
            {name: '✅ Ouvert / Retour', value: 'ouvert'}
        )),

    async execute(interaction) {
        const type = interaction.options.getString('type');
        const etat = interaction.options.getString('etat');
        
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: 'GOWRAX E-Sport • Support & Recrutement' });

        // --- LOGIQUE FERMETURE ---
        if (etat === 'ferme') {
            if (type === 'public') {
                embed
                    .setTitle('🌙 NOTE D\'INFORMATION : SUPPORT EN PAUSE')
                    .setColor('#D62F7F') // Neon Magenta (Alerte)
                    .setDescription(
                        "L'équipe GOWRAX marque une pause nocturne.\n\n" +
                        "⚠️ **À savoir :**\n" +
                        "• Les tickets ne seront pas traités avant **10h00**.\n" +
                        "• Le support reste ouvert, mais avec un délai de réponse augmenté.\n\n" +
                        "Merci de votre patience, la meute récupère ! 🚀"
                    );
            } else {
                embed
                    .setTitle('🌙 TICKET EN ATTENTE (NUIT)')
                    .setColor('#1A1C2E') // Void Blue (Discret pour le ticket)
                    .setDescription(
                        "Bonjour ! Le staff est actuellement hors ligne pour la nuit.\n\n" +
                        "Ton ticket est bien pris en compte, mais il ne sera pas traité avant **10h00** du matin.\n\n" +
                        "*N'hésite pas à laisser tes infos, on te répond dès notre retour !*"
                    );
            }
            
            await interaction.reply({ content: `✅ Statut fermé envoyé en mode **${type}**.`, ephemeral: true });
            return interaction.channel.send({ embeds: [embed] });
        }

        // --- LOGIQUE OUVERTURE ---
        if (etat === 'ouvert') {
            embed
                .setTitle('✅ LE STAFF EST OPÉRATIONNEL')
                .setColor('#6F2DBD') // Purple Gowrax
                .setDescription(type === 'public' 
                    ? "Le support est de nouveau ouvert. Nos équipes sont prêtes à vous répondre !" 
                    : "Le staff est de retour ! On s'occupe de ton ticket dans quelques instants.");
            
            await interaction.reply({ content: `✅ Statut ouvert envoyé en mode **${type}**.`, ephemeral: true });
            return interaction.channel.send({ embeds: [embed] });
        }
    }
};