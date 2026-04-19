const { createClient } = require('@supabase/supabase-js');
const { EmbedBuilder } = require('discord.js');

// Remplacer ces lignes par vos vrais credentials (ou les mettre dans un .env)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hbneliavsrdurolfamjo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = async (client) => {
    console.log('🔗 Initialisation de l\'écouteur Supabase (Notifications)...');

    const channel = supabase.channel('discord-bot-notifications')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications' },
            async (payload) => {
                const notif = payload.new;
                console.log('🔔 Nouvelle notification détectée :', notif.title);

                // Couleurs dynamiques selon le type de notification
                const embedColor = notif.type === 'personal' ? '#6F2DBD' : '#FF9900'; // Violet Gowrax pour Mentorat, Orange pour les Matchs

                const embed = new EmbedBuilder()
                    .setAuthor({ 
                        name: 'GOWRAX Administration', 
                        iconURL: client.user.displayAvatarURL(), // Utilise automatiquement l'avatar de ton Bot Discord !
                        url: 'https://team.gowrax.me/' // Lien cliquable sur le nom de l'auteur
                    })
                    .setTitle(notif.title)
                    .setDescription(`${notif.message}\n\n🔗 **[Accéder à la plateforme GOWRAX](https://team.gowrax.me/)**`)
                    .setColor(embedColor)
                    .setThumbnail(client.user.displayAvatarURL()) // Mini-logo en haut à droite de l'embed
                    .setFooter({ 
                        text: 'Système Automatisé • GOWRAX', 
                        iconURL: client.user.displayAvatarURL() 
                    })
                    .setTimestamp();

                // 1. Notification Personnelle (envoyée en DM)
                if (notif.user_id && notif.type === 'personal') {
                    // Pour trouver le discord_id, il faut que l'utilisateur soit lié.
                    // Optionnel : vous pourriez devoir chercher le profils utilisateur associé au user_id.
                    // Si on a le discord_id (ex: envoyé directement dans la notification ou via jointure) :
                    const discord_id = notif.discord_id; // À envoyer lors de la création de la notif si possible

                    if (discord_id) {
                        try {
                            const user = await client.users.fetch(discord_id);
                            if (user) await user.send({ embeds: [embed] });
                        } catch (err) {
                            console.error(`Impossible d'envoyer le MP à ${discord_id}:`, err);
                        }
                    } else {
                        // On doit retrouver le profil dans Supabase
                        const { data: profile } = await supabase.from('v_profiles').select('discord_id').eq('id', notif.user_id).single();
                        if (profile && profile.discord_id) {
                            try {
                                const user = await client.users.fetch(profile.discord_id);
                                if (user) await user.send({ embeds: [embed] });
                            } catch (err) {
                                console.error(`Impossible d'envoyer le MP à ${profile.discord_id}:`, err);
                            }
                        }
                    }
                } 
                // 2. Notification Globale (envoyée dans un salon Discord selon le roster_type)
                else if (!notif.user_id && notif.type === 'global') {
                    // Remplacez ces IDs par les vrais IDs de salons dans votre serveur GOWRAX !
                    const channelsMap = {
                        'Tous': '1488902612354076712',
                        'High Roster': '1482448316699644005',
                        'Academy': '1474116136801927290',
                        'Chill': '1474116136801927290',
                        'Tryhard': '1474116136801927290',
                        'Staff': '1474115207172329674'
                    };

                    const channelId = channelsMap[notif.target_roster] || channelsMap['Tous'];

                    if (channelId) {
                        try {
                            const discordChannel = await client.channels.fetch(channelId);
                            if (discordChannel) await discordChannel.send({ embeds: [embed] });
                        } catch (err) {
                            console.error(`Impossible d'envoyer la notification dans le salon ${channelId}:`, err);
                        }
                    }
                }
            }
        )
        .subscribe();
};