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
                            let attachmentLinks = '';
                            if (message.attachments.size > 0) {
                                attachmentLinks = message.attachments.map(a => `[Lien de la pièce jointe](${a.url})`).join('\n');
                            }

                            const sendTimestamp = Math.floor(new Date(info.date).getTime() / 1000);

                            const dmEmbed = new EmbedBuilder()
                                .setColor('#57F287')
                                .setTitle(`✅ Réponse d'Inactivité | #${info.numero}`)
                                .setAuthor({ name: `${message.author.username} a répondu`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                                .setDescription(`**Membres :** <@${message.author.id}> (\`${message.author.id}\`)\n**Initié par :** <@${info.staffId}>\n**Date d'envoi :** <t:${sendTimestamp}:R>`)
                                .addFields(
                                    { name: '💬 Message de réponse', value: message.content ? `>>> ${message.content}` : '*Aucun texte fourni.*', inline: false }
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Gowrax Tracking', iconURL: message.client.user.displayAvatarURL() });

                            if (attachmentLinks) {
                                dmEmbed.addFields({ name: '📎 Pièces jointes', value: attachmentLinks, inline: false });
                            }

                            logChannel.send({ embeds: [dmEmbed] });
                        }
                    } catch (e) { console.error('Erreur log Dm', e); }

                    // On passe le statut "replied = true" pour éviter le spam de confirmation
                    if (!info.replied) {
                        info.replied = true;
                        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

                        const replyEmbed = new EmbedBuilder()
                            .setColor('#57F287')
                            .setDescription('✅ **Message transmis.**\nTon retour a bien été envoyé à notre équipe. Si tu as d\'autres remarques, tu peux continuer à écrire ici.');
                        
                        message.reply({ embeds: [replyEmbed] }).catch(() => {});
                    } else {
                        // S'il renvoie encore des messages, un simple emoji pour valider la réception par le bot
                        message.react('✅').catch(() => {});
                    }
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