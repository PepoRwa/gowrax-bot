const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');

// ⚙️ ================== CONFIGURATION FACILE ================== ⚙️
const LOG_CHANNEL_ID = '1473341218225131615'; // Remplace par l'ID de ton salon Logs Admins
const ADMIN_ROLE_ID = '1472395939150037165'; // Remplace par l'ID du rôle à pinger (ex: @Fondateur)
const DEFAULT_COLOR = '#720cffff'; // Couleur Gowrax par défaut (Rouge/Corail)
// ==============================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gowrax_dm')
        .setDescription('Envoie un message officiel avec un fichier et un système d\'appel.')
        .addUserOption(option => 
            option.setName('joueur')
            .setDescription('Le membre qui va recevoir le message')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('titre')
            .setDescription('Titre de l\'Embed (Ex: Sanction, Convocation...)')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
            .setDescription('Le contenu du message officiel')
            .setRequired(true))
        .addBooleanOption(option =>
            option.setName('activer_appel')
            .setDescription('Ajouter un bouton pour contester / répondre ?')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('auteur')
            .setDescription('Nom affiché en Auteur (Laisse vide pour mettre ton pseudo)')
            .setRequired(false))
        .addStringOption(option =>
            option.setName('couleur')
            .setDescription('Couleur de la bordure en HEX (Mets # et 6 lettres/chiffres)')
            .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('fichier')
            .setDescription('Ajoute un PDF ou une image en pièce jointe')
            .setRequired(false)),

    async execute(interaction) {
        // 1. Récupération des données tapées par l'admin
        const targetUser = interaction.options.getUser('joueur');
        const title = interaction.options.getString('titre');
        const content = interaction.options.getString('message');
        const allowAppeal = interaction.options.getBoolean('activer_appel');
        const customAuthor = interaction.options.getString('auteur') || interaction.user.username;
        const customColor = interaction.options.getString('couleur') || DEFAULT_COLOR;
        const attachment = interaction.options.getAttachment('fichier');

        // On vérifie qu'on n'envoie pas à un bot
        if (targetUser.bot) return interaction.reply({ content: "❌ Impossible d'envoyer un DM à un bot.", ephemeral: true });

        // 2. Création de l'Embed "Officiel Gowrax"
        const embedDM = new EmbedBuilder()
            .setAuthor({ name: `Gowrax e-Sport | Envoyé par : ${customAuthor}`, iconURL: interaction.guild.iconURL() })
            .setTitle(`🚨 ${title}`)
            .setDescription(content)
            .setColor(customColor)
            .setFooter({ text: 'Ceci est un message officiel du Staff Gowrax.' })
            .setTimestamp();

        // 3. Préparation du Bouton d'Appel (Optionnel)
        const componentsArray = [];
        if (allowAppeal) {
            const appealButton = new ButtonBuilder()
                .setCustomId('start_appeal')
                .setLabel('Contester / Demander un Appel')
                .setEmoji('⚖️')
                .setStyle(ButtonStyle.Secondary); // Gris neutre

            const row = new ActionRowBuilder().addComponents(appealButton);
            componentsArray.push(row);
        }

        // Configuration du payload final (Fichiers etc)
        const dmPayload = { embeds: [embedDM], components: componentsArray };
        if (attachment) {
            dmPayload.files = [attachment.url];
        }

        // 4. Envoi du Message
        await interaction.deferReply({ ephemeral: true }); // Fait patienter (au cas où le DM met du temps)
        
        let dmMessage;
        try {
            dmMessage = await targetUser.send(dmPayload);
            await interaction.editReply({ content: `✅ Le message officiel a bien été envoyé en DM à <@${targetUser.id}>.` });
        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: `❌ Échec: **${targetUser.username}** a désactivé ses MPs ou m'a bloqué.` });
        }

        // Si pas de bouton d'appel, on a fini ici.
        if (!allowAppeal) return;

        // ==============================================================
        // 🚨 5. GESTION DE LA RÉPONSE (INTERACTION CLIC SUR BOUTON)
        // ==============================================================
        
        // On écoute UNIQUEMENT le bouton qu'on vient d'envoyer
        const buttonCollector = dmMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 86400000 }); // Valide 24h

        buttonCollector.on('collect', async i => {
            if (i.customId === 'start_appeal') {
                // On prévient l'utilisateur et on désactive le bouton
                await i.update({ 
                    components: [new ActionRowBuilder().addComponents(
                        ButtonBuilder.from(i.component).setDisabled(true).setLabel('Appel en cours...')
                    )] 
                });

                // --- DÉBUT DE L'INTERROGATOIRE ---
                const dmChannel = await targetUser.createDM();
                
                await dmChannel.send("**⚖️ Procédure d'appel initiée.**\n*Étape 1/2 :* Explique précisément et calmement pourquoi cette décision/sanction est injustifiée, dans un seul message. Le plus c'est précis le mieux ce sera");
                
                // Collecteur de messages (pour attendre qu'il tape)
                const msgFilter = m => m.author.id === targetUser.id;
                
                // Question 1
                const q1Collector = await dmChannel.awaitMessages({ filter: msgFilter, max: 1, time: 600000, errors: ['time'] }).catch(() => null);
                if (!q1Collector) return dmChannel.send("⏳ Délai expiré (10 minutes). Appel annulé.");
                const answer1 = q1Collector.first().content;

                // Question 2
                await dmChannel.send("*Étape 2/2 :* As-tu des preuves (liens, citations) ou des éléments supplémentaires ? Sinon, note simplement 'Non'.");
                
                const q2Collector = await dmChannel.awaitMessages({ filter: msgFilter, max: 1, time: 600000, errors: ['time'] }).catch(() => null);
                if (!q2Collector) return dmChannel.send("⏳ Délai expiré. Appel annulé, on garde uniquement l'étape 1.");
                const answer2 = q2Collector.first().content;

                // --- FIN DE L'INTERROGATOIRE ---
                await dmChannel.send("✅ **C'est noté. Ton dossier vient d'être transmis à la direction.**\n(Inutile de renvoyer des messages ici, ils ne seront pas lus).");

                // ==============================================================
                // 📝 6. ENVOI DU RAPPORT AUX ADMINS DANS LE SERVEUR
                // ==============================================================

                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const appealEmbed = new EmbedBuilder()
                        .setTitle(`⚠️ NOUVEL APPEL DE SANCTION : ${targetUser.username}`)
                        .setColor('#FFA500') // Orange / Warning
                        .addFields(
                            { name: '👤 Utilisateur', value: `<@${targetUser.id}>`, inline: true },
                            { name: '📄 Dossier initié par', value: `${interaction.user.username}`, inline: true },
                            { name: '🚨 Motif initial de la sanction', value: title },
                            { name: '💬 Argument 1 (Explication)', value: `> ${answer1}` },
                            { name: '🛡️ Argument 2 (Preuves)', value: `> ${answer2}` }
                        )
                        .setTimestamp();

                    await logChannel.send({ 
                        content: `<@&${ADMIN_ROLE_ID}>`, // PING DE ROLE ICI
                        embeds: [appealEmbed] 
                    });
                }
            }
        });
    },
};