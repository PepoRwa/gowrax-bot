const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('départ')
        .setDescription('Gérer le départ ou le maintien d’un membre dans l’effectif')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => 
            option.setName('membre').setDescription('Le membre concerné').setRequired(true))
        .addStringOption(option =>
            option.setName('statut')
                .setDescription('Décision concernant le membre')
                .setRequired(true)
                .addChoices(
                    { name: 'Départ (Inactivité/Rework)', value: 'depart' },
                    { name: 'Maintien dans l’équipe', value: 'maintien' }
                ))
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('Information complémentaire à ajouter au message')
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('membre');
        const statut = interaction.options.getString('statut');
        const raison = interaction.options.getString('raison') || "Aucune précision supplémentaire.";
        const logChannelId = "TON_ID_SALON_LOGS"; // À remplacer par ton ID de salon logs

        // --- Configuration des messages diplomatiques ---
        const messages = {
            depart: {
                title: "ℹ️ Information relative à votre statut - GOWRAX",
                desc: `Bonjour ${target.username},\n\nDans le cadre du rework actuel de nos effectifs et suite à l'audit d'activité, nous t'informons que nous mettons fin à notre collaboration au sein de l'équipe eSport.\n\n**Note :** ${raison}\n\nNous te remercions pour le temps passé chez GOWRAX et te souhaitons une bonne continuation.`,
                color: 0xD62F7F // Neon Magenta
            },
            maintien: {
                title: "✅ Confirmation de maintien - GOWRAX",
                desc: `Félicitations ${target.username} !\n\nSuite au rework de l'effectif, nous avons le plaisir de te confirmer ton maintien au sein de la structure GOWRAX. Ton profil correspond aux attentes des staffs.\n\n**Note :** ${raison}\n\nOn continue de charbonner ensemble ! 🚀`,
                color: 0x6F2DBD // Gowrax Purple
            }
        };

        const config = messages[statut];

        // --- Tentative d'envoi du DM ---
        let dmSuccess = true;
        try {
            const embedDM = new EmbedBuilder()
                .setTitle(config.title)
                .setDescription(config.desc)
                .setColor(config.color)
                .setFooter({ text: "Système Automatisé GOWRAX" })
                .setTimestamp();

            await target.send({ embeds: [embedDM] });
        } catch (error) {
            dmSuccess = false;
        }

        // --- Création du Log ---
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        const logEmbed = new EmbedBuilder()
            .setTitle(dmSuccess ? "📑 Log : Opération Effectif" : "⚠️ Erreur : DM Impossible")
            .setColor(dmSuccess ? 0x6F2DBD : 0xff0000)
            .addFields(
                { name: "Cible", value: `${target.tag} (${target.id})`, inline: true },
                { name: "Initiateur", value: `${interaction.user.tag}`, inline: true },
                { name: "Décision", value: statut === 'depart' ? "❌ Départ" : "✅ Maintien", inline: true },
                { name: "DM Envoyé ?", value: dmSuccess ? "Oui" : "Non (Messages privés fermés)", inline: false },
                { name: "Détails", value: raison }
            )
            .setTimestamp();

        if (logChannel) await logChannel.send({ embeds: [logEmbed] });

        // --- Réponse à l'admin ---
        return interaction.reply({ 
            content: dmSuccess 
                ? `Opération réussie pour **${target.username}**.` 
                : `L'opération a été logguée, mais le DM n'a pas pu être envoyé à **${target.username}** (MP fermés).`, 
            ephemeral: true 
        });
    },
};