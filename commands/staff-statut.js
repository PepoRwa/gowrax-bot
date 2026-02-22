const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff-statut')
        .setDescription('Gestion du statut du support GOWRAX')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('panel')
            .setDescription('Envoie l\'embed fixe de statut'))
        .addSubcommand(sub => sub
            .setName('force')
            .setDescription('Force un état pour une urgence')
            .addStringOption(opt => opt.setName('etat').setDescription('État à forcer').setRequired(true).addChoices(
                {name: '🌙 Mode Nuit', value: 'ferme'},
                {name: '✅ Mode Ouvert', value: 'ouvert'}
            ))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const client = interaction.client;

        if (subcommand === 'panel') {
            const heure = new Date().getHours();
            const estOuvert = !(heure >= 1 && heure < 10);
            const embed = this.genererEmbed(estOuvert);
            
            const message = await interaction.channel.send({ embeds: [embed] });

            // CRUCIAL : Sauvegarde pour le ready.js et le cron
            client.db.set('status_config', {
                channelId: interaction.channel.id,
                messageId: message.id
            });

            return interaction.reply({ content: "✅ Panel déployé et sauvegardé !", ephemeral: true });
        }

        if (subcommand === 'force') {
            const etat = interaction.options.getString('etat');
            const estOuvert = (etat === 'ouvert');
            const embed = this.genererEmbed(estOuvert);
            
            const config = client.db.get('status_config');
            if (config) {
                try {
                    const channel = await client.channels.fetch(config.channelId);
                    const msg = await channel.messages.fetch(config.messageId);
                    await msg.edit({ embeds: [embed] });
                } catch (e) { console.error("Panel fixe introuvable."); }
            }

            return interaction.reply({ content: `⚠️ Support forcé en mode **${etat}**.`, ephemeral: true });
        }
    },

    genererEmbed(estOuvert) {
        return new EmbedBuilder()
            .setTitle(estOuvert ? '✅ LE STAFF EST OPÉRATIONNEL' : '🌙 NOTE D\'INFORMATION : SUPPORT EN PAUSE')
            .setColor(estOuvert ? '#6F2DBD' : '#D62F7F')
            .setTimestamp()
            .setFooter({ text: 'GOWRAX E-Sport • Système de Statut Automatique' })
            .setDescription(estOuvert 
                ? "Le support est actuellement **OUVERT**. Nos équipes sont prêtes à vous répondre !" 
                : "L'équipe GOWRAX marque une pause nocturne.\n\n⚠️ **RÈGLEMENT DE NUIT :**\n• Les tickets ne seront pas traités avant **10h00**.\n• **Relancer le ticket** inutilement entraînera une **baisse de priorité**.\n• **Mentionner (ping) le staff** est **strictement sanctionné**.\n\nMerci de respecter le repos de l'équipe. On revient vite ! 🚀");
    }
};