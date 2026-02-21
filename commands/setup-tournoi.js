const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-tournoi')
        .setDescription('Affiche le panel de contestation de résultats.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('🏆 Litige / Contestation de Résultat')
            .setDescription('Un problème avec votre match ? Un score mal reporté ?\n\nCliquez sur le bouton ci-dessous pour ouvrir un ticket de contestation.\n\n*Préparez vos preuves pour les fournir dès que demandé. (screenshots/clips).*\n*Notre Staff ne demandera JAMAIS vos identifiants ou mots de passe* ')
            .setFooter({ text: 'GOWRAX Tournament System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_contest_ticket')
                .setLabel('Ouvrir un litige')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚖️')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};