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
                                attachmentLinks = message.attachments.map(a => `[Lien de la pièce jointe](${a.url})`).join(' | ');
                            }

                            const textContent = message.content || '*Pièce jointe/Image transférée*';
                            const newEntry = `**[${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}]** ${textContent}${attachmentLinks ? `\n> 📎 ${attachmentLinks}` : ''}`;

                            if (info.logMessageId) {
                                // Le log existe déjà, on le met à jour pour éviter le spam d'embeds !
                                try {
                                    const existingLog = await logChannel.messages.fetch(info.logMessageId);
                                    if (existingLog) {
                                        const oldEmbed = EmbedBuilder.from(existingLog.embeds[0]);
                                        let currentDesc = oldEmbed.data.description;
                                        
                                        // On ajoute la nouvelle ligne à la description de l'embed
                                        let newDesc = currentDesc + `\n\n${newEntry}`;
                                        
                                        // Sécurité : Discord limite la description à 4096 caractères
                                        if (newDesc.length > 4050) newDesc = newDesc.substring(newDesc.length - 4050); 
                                        
                                        oldEmbed.setDescription(newDesc);
                                        await existingLog.edit({ embeds: [oldEmbed] });
                                    }
                                } catch (e) {
                                    console.error('Impossible de mettre à jour le log (peut-être supprimé)', e);
                                    // S'il est introuvable, on réinitialise l'ID pour en renvoyer un nouveau au prochain msg
                                    delete info.logMessageId; 
                                }
                            } 
                            
                            // Si c'est le 1er message ou qu'on doit en recréer un nouveau
                            if (!info.logMessageId) {
                                const sendTimestamp = Math.floor(new Date(info.date).getTime() / 1000);
                                const dmEmbed = new EmbedBuilder()
                                    .setColor('#57F287')
                                    .setTitle(`✅ Réponse d'Inactivité | #${info.numero}`)
                                    .setAuthor({ name: `${message.author.username} a répondu`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                                    .setDescription(`**Membre :** <@${message.author.id}> (\`${message.author.id}\`)\n**Initié par :** <@${info.staffId}>\n**Envoyé le :** <t:${sendTimestamp}:f>\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n**💬 Historique des réponses :**\n\n${newEntry}`)
                                    .setTimestamp()
                                    .setFooter({ text: 'Gowrax Tracking', iconURL: message.client.user.displayAvatarURL() });

                                const sentMsg = await logChannel.send({ embeds: [dmEmbed] });
                                info.logMessageId = sentMsg.id; // On sauvegarde l'ID pour mettre à jour ce message précis ensuite !
                            }
                        }
                    } catch (e) { console.error('Erreur log Dm', e); }

                    // On sauvegarde le logMessageId généré
                    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

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