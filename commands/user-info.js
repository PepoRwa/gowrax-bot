const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user-info')
        .setDescription('Affiche les informations d’un membre.')
        // Optionnel : Cette ligne permet de cacher la commande aux non-admins dans l'interface Discord
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) 
        .addUserOption(option => 
            option.setName('cible')
                .setDescription('Le membre à check (laisse vide pour toi)')
                .setRequired(false)),
    async execute(interaction) {
        // --- CONFIGURATION ---
        const STAFF_ROLE_ID = '1472731688957251748'; // Remplace par l'ID du rôle autorisé
        
        // Sécurité : Vérification du rôle
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
            return await interaction.reply({ 
                content: "❌ Accès refusé : Cette commande est réservée au Staff du serveur.", 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('cible') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);

        const embed = new EmbedBuilder()
            .setColor('#FF00FF') // Magenta Gowrax
            .setTitle(`Profil de ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
                { name: '📅 Rejoint le', value: `<t:${Math.round(member.joinedTimestamp / 1000)}:D>`, inline: true },
                { name: '🎭 Rôles', value: member.roles.cache.map(r => r).join(' ').replace('@everyone', '') || 'Aucun' }
            )
            .setFooter({ text: `GOWRAX Bot • Système de surveillance` })
            .setTimestamp();

        // ephemeral: true rend le message visible uniquement par l'auteur de la commande
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};