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

        // --- EMBED 4 : LANGUE ---
        const embedLanguage = new EmbedBuilder()
            .setColor('#60098e') // Violet
            .setTitle('🌍 CHOIX DE LA LANGUE / LANGUAGE CHOICE')
            .setDescription('Choisissez votre langue principale pour être notifié correctement.\nChoose your main language to be notified correctly.');

        const row4 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('role_fr').setLabel('Français').setEmoji('🇫🇷').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('role_en').setLabel('English').setEmoji('🇬🇧').setStyle(ButtonStyle.Primary),
        );

        // --- BOUTON DE VÉRIFICATION ---
        const rowCheck = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('check_my_roles').setLabel('Voir mes rôles actifs').setEmoji('👤').setStyle(ButtonStyle.Secondary),
        );

        await interaction.reply({ content: '✅ Déploiement du centre d\'accès...', ephemeral: true });
        
        await interaction.channel.send({ embeds: [embedLanguage], components: [row4] });
        await interaction.channel.send({ embeds: [embedNews], components: [row1] });
        await interaction.channel.send({ embeds: [embedEsport], components: [row2] });
        await interaction.channel.send({ components: [rowCheck] });
    },
};