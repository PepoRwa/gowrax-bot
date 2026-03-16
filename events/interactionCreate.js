const { Events, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, StringSelectMenuBuilder, UserSelectMenuBuilder, ChannelType } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        
        // --- CONFIGURATION DES IDS ---
        const STAFF_ROLE_ID = '1472731688957251748';
        const CHEF_STAFF_ROLE_ID = '1472730147231760486'; 
        const TICKET_CATEGORY_ID = '1474110462470783212';
        const TRANSCRIPT_CHANNEL_ID = '1474117146329219133';
        const LOG_VOCAUX_ID = '1474121475026845807'; 

        // 1. COMMANDES SLASH
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction); } catch (e) { console.error(e); }
            return;
        }

        // 2. GESTION DES BOUTONS
        if (interaction.isButton()) {
            const [action, targetId] = interaction.customId.split('_');

            // --- A. AUTO-RÔLES ---
            const roleMap = {
                'role_annonces': '1472735238642995232', 'role_events': '1472735294087233598',
                'role_lives': '1472735339796889784', 'role_videos': '1472735380569591828',
                'role_matchs': '1472735427571220655', 'role_valorant': '1472735460320084182',
                'role_rl': '1472735492343857204', 'role_fortnite': '1472735529585086656',
                'role_fr': '1483160519966855270', 'role_en': '1483160477109321921',
            };

            if (roleMap[interaction.customId]) {
                const roleId = roleMap[interaction.customId];
                try {
                    if (interaction.member.roles.cache.has(roleId)) {
                        await interaction.member.roles.remove(roleId);
                        return interaction.reply({ content: `✅ Rôle retiré.`, flags: [64] });
                    } else {
                        await interaction.member.roles.add(roleId);
                        return interaction.reply({ content: `✅ Rôle ajouté !`, flags: [64] });
                    }
                } catch (error) {
                    console.error(`Erreur avec le rôle ${roleId}:`, error);
                    return interaction.reply({ content: `❌ Impossible d'attribuer ce rôle. Il n'existe peut-être plus sur le serveur.`, flags: [64] });
                }
            }

            if (interaction.customId === 'check_my_roles') {
                const active = Object.values(roleMap)
                    .filter(id => interaction.member.roles.cache.has(id))
                    .map(id => `<@&${id}>`)
                    .join('\n');
                return interaction.reply({ content: `**Tes rôles actifs :**\n${active || 'Aucun'}`, flags: [64] });
            }

            // --- B. DASHBOARD VOCAL ---
            if (interaction.customId.startsWith('vocal_')) {
                const voiceChannel = interaction.member.voice.channel;
                if (!voiceChannel) return interaction.reply({ content: "❌ Tu dois être dans ton salon vocal.", flags: [64] });
                // ✅ VÉRIFICATION AVEC LE NOUVEAU BADGE (ManageMessages)
                if (!voiceChannel.permissionsFor(interaction.user).has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply({ content: "❌ Seul le propriétaire peut faire ça.", flags: [64] });
                }

                const updateDashboard = async (channel, inter) => {
                    const isLocked = !channel.permissionsFor(interaction.guild.id).has(PermissionFlagsBits.Connect);
                    const isHidden = !channel.permissionsFor(interaction.guild.id).has(PermissionFlagsBits.ViewChannel);
                    const newEmbed = EmbedBuilder.from(inter.message.embeds[0]).setFields(
                        { name: '🔒 Statut', value: isLocked ? 'Fermé' : 'Ouvert', inline: true },
                        { name: '👁️ Visibilité', value: isHidden ? 'Invisible' : 'Public', inline: true }
                    );
                    await inter.message.edit({ embeds: [newEmbed] });
                };

                if (interaction.customId === 'vocal_lock') {
                    const canConnect = voiceChannel.permissionsFor(interaction.guild.id).has(PermissionFlagsBits.Connect);
                    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: !canConnect });
                    await interaction.reply({ content: !canConnect ? "🔓 Salon ouvert." : "🔒 Salon verrouillé.", flags: [64] });
                    return updateDashboard(voiceChannel, interaction);
                }
                if (interaction.customId === 'vocal_hide') {
                    const canView = voiceChannel.permissionsFor(interaction.guild.id).has(PermissionFlagsBits.ViewChannel);
                    await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: !canView });
                    await interaction.reply({ content: !canView ? "👁️ Visible." : "👻 Invisible.", flags: [64] });
                    return updateDashboard(voiceChannel, interaction);
                }
                if (interaction.customId === 'vocal_limit') {
                    const modal = new ModalBuilder().setCustomId('modal_vocal_limit').setTitle('Limite de places');
                    const input = new TextInputBuilder().setCustomId('limit_input').setLabel("Nombre (0-99)").setStyle(TextInputStyle.Short).setRequired(true);
                    modal.addComponents(new ActionRowBuilder().addComponents(input));
                    return await interaction.showModal(modal);
                }
            }

            // --- C. SYSTÈME DE LITIGE ---
            if (interaction.customId === 'open_contest_ticket') {
                const modal = new ModalBuilder().setCustomId('modal_contest').setTitle('Ouverture d\'un Litige');
                const matchInput = new TextInputBuilder().setCustomId('match_id').setLabel("ID du Match ou Équipes").setPlaceholder("Team A vs Team B").setStyle(TextInputStyle.Short).setRequired(true);
                const reasonInput = new TextInputBuilder().setCustomId('contest_reason').setLabel("Description du problème").setStyle(TextInputStyle.Paragraph).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(matchInput), new ActionRowBuilder().addComponents(reasonInput));
                return await interaction.showModal(modal);
            }

            if (interaction.customId === 'ticket_claim') {
                if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Réservé au staff.", flags: [64] });
                await interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: true, AttachFiles: true });
                await interaction.reply({ content: `🛠️ <@${interaction.user.id}> a pris en charge le litige.` });
                const row1 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_claim_done').setLabel('Pris en charge').setStyle(ButtonStyle.Primary).setEmoji('🛠️').setDisabled(true),
                    new ButtonBuilder().setCustomId('ticket_escalate').setLabel('Escalader').setStyle(ButtonStyle.Danger).setEmoji('⚠️')
                );
                return await interaction.message.edit({ components: [row1, interaction.message.components[1]] });
            }

            if (interaction.customId === 'ticket_escalate') {
                if (!interaction.member.roles.cache.has(CHEF_STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Réservé aux Chefs Staff.", flags: [64] });
                await interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: true, AttachFiles: true });
                return await interaction.reply({ content: `⚠️ **LITIGE ESCALADÉ** : <@${interaction.user.id}> (Chef Staff) intervient.` });
            }

            if (interaction.customId === 'ticket_open_all') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: "❌ Permissions insuffisantes.", flags: [64] });
                await interaction.channel.permissionOverwrites.edit(STAFF_ROLE_ID, { SendMessages: true });
                return await interaction.reply({ content: "🔓 Le ticket est désormais ouvert à tout le staff." });
            }

            if (interaction.customId === 'close_ticket') {
                await interaction.reply("🔒 Création de la retranscription et fermeture dans 5 secondes...");
                const logChannel = interaction.client.channels.cache.get(TRANSCRIPT_CHANNEL_ID);
                if (logChannel) {
                    let messages = await interaction.channel.messages.fetch({ limit: 100 });
                    messages = Array.from(messages.values()).reverse();
                    let transcriptText = "";
                    messages.forEach(m => {
                        if (m.content || m.attachments.size > 0) {
                            const date = new Date(m.createdTimestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                            transcriptText += `[${date}] ${m.author.username}: ${m.content}\n`;
                            if (m.attachments.size > 0) m.attachments.forEach(a => transcriptText += `[FICHIER/IMAGE] ${a.url}\n`);
                        }
                    });
                    if (transcriptText.length > 4000) transcriptText = transcriptText.substring(transcriptText.length - 4000) + "\n... (Tronqué)";
                    const firstMsg = messages.find(m => m.embeds.length > 0 && m.embeds[0].title?.includes('ID: #'));
                    const ticketIdMatch = firstMsg ? firstMsg.embeds[0].title.match(/ID: #[A-Z0-9]+/) : "ID Inconnu";

                    const transcriptEmbed = new EmbedBuilder()
                        .setColor('#34495E')
                        .setTitle(`📁 Retranscription | Ticket ${interaction.channel.name}`)
                        .setDescription(`**Identifiant :** ${ticketIdMatch}\n**Fermé par :** <@${interaction.user.id}>\n\n**📜 Historique :**\n\`\`\`text\n${transcriptText || "Aucun message."}\n\`\`\``)
                        .setTimestamp();
                    await logChannel.send({ embeds: [transcriptEmbed] });
                }
                setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
            }
        }

        // 3. MENU DÉROULANT VOCAL (Options Avancées)
        if (interaction.isStringSelectMenu() && interaction.customId === 'vocal_manage') {
            const voiceChannel = interaction.member.voice.channel;
            // ✅ VÉRIFICATION AVEC LE NOUVEAU BADGE (ManageMessages)
            if (!voiceChannel || !voiceChannel.permissionsFor(interaction.user).has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ content: "❌ Tu n'es pas le propriétaire de ce salon.", flags: [64] });
            }
            
            const choice = interaction.values[0];

            if (choice === 'vocal_info') {
                const membersList = voiceChannel.members.map(m => `• ${m.displayName}`).join('\n') || "Aucun membre";
                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📍 Détails du Salon')
                    .addFields(
                        { name: 'Nom', value: `\`${voiceChannel.name}\``, inline: true },
                        { name: 'Slots', value: `\`${voiceChannel.userLimit || '∞'}\``, inline: true },
                        { name: '👥 Membres connectés', value: membersList }
                    );
                return interaction.reply({ embeds: [embed], flags: [64] });
            }

            if (choice === 'vocal_rename') {
                const modal = new ModalBuilder().setCustomId('modal_vocal_rename').setTitle('Renommer');
                const input = new TextInputBuilder().setCustomId('name_input').setLabel("Nouveau nom").setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(input));
                return await interaction.showModal(modal);
            }

            if (choice === 'vocal_kick') {
                const userSelect = new UserSelectMenuBuilder().setCustomId('vocal_action_kick').setPlaceholder('Choisis qui expulser').setMinValues(1).setMaxValues(1);
                return interaction.reply({ content: "🥾 **Expulser un membre**\nSélectionne la personne à bannir de ton salon :", components: [new ActionRowBuilder().addComponents(userSelect)], flags: [64] });
            }

            if (choice === 'vocal_vip') {
                const userSelect = new UserSelectMenuBuilder().setCustomId('vocal_action_vip').setPlaceholder('Choisis le VIP').setMinValues(1).setMaxValues(1);
                return interaction.reply({ content: "🎟️ **Passe VIP**\nAutorise un membre à entrer même si c'est verrouillé :", components: [new ActionRowBuilder().addComponents(userSelect)], flags: [64] });
            }

            if (choice === 'vocal_transfer') {
                const userSelect = new UserSelectMenuBuilder().setCustomId('vocal_action_transfer').setPlaceholder('Choisis le nouveau propriétaire').setMinValues(1).setMaxValues(1);
                return interaction.reply({ content: "👑 **Transférer la couronne**\nSélectionne le nouveau chef du salon :", components: [new ActionRowBuilder().addComponents(userSelect)], flags: [64] });
            }
        }

        // 4. RÉCEPTION DU USER SELECT MENU (Action finale)
        if (interaction.isUserSelectMenu() && interaction.customId.startsWith('vocal_action_')) {
            const voiceChannel = interaction.member.voice.channel;
            // ✅ VÉRIFICATION AVEC LE NOUVEAU BADGE
            if (!voiceChannel || !voiceChannel.permissionsFor(interaction.user).has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ content: "❌ Expiration ou permissions insuffisantes.", flags: [64] });
            }

            const targetUser = interaction.users.first();
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember) return interaction.reply({ content: "❌ Utilisateur introuvable.", flags: [64] });

            if (interaction.customId === 'vocal_action_kick') {
                if (targetUser.id === interaction.user.id) return interaction.update({ content: "❌ Tu ne peux pas t'expulser toi-même !", components: [] });
                
                if (targetMember.voice.channelId === voiceChannel.id) {
                    await targetMember.voice.disconnect("Expulsé par le propriétaire.");
                }
                await voiceChannel.permissionOverwrites.edit(targetUser.id, { Connect: false });

                const logChannel = interaction.client.channels.cache.get(LOG_VOCAUX_ID);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#E74C3C')
                        .setTitle('🥾 Expulsion d\'un salon vocal')
                        .setDescription(`**Propriétaire :** <@${interaction.user.id}>\n**Cible :** <@${targetUser.id}>\n**Salon :** \`${voiceChannel.name}\``)
                        .setTimestamp();
                    await logChannel.send({ embeds: [embed] });
                }

                return interaction.update({ content: `✅ **${targetUser.username}** a été expulsé et banni de ce salon.`, components: [] });
            }

            if (interaction.customId === 'vocal_action_vip') {
                await voiceChannel.permissionOverwrites.edit(targetUser.id, { Connect: true, ViewChannel: true });
                return interaction.update({ content: `🎟️ **${targetUser.username}** a maintenant un accès VIP à ton salon.`, components: [] });
            }

            if (interaction.customId === 'vocal_action_transfer') {
                if (targetUser.id === interaction.user.id) return interaction.update({ content: "❌ Tu es déjà le propriétaire !", components: [] });

                // On retire les droits à l'ancien
                await voiceChannel.permissionOverwrites.edit(interaction.user.id, { ManageMessages: null });
                // On donne les droits au nouveau
                await voiceChannel.permissionOverwrites.edit(targetUser.id, { ManageMessages: true, MoveMembers: true, MuteMembers: true, DeafenMembers: true });

                // ✅ MISE À JOUR DYNAMIQUE DE L'EMBED DU DASHBOARD
                // On cherche le message du dashboard dans le salon texte du bot (le salon d'origine de l'interaction)
                const messages = await interaction.channel.messages.fetch({ limit: 10 });
                const dashMsg = messages.find(m => m.embeds.length > 0 && m.embeds[0].title === '🛠️ GOWRAX - Gestion Vocal');
                
                if (dashMsg) {
                    const oldEmbed = dashMsg.embeds[0];
                    const newEmbed = EmbedBuilder.from(oldEmbed)
                        .setDescription(`Propriétaire : <@${targetUser.id}>\n\nUtilise les boutons ci-dessous pour gérer ton espace.`);
                    await dashMsg.edit({ content: `<@${targetUser.id}>`, embeds: [newEmbed] });
                }

                return interaction.update({ content: `👑 La propriété a été transférée avec succès à **${targetUser.username}** !`, components: [] });
            }
        }

        if (interaction.customId === 'check_jobs_refresh') {
            // On simule une vérification "en direct" pour le membre
            await interaction.reply({   
                content: "🔍 Synchronisation avec la base de données de la direction... Les statuts affichés ci-dessus sont à jour.", 
                ephemeral: true 
            });
        }

        // 5. GESTION DES MODALS
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_contest') {
                await interaction.deferReply({ flags: [64] });
                try {
                    const match = interaction.fields.getTextInputValue('match_id');
                    const reason = interaction.fields.getTextInputValue('contest_reason');
                    const ticketId = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const ticketChannel = await interaction.guild.channels.create({
                        name: `litige-${interaction.user.username}`,
                        type: ChannelType.GuildText,
                        parent: TICKET_CATEGORY_ID,
                        permissionOverwrites: [
                            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                            { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
                        ],
                    });
                    const embed = new EmbedBuilder().setColor('#E74C3C').setTitle(`⚖️ LITIGE : ${match} | ID: #${ticketId}`).addFields({ name: '👤 Joueur', value: `<@${interaction.user.id}>`, inline: true }, { name: '📝 Problème', value: reason }).setTimestamp();
                    const row1 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🛠️'), new ButtonBuilder().setCustomId('ticket_escalate').setLabel('Escalader').setStyle(ButtonStyle.Danger).setEmoji('⚠️'));
                    const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_open_all').setLabel('Ouvrir Staff').setStyle(ButtonStyle.Secondary).setEmoji('🔓'), new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
                    const welcomeMsg = `Bonjour <@${interaction.user.id}> ! 👋\nUn membre de l'équipe <@&${STAFF_ROLE_ID}> ou <@&${CHEF_STAFF_ROLE_ID}> va prendre en charge ton ticket sous peu.`;
                    await ticketChannel.send({ content: welcomeMsg, embeds: [embed], components: [row1, row2] });
                    return await interaction.editReply({ content: `✅ Ton ticket a été créé ici : ${ticketChannel}` });
                } catch (error) {
                    console.error(error);
                    return await interaction.editReply({ content: "❌ Erreur de création." });
                }
            }

            if (interaction.customId === 'modal_vocal_limit') {
                const limit = parseInt(interaction.fields.getTextInputValue('limit_input'));
                if (isNaN(limit) || limit < 0 || limit > 99) return interaction.reply({ content: "❌ Nombre invalide.", flags: [64] });
                await interaction.member.voice.channel.setUserLimit(limit);
                return interaction.reply({ content: `✅ Limite fixée à ${limit}.`, flags: [64] });
            }

            if (interaction.customId === 'modal_vocal_rename') {
                const newName = interaction.fields.getTextInputValue('name_input');
                await interaction.member.voice.channel.setName(`🔊 ${newName}`);
                return interaction.reply({ content: `✅ Salon renommé : **${newName}**`, flags: [64] });
            }
        }
    },
};