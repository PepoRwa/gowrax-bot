const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-support')
        .setDescription('Déploie le panel de recrutement et d\'assistance.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🤝 Centre d\'Assistance & Recrutement GOWRAX')
            .setDescription('Bienvenue dans notre centre de support. Choisissez l\'option qui correspond à votre besoin ci-dessous.')
            .addFields(
                { 
                    name: '🛠️ Assistance / Support', 
                    value: 'Un problème sur le serveur ? Une question ?\nOuvrez un ticket et expliquez votre problème en détail. **Préparez vos captures d\'écran** si nécessaire pour que notre équipe puisse vous aider rapidement.' 
                },
                { 
                    name: '💼 Recrutement (Staff & e-Sport)', 
                    value: 'Nous recrutons actuellement tous types de profils !\n• **Joueurs (Valorant, RL, Fortnite) :** Préparez vos liens Trackers ou captures d\'écran in-game. *Si vous ne savez pas comment trouver votre tracker, pas de panique, dites-le nous dans le ticket on vous aidera !*\n• **Staff :** Préparez une belle présentation de vous et de votre expérience.' 
                }
            )
            .setFooter({ text: 'GOWRAX Support System | Les tickets sont enregistrés.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('support_open_help')
                .setLabel('Demander de l\'Aide')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🛠️'),
            new ButtonBuilder()
                .setCustomId('support_open_recruit')
                .setLabel('Postuler chez GOWRAX')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💼')
        );

        await interaction.reply({ content: '✅ Panel déployé.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    },
};