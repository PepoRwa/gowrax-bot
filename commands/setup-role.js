const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-roles')
        .setDescription('Déploie le système de sélection de rôles par catégories.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // --- EMBED 1 : ACTUALITÉS ---
        const embedNews = new EmbedBuilder()
            .setColor('#5865F2') // Bleu flou
            .setTitle('📢 RESTEZ INFORMÉS')
            .setDescription('Abonnez-vous aux actualités majeures de la structure GOWRAX.');

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('role_annonces').setLabel('Annonces').setEmoji('📢').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('role_events').setLabel('Events').setEmoji('🎉').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('role_videos').setLabel('Vidéos').setEmoji('🎬').setStyle(ButtonStyle.Secondary),
        );

        // --- EMBED 2 : ESPORT ---
        const embedEsport = new EmbedBuilder()
            .setColor('#FF0000') // Rouge
            .setTitle('⚔️ SUIVI ESPORT')
            .setDescription('Ne ratez aucun match officiel ni aucun live de nos joueurs.');

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('role_lives').setLabel('Lives').setEmoji('🔴').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('role_matchs').setLabel('Matchs').setEmoji('🏆').setStyle(ButtonStyle.Danger),
        );

        // --- EMBED 3 : GAMING ---
        const embedGaming = new EmbedBuilder()
            .setColor('#57F287') // Vert
            .setTitle('🎮 PINGS GAMING')
            .setDescription('Soyez notifiés pour trouver des mates ou participer à des games communautaires.');

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('role_valorant').setLabel('Valorant').setEmoji('🔫').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('role_rl').setLabel('Rocket League').setEmoji('🏎️').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('role_fortnite').setLabel('Fortnite').setEmoji('🧱').setStyle(ButtonStyle.Success),
        );

        // --- BOUTON DE VÉRIFICATION ---
        const rowCheck = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('check_my_roles').setLabel('Voir mes rôles actifs').setEmoji('👤').setStyle(ButtonStyle.Primary),
        );

        await interaction.reply({ content: '✅ Déploiement du centre d\'accès...', ephemeral: true });
        
        await interaction.channel.send({ embeds: [embedNews], components: [row1] });
        await interaction.channel.send({ embeds: [embedEsport], components: [row2] });
        await interaction.channel.send({ embeds: [embedGaming], components: [row3] });
        await interaction.channel.send({ components: [rowCheck] });
    },
};