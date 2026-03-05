const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('statistiques')
        .setDescription('Affiche l\'activité d\'un agent sur le réseau.')
        .addUserOption(option => 
            option.setName('cible')
                .setDescription('Le membre à analyser (laisse vide pour toi)')
                .setRequired(false)),

    async execute(interaction) {
        // On fait patienter Discord car la requête DB peut prendre quelques millisecondes
        await interaction.deferReply(); 

        const user = interaction.options.getUser('cible') || interaction.user;

        try {
            // Vérification de sécurité au cas où la DB serait déconnectée
            if (!interaction.client.mysql) {
                return interaction.editReply({ content: "❌ Erreur de liaison avec la base de données centrale." });
            }

            // 1. Interrogation de la base de données MariaDB
            const [rows] = await interaction.client.mysql.execute(
                'SELECT messages_count, vocal_time_ms FROM user_stats WHERE user_id = ?',
                [user.id]
            );

            // 2. Initialisation des variables (si le joueur n'a encore rien fait, on met à 0)
            let messages = 0;
            let vocalMs = 0;

            if (rows.length > 0) {
                messages = rows[0].messages_count;
                vocalMs = rows[0].vocal_time_ms;
            }

            // 3. Conversion du temps (Millisecondes -> Heures & Minutes)
            const totalMinutes = Math.floor(vocalMs / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            // 4. Construction de l'Embed
            const embedStats = new EmbedBuilder()
                .setColor('#6F2DBD') // Gowrax Purple
                .setTitle(`📊 DOSSIER_AGENT // ${user.username.toUpperCase()}`)
                .setDescription(`Analyse de l'activité réseau de <@${user.id}>.`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { 
                        name: '💬 TRANSMISSIONS', 
                        // L'utilisation des 3 backticks simule la police Tech Mono sur Discord
                        value: `\`\`\`\n${messages} messages envoyés\n\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🎙️ TEMPS DE LIAISON', 
                        value: `\`\`\`\n${hours}h ${minutes}m en vocal\n\`\`\``, 
                        inline: true 
                    }
                )
                .setFooter({ text: 'GOWRAX INTERNAL DATABASE • ACTIVITY TRACKER' })
                .setTimestamp();

            // 5. Envoi final
            await interaction.editReply({ embeds: [embedStats] });

        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques :", error);
            await interaction.editReply({ content: "❌ Une erreur technique est survenue lors de l'extraction des données." });
        }
    },
};