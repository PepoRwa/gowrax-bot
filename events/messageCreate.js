const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        // VÉRIFIER SI C'EST UN MESSAGE PRIVÉ (DM)
        if (message.channel.type === 1 || !message.guild) { // ChannelType.DM = 1
            const fs = require('fs');
            const path = require('path');
            const DB_FILE = path.join(__dirname, '..', 'inactifs.json');

            if (fs.existsSync(DB_FILE)) {
                let db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
                if (db[message.author.id]) {
                    const info = db[message.author.id];
                    console.log(`[DM Inactif] Réponse reçue de ${message.author.tag} (Suivi: #${info.numero}) : ${message.content}`);

                    // Optionnel : Envoyer un log dans un channel de l'équipe (remplace 'ID_DU_CHANNEL' par un vrai ID)
                    const logChannelID = '1473341218225131615'; // À changer si tu veux
                    try {
                        const logChannel = message.client.channels.cache.get(logChannelID);
                        if (logChannel) {
                            const dmEmbed = new EmbedBuilder()
                                .setColor('#b521ff')
                                .setTitle(`📩 Réponse d'Inactivité | #${info.numero}`)
                                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                                .addFields(
                                    { name: 'De', value: `<@${message.author.id}> \`(${message.author.id})\``, inline: false },
                                    { name: 'Message', value: message.content || '*Aucun texte (probablement une image/pièce jointe)*', inline: false }
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Système de suivi d\'activité Gowrax' });

                            logChannel.send({ embeds: [dmEmbed] });
                        }
                    } catch (e) { console.error('Erreur log Dm', e); }

                    // Option : retirer l'utilisateur si la tâche est terminée
                    // delete db[message.author.id]; 
                    // fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

                    message.reply('✅ Ton message a bien été pris en compte par l\'équipe. Merci de ton retour !').catch(() => {});
                }
            }
            return;
        }

        // 📊 TRACKING : Compteur de messages
        try {
            // S'assure que client.mysql est bien défini (ton pool de connexion)
            if (message.client.mysql) {
                const query = `
                    INSERT INTO user_stats (user_id, messages_count, vocal_time_ms) 
                    VALUES (?, 1, 0) 
                    ON DUPLICATE KEY UPDATE messages_count = messages_count + 1
                `;
                await message.client.mysql.execute(query, [message.author.id]);
            }
        } catch (error) {
            console.error("Erreur tracking message :", error.message);
        }
    },
};