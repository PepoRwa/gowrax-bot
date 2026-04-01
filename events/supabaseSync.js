const supabase = require('../supabaseClient');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        if (!supabase) {
            console.log("⚠️ Supabase n'est pas configuré, le bot ne synchronisera pas les rôles.");
            return;
        }
        console.log("📡 Bot connecté à Supabase, écoute des demandes de synchronisation...");

        // On écoute les insertions dans la table `sync_requests`
        supabase
            .channel('public:sync_requests')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sync_requests' }, async (payload) => {
                const request = payload.new;
                console.log(`[Supabase Sync] Nouvelle demande de synchronisation pour Discord ID: ${request.discord_id}`);

                try {
                    // Récupérer tous les serveurs où le bot est présent (généralement 1)
                    for (const guild of client.guilds.cache.values()) {
                        const member = await guild.members.fetch(request.discord_id).catch(() => null);
                        
                        if (member) {
                            // Le membre est sur le serveur, on simule un GuildMemberUpdate pour déclencher la synchro
                            const mockOldMember = {
                                roles: { cache: new Map() } // Vide pour forcer la différence
                            };
                            
                            // On déclenche l'évenement que l'on vient de créer pour synchroniser
                            client.emit('guildMemberUpdate', mockOldMember, member);
                            console.log(`[Supabase Sync] Synchronisation forcée déclenchée pour ${member.user.tag}`);
                        }
                    }

                    // On marque la requête comme scannée (optionnel, juste pour l'historique)
                    await supabase
                        .from('sync_requests')
                        .update({ scanned: true })
                        .eq('id', request.id);

                } catch (err) {
                    console.error("[Supabase Sync] Erreur lors de la synchronisation:", err);
                }
            })
            .subscribe();
    }
};
