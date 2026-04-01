const { Events } = require('discord.js');
const supabase = require('../supabaseClient'); // On importe le client Supabase

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        if (!supabase) return; // Si supabase n'est pas configuré, on ignore.

        const oldRoles = oldMember.roles.cache.map(r => r.id);
        const newRoles = newMember.roles.cache.map(r => r.id);

        // Si la liste des rôles est inchangée, on arrête.
        if (oldRoles.length === newRoles.length && oldRoles.every(v => newRoles.includes(v))) {
            return;
        }

        // On va vérifier si le profil de cet utilisateur (discord_id) existe dans Supabase.
        const { data: profile, error: errProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('discord_id', newMember.user.id)
            .single();

        if (errProfile || !profile) {
            // L'utilisateur n'est peut-être pas encore connecté au site web, donc on ne fait rien.
            return;
        }

        console.log(`[Supabase Sync] Mise à jour des rôles pour le joueur: ${newMember.user.tag}`);

        // On récupère tous les rôles configurés en base de données :
        const { data: dbRoles, error: errRoles } = await supabase
            .from('roles')
            .select('id, discord_role_id');

        if (errRoles || !dbRoles) return;

        // Pour chaque rôle connu dans Supabase, on attribue/retire dans la table user_roles
        const rolesPromises = dbRoles.map(async (dbRole) => {
            if (!dbRole.discord_role_id) return; // Si le rôle de la DB n'est pas lié à un ID Discord

            const hasRoleOnDiscord = newRoles.includes(dbRole.discord_role_id);
            
            if (hasRoleOnDiscord) {
                // On s'assure qu'il est bien assigné (upsert l'évite d'échouer s'il y a des doublons)
                await supabase
                    .from('user_roles')
                    .upsert({ user_id: profile.id, role_id: dbRole.id }, { onConflict: 'user_id, role_id' });
            } else {
                // S'il n'a pas le rôle, on le supprime de la table user_roles
                await supabase
                    .from('user_roles')
                    .delete()
                    .eq('user_id', profile.id)
                    .eq('role_id', dbRole.id);
            }
        });

        await Promise.all(rolesPromises);
    }
};
