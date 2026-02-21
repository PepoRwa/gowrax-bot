const { Events, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        
        // 🛑 Ce fichier ne gère QUE ce qui commence par "support_"
        if (!interaction.customId || !interaction.customId.startsWith('support_')) return;

        // --- CONFIGURATION ---
        const SUPPORT_CATEGORY_ID = '1474110462470783212'; // <--- Vérifie bien que c'est l'ID de la bonne catégorie
        const LOG_TRANSCRIPT_ID = '1474117146329219133'; 

        // Rôles Assistance
        const ASSISTANCE_ROLES = ['1472731056603136061', '1472730147231760486']; // Modo, Chef Staff
        
        // Rôles Recrutement
        const RECRUTEMENT_ROLES = ['1472395939150037165', '1472730147231760486', '1472731808121487540', '1474139472164556981']; // Fonda, Chef, TM, Recruteur

        // --- 1. OUVERTURE DES MODALS ---
        if (interaction.isButton()) {
            if (interaction.customId === 'support_open_help') {
                const modal = new ModalBuilder().setCustomId('support_modal_help').setTitle('Demande d\'Assistance');
                const subject = new TextInputBuilder().setCustomId('subject').setLabel("Sujet de la demande").setStyle(TextInputStyle.Short).setRequired(true);
                const description = new TextInputBuilder().setCustomId('description').setLabel("Expliquez votre problème en détail").setStyle(TextInputStyle.Paragraph).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(subject), new ActionRowBuilder().addComponents(description));
                return await interaction.showModal(modal);
            }

            if (interaction.customId === 'support_open_recruit') {
                const modal = new ModalBuilder().setCustomId('support_modal_recruit').setTitle('Candidature GOWRAX');
                
                const role = new TextInputBuilder().setCustomId('role').setLabel("Poste visé (ex: Joueur RL, Staff)").setStyle(TextInputStyle.Short).setRequired(true);
                const age = new TextInputBuilder().setCustomId('age').setLabel("Votre âge").setStyle(TextInputStyle.Short).setRequired(true);
                const tracker = new TextInputBuilder().setCustomId('tracker').setLabel("Lien Tracker (ou 'Je ne sais pas')").setPlaceholder("Lien de ton tracker ou Pseudo In-Game").setStyle(TextInputStyle.Short).setRequired(true);
                const motivations = new TextInputBuilder().setCustomId('motivations').setLabel("Présentation & Motivations").setPlaceholder("Parle-nous de toi, de ton expérience...").setStyle(TextInputStyle.Paragraph).setRequired(true);
                
                modal.addComponents(
                    new ActionRowBuilder().addComponents(role), 
                    new ActionRowBuilder().addComponents(age),
                    new ActionRowBuilder().addComponents(tracker),
                    new ActionRowBuilder().addComponents(motivations)
                );
                return await interaction.showModal(modal);
            }
            
            // --- GESTION DU TICKET (Boutons intérieurs) ---
            if (interaction.customId === 'support_claim') {
                const isRecruitChannel = interaction.channel.name.startsWith('recrutement-');
                const allowedRoles = isRecruitChannel ? RECRUTEMENT_ROLES : ASSISTANCE_ROLES;
                
                const hasPerm = allowedRoles.some(roleId => interaction.member.roles.cache.has(roleId));
                if (!hasPerm) return interaction.reply({ content: "❌ Tu n'as pas l'autorisation de gérer ce type de ticket.", flags: [64] });
                
                await interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: true });
                await interaction.reply({ content: `🛠️ <@${interaction.user.id}> a pris en charge ce ticket.` });
                
                const newRow = ActionRowBuilder.from(interaction.message.components[0]);
                newRow.components[0].setDisabled(true).setLabel('Pris en charge');
                return await interaction.message.edit({ components: [newRow] });
            }

            if (interaction.customId === 'support_close') {
                await interaction.reply("🔒 Création de la retranscription et fermeture dans 5 secondes...");
                
                const logChannel = interaction.client.channels.cache.get(LOG_TRANSCRIPT_ID);
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

                    const transcriptEmbed = new EmbedBuilder()
                        .setColor('#2ECC71')
                        .setTitle(`📁 Retranscription | ${interaction.channel.name}`)
                        .setDescription(`**Fermé par :** <@${interaction.user.id}>\n\n**📜 Historique :**\n\`\`\`text\n${transcriptText || "Aucun message."}\n\`\`\``)
                        .setTimestamp();
                    await logChannel.send({ embeds: [transcriptEmbed] });
                }
                setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
            }
        }

        // --- 2. RÉCEPTION DES MODALS (Création des salons) ---
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'support_modal_help' || interaction.customId === 'support_modal_recruit') {
                await interaction.deferReply({ flags: [64] });

                try {
                    const isRecruit = interaction.customId === 'support_modal_recruit';
                    const prefix = isRecruit ? 'recrutement' : 'aide';
                    const targetRoles = isRecruit ? RECRUTEMENT_ROLES : ASSISTANCE_ROLES;

                    let overwrites = [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
                    ];

                    targetRoles.forEach(roleId => {
                        overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] });
                    });
                    
                    const ticketChannel = await interaction.guild.channels.create({
                        name: `${prefix}-${interaction.user.username}`,
                        type: ChannelType.GuildText,
                        parent: SUPPORT_CATEGORY_ID,
                        permissionOverwrites: overwrites,
                    });

                    const embed = new EmbedBuilder()
                        .setColor(isRecruit ? '#E67E22' : '#3498DB')
                        .setTitle(isRecruit ? '💼 NOUVELLE CANDIDATURE' : '🛠️ DEMANDE D\'ASSISTANCE')
                        .setTimestamp();

                    if (isRecruit) {
                        embed.addFields(
                            { name: '👤 Candidat', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '🎯 Poste visé', value: interaction.fields.getTextInputValue('role'), inline: true },
                            { name: '🎂 Âge', value: `${interaction.fields.getTextInputValue('age')} ans`, inline: true },
                            { name: '📊 Tracker / Pseudo', value: interaction.fields.getTextInputValue('tracker') },
                            { name: '📝 Présentation & Motivations', value: interaction.fields.getTextInputValue('motivations') }
                        );
                    } else {
                        embed.addFields(
                            { name: '👤 Utilisateur', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '📌 Sujet', value: interaction.fields.getTextInputValue('subject'), inline: true },
                            { name: '📝 Description', value: interaction.fields.getTextInputValue('description') }
                        );
                    }

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('support_claim').setLabel('Prendre en charge').setStyle(ButtonStyle.Primary).setEmoji('🛠️'),
                        new ButtonBuilder().setCustomId('support_close').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                    );

                    const pings = targetRoles.map(id => `<@&${id}>`).join(' ');
                    const welcomeMsg = isRecruit 
                        ? `Bonjour <@${interaction.user.id}> ! 👋\nMerci pour ta candidature. Le staff concerné (${pings}) arrive très vite.\n*Si tu ne sais pas comment trouver ton lien Tracker (Fortnite, Valorant, RL...), n'hésite pas à nous le dire ici pour qu'on t'aide !*`
                        : `Bonjour <@${interaction.user.id}> ! 👋\nNotre équipe technique (${pings}) est notifiée. Si tu as des captures d'écran de ton problème, tu peux les poster ici.`;

                    await ticketChannel.send({ 
                        content: welcomeMsg, 
                        embeds: [embed], 
                        components: [row] 
                    });

                    return await interaction.editReply({ content: `✅ Ton ticket a été créé : ${ticketChannel}` });
                } catch (error) {
                    console.error(error);
                    return await interaction.editReply({ content: "❌ Erreur lors de la création du salon." });
                }
            }
        }
    },
};