const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-dossiers')
        .setDescription('Gestion dynamique des dossiers GOWRAX.')
        .addSubcommand(sub => sub
            .setName('afficher')
            .setDescription('Poste le registre dynamique dans un salon')
            .addChannelOption(opt => opt.setName('salon').setDescription('Le salon où poster le registre').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('ajouter')
            .setDescription('Ajouter un dossier (Admin)')
            .addStringOption(o => o.setName('nom').setDescription('Nom du membre').setRequired(true))
            .addStringOption(o => o.setName('details').setDescription('Détails du dossier').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('modifier')
            .setDescription('Modifier un dossier existant (Admin)')
            .addIntegerOption(o => o.setName('id').setDescription('ID du dossier à modifier').setRequired(true))
            .addStringOption(o => o.setName('nom').setDescription('Nouveau nom du membre'))
            .addStringOption(o => o.setName('details').setDescription('Nouveaux détails du dossier')))
        .addSubcommand(sub => sub
            .setName('supprimer')
            .setDescription('Supprimer définitivement un dossier (Admin)')
            .addIntegerOption(o => o.setName('id').setDescription('ID du dossier à supprimer').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('initialiser')
            .setDescription('Force l\'importation des 8 dossiers de base')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        let dossiers = interaction.client.db.get('admin_dossiers') || [];

        const updateDynamicEmbed = async (client) => {
            const config = client.db.get('admin_dossiers_config');
            if (!config) return;
            const channel = await client.channels.fetch(config.channelId).catch(() => null);
            if (!channel) return;
            const message = await channel.messages.fetch(config.messageId).catch(() => null);
            if (!message) return;

            const currentDossiers = client.db.get('admin_dossiers') || [];
            const embed = new EmbedBuilder()
                .setTitle('📋 GOWRAX | REGISTRE DYNAMIQUE DES DOSSIERS')
                .setColor('#6F2DBD')
                .setDescription(currentDossiers.length > 0 
                    ? currentDossiers.map(d => `**Dossier #${d.id}** : ${d.nom}\n└ *${d.details}*`).join('\n\n')
                    : "Aucun dossier enregistré.")
                .setFooter({ text: 'Mise à jour automatique en temps réel' })
                .setTimestamp();

            await message.edit({ embeds: [embed] });
        };

        if (sub === 'afficher') {
            const channel = interaction.options.getChannel('salon');
            const embed = new EmbedBuilder().setTitle('Chargement du registre...').setColor('#6F2DBD');
            const msg = await channel.send({ embeds: [embed] });
            interaction.client.db.set('admin_dossiers_config', { channelId: channel.id, messageId: msg.id });
            await updateDynamicEmbed(interaction.client);
            return interaction.reply({ content: `✅ Registre dynamique installé dans ${channel} !`, ephemeral: true });
        }

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: "Réservé aux fondateurs.", ephemeral: true });
        }

        if (sub === 'initialiser') {
            const base = [
                { id: 1, nom: "SILVADA", details: "Capitaine/Coach - Validé High Roster" },
                { id: 2, nom: "Nene", details: "Joueur - Validé High Roster" },
                { id: 3, nom: "Mr.Gege", details: "Joueur - Validé Pôle Chill" },
                { id: 4, nom: "Grimace-Nrv / Enzo", details: "Multi-gaming - Validé Elite Tryharder/Chill" },
                { id: 5, nom: "pAstek / Nicolas", details: "Joueur Valo - Validé Elite Tryharder" },
                { id: 6, nom: "Pinpin", details: "Joueur Valo - Validé Academy" },
                { id: 7, nom: "Adri / Adrien", details: "EN ATTENTE - Cible : High Roster" },
                { id: 8, nom: "Nati", details: "EN ATTENTE - Cible : High Roster" }
            ];
            interaction.client.db.set('admin_dossiers', base);
            await updateDynamicEmbed(interaction.client);
            return interaction.reply({ content: "🚀 Dossiers de base injectés !", ephemeral: true });
        }

        if (sub === 'ajouter') {
            const nextId = dossiers.length > 0 ? Math.max(...dossiers.map(d => d.id)) + 1 : 1;
            dossiers.push({ id: nextId, nom: interaction.options.getString('nom'), details: interaction.options.getString('details') });
            interaction.client.db.set('admin_dossiers', dossiers);
            await updateDynamicEmbed(interaction.client);
            return interaction.reply({ content: `✅ Dossier #${nextId} créé.`, ephemeral: true });
        }

        if (sub === 'modifier') {
            const id = interaction.options.getInteger('id');
            const idx = dossiers.findIndex(d => d.id === id);
            if (idx === -1) return interaction.reply({ content: "ID Inconnu.", ephemeral: true });
            if (interaction.options.getString('nom')) dossiers[idx].nom = interaction.options.getString('nom');
            if (interaction.options.getString('details')) dossiers[idx].details = interaction.options.getString('details');
            interaction.client.db.set('admin_dossiers', dossiers);
            await updateDynamicEmbed(interaction.client);
            return interaction.reply({ content: `🔄 Dossier #${id} mis à jour.`, ephemeral: true });
        }

        // --- LOGIQUE SUPPRIMER ---
        if (sub === 'supprimer') {
            const id = interaction.options.getInteger('id');
            const initialLength = dossiers.length;
            dossiers = dossiers.filter(d => d.id !== id);

            if (dossiers.length === initialLength) {
                return interaction.reply({ content: `❌ Aucun dossier trouvé avec l'ID #${id}.`, ephemeral: true });
            }

            interaction.client.db.set('admin_dossiers', dossiers);
            await updateDynamicEmbed(interaction.client);
            return interaction.reply({ content: `🗑️ Dossier #${id} supprimé avec succès.`, ephemeral: true });
        }
    }
};