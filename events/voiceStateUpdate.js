const { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const HUB_ID = '1474103585687081030'; 
        const CATEGORY_ID = '1474102365115125995'; 

        // CRÉATION
        if (newState.channelId === HUB_ID) {
            const member = newState.member;
            const channel = await newState.guild.channels.create({
                name: `🔊 Vocal de ${member.displayName}`,
                type: ChannelType.GuildVoice,
                parent: CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: newState.guild.id, // @everyone
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.ManageMessages] // ❌ INTERDIT à tout le monde d'être proprio
                    },
                    {
                        id: member.id, // Le créateur (Propriétaire)
                        allow: [
                            PermissionFlagsBits.ManageMessages, // ✅ NOUVEAU   BADGE DE PROPRIO (Ignorer le mode lent)
                            PermissionFlagsBits.MoveMembers,
                            PermissionFlagsBits.MuteMembers,
                            PermissionFlagsBits.DeafenMembers
                        ],
                        deny: [
                            PermissionFlagsBits.ManageChannels // ❌ INTERDIT de modifier le salon manuellement
                        ]
                    },
                ],
            });

            await member.voice.setChannel(channel);

            // ENVOI DU DASHBOARD
            const dashEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🛠️ GOWRAX - Gestion Vocal')
                .setDescription(`Propriétaire : <@${member.id}>\n\nUtilise les boutons ci-dessous pour gérer ton espace.`)
                .addFields(
                    { name: '🔒 Statut', value: 'Ouvert', inline: true },
                    { name: '👁️ Visibilité', value: 'Public', inline: true }
                );

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('vocal_lock').setLabel('Lock / Unlock').setStyle(ButtonStyle.Secondary).setEmoji('🔒'),
                new ButtonBuilder().setCustomId('vocal_hide').setLabel('Invisible / Visible').setStyle(ButtonStyle.Secondary).setEmoji('👻'),
                new ButtonBuilder().setCustomId('vocal_limit').setLabel('Limite').setStyle(ButtonStyle.Primary).setEmoji('👥')
            );

            // MENU DÉROULANT COMPLET
            const row2 = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('vocal_manage')
                    .setPlaceholder('⚙️ Options avancées...')
                    .addOptions([
                        { label: 'Infos du Salon', description: 'Afficher les membres et détails', value: 'vocal_info', emoji: 'ℹ️' },
                        { label: 'Autoriser un VIP', description: 'Laisser entrer quelqu\'un', value: 'vocal_vip', emoji: '🎟️' },
                        { label: 'Expulser un membre', description: 'Déconnecter et bloquer quelqu\'un', value: 'vocal_kick', emoji: '🥾' },
                        { label: 'Transférer Propriété', description: 'Donner le contrôle à un ami', value: 'vocal_transfer', emoji: '👑' },
                        { label: 'Changer le Nom', description: 'Renommer le salon', value: 'vocal_rename', emoji: '✏️' }
                    ])
            );

            await channel.send({ content: `<@${member.id}>`, embeds: [dashEmbed], components: [row1, row2] });
        }

        // SUPPRESSION
            if (oldState.channel && oldState.channel.parentId === CATEGORY_ID) {
                // 1. On vérifie que ce n'est pas le salon HUB
                if (oldState.channelId === HUB_ID) return;

                // 2. On vérifie si le salon est vide
                if (oldState.channel.members.size === 0) {
                    // 3. 🚨 LA SÉCURITÉ : On ne supprime que si le nom commence par l'émoji des salons temporaires
                    // Cela protège tes salons permanents même s'ils sont dans la même catégorie.
                    if (oldState.channel.name.startsWith('🔊')) {
                        await oldState.channel.delete().catch(() => null);
                    }
                }
            }
    },
};