const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-recrutement')
        .setDescription('Gère l’affichage des recrutements GOWRAX.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('initialiser')
            .setDescription('Poste l’embed des recrutements dans ce salon'))
        .addSubcommand(sub => sub
            .setName('modifier')
            .setDescription('Change le statut d’un pôle')
            .addStringOption(opt => opt.setName('pole').setDescription('Le pôle à modifier').setRequired(true).addChoices(
                { name: '🎮 Joueur Valorant', value: 'Joueur Valorant' },
                { name: '🏎️ Joueur RL', value: 'Joueur RL' },
                { name: '🧱 Fortnite', value: 'Fortnite' },
                { name: '🧠 Coach Valorant', value: 'Coach Valorant' },
                { name: '📊 Analyste Valorant', value: 'Analyste Valorant' },
                { name: '📋 Coachs Assistants', value: 'Coachs Assistants' },
                { name: '🎨 Graphiste', value: 'Graphiste' },
                { name: '🛠️ Staff Technique', value: 'Staff Technique' },
                { name: '🛡️ Modération (Serveur)', value: 'Modération' }
            ))
            .addStringOption(opt => opt.setName('etat').setDescription('L’état du recrutement').setRequired(true).addChoices(
                { name: '🟢 Ouvert', value: '🟢 Ouvert' },
                { name: '🟠 Urgent', value: '🟠 Urgent' },
                { name: '🔴 Fermé', value: '🔴 Fermé' },
                { name: '⌛ Sous condition', value: '⌛ Sous condition' }
            ))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const client = interaction.client;

        // Fonction pour régénérer l'Embed à partir des champs existants
        const updateEmbed = async (message, targetPole, newEtat) => {
            const oldEmbed = message.embeds[0];
            let fields = oldEmbed.fields.map(f => {
                if (f.name === targetPole) return { name: f.name, value: `**${newEtat}**`, inline: true };
                return f;
            });

            const newEmbed = EmbedBuilder.from(oldEmbed).setFields(fields).setTimestamp();
            await message.edit({ embeds: [newEmbed] });
        };

        if (sub === 'initialiser') {
            const embed = new EmbedBuilder()
                .setTitle('💼 GOWRAX | DISPONIBILITÉ DES POSTES')
                .setColor('#6F2DBD')
                .setDescription("Consultez ci-dessous l'état actuel de nos campagnes de recrutement. Si un poste vous intéresse, ouvrez un ticket via le bouton dédié.")
                .addFields(
                    { name: 'Joueur Valorant', value: '**🔴 Fermé**', inline: true },
                    { name: 'Joueur RL', value: '**🔴 Fermé**', inline: true },
                    { name: 'Fortnite', value: '**🔴 Fermé**', inline: true },
                    { name: 'Coach Valorant', value: '**🔴 Fermé**', inline: true },
                    { name: 'Analyste Valorant', value: '**🔴 Fermé**', inline: true },
                    { name: 'Coachs Assistants', value: '**🔴 Fermé**', inline: true },
                    { name: 'Graphiste', value: '**🔴 Fermé**', inline: true },
                    { name: 'Staff Technique', value: '**🔴 Fermé**', inline: true },
                    { name: 'Modération', value: '**🔴 Fermé**', inline: true }
                )
                .setFooter({ text: 'Mise à jour en temps réel par la Direction' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('check_jobs_refresh')
                    .setLabel('Vérifier les postes')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Secondary)
            );

            const msg = await interaction.channel.send({ embeds: [embed], components: [row] });
            
            // On sauvegarde l'emplacement du message dans tickets.json pour que le bot le retrouve
            client.db.set('recrutement_config', { channelId: interaction.channel.id, messageId: msg.id });

            return interaction.reply({ content: "✅ Panel de recrutement initialisé.", ephemeral: true });
        }

        if (sub === 'modifier') {
            const config = client.db.get('recrutement_config');
            if (!config) return interaction.reply({ content: "❌ Panel non initialisé. Utilisez `/admin-recrutement initialiser` d'abord.", ephemeral: true });

            const pole = interaction.options.getString('pole');
            const etat = interaction.options.getString('etat');

            try {
                const channel = await client.channels.fetch(config.channelId);
                const message = await channel.messages.fetch(config.messageId);
                
                await updateEmbed(message, pole, etat);
                return interaction.reply({ content: `✅ Statut mis à jour : **${pole}** est désormais **${etat}**.`, ephemeral: true });
            } catch (e) {
                return interaction.reply({ content: "❌ Impossible de trouver le message d'origine. A-t-il été supprimé ?", ephemeral: true });
            }
        }
    }
};