const { Events } = require('discord.js');
const supabase = require('../supabaseClient');

// 📋 LISTE DES RÔLES À SYNCHRONISER AVEC LE SITE WEB
// Format: 'ID_DISCORD': 'Nom affiché sur le site'
// Tu peux ajouter tous les rôles importants ici (Coachs, Rosters, Founders...)
const ROLES_TO_SYNC = {
    '1472395939150037165' : 'Fondateurs',
    '1472730147231760486': 'Chef Staff',
    '1472731056603136061': 'Modérateur',
    '1472731688957251748': 'Staff',
    '1472730147231760486': 'Chef du Staff',
    '1472731808121487540': 'Team Manager',
    '1472734272891785339': 'Coach',
    '1472732049126330451': 'Head Coach',
    '1474174283424075797': 'High Roster',
    '1472919635736400057': 'Tryhard',
    '1474214544242114791': 'Chill',
    '1472732516443230389': 'Academy',
    '1472732357806264465': 'General Rosters'
};

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        if (!supabase) return; 

        // Protection contre les accès où oldMember/newMember manqueraient (ex: faux objet du supabaseSync)
        const oldRoles = oldMember?.roles?.cache?.map ? oldMember.roles.cache.map(r => r.id) : [];
        const newRoles = newMember?.roles?.cache?.map ? newMember.roles.cache.map(r => r.id) : [];

        if (oldRoles.length === newRoles.length && oldRoles.every(v => newRoles.includes(v))) {
            return; // Pas de changement de rôle
        }

        // 1. On cherche le joueur dans Supabase
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('discord_id', newMember.user.id)
            .single();

        if (!profile) return; // S'il n'est pas inscrit sur le site, on annule

        console.log(`[Supabase Sync] Scan des rôles pour : ${newMember.user.tag}`);
        let syncedRolesNames = [];

        // 2. On traite chaque rôle de notre liste blanche
        for (const [discordRoleId, roleName] of Object.entries(ROLES_TO_SYNC)) {
            const hasRoleOnDiscord = newRoles.includes(discordRoleId);

            // Étape A: S'assurer que le rôle "existe" dans la table 'roles' de Supabase
            const { data: dbRole } = await supabase
                .from('roles')
                .select('id')
                .eq('discord_role_id', discordRoleId)
                .single();

            let targetDbRoleId = dbRole?.id;

            // Si le rôle n'existe pas en DB, le bot le crée tout seul !
            if (!targetDbRoleId) {
                const { data: newRole } = await supabase
                    .from('roles')
                    .insert({ name: roleName, discord_role_id: discordRoleId })
                    .select('id')
                    .single();
                if (newRole) targetDbRoleId = newRole.id;
            }

            if (!targetDbRoleId) continue;

            // Étape B: Lier ou délier le rôle à l'utilisateur
            if (hasRoleOnDiscord) {
                await supabase
                    .from('user_roles')
                    .upsert({ user_id: profile.id, role_id: targetDbRoleId }, { onConflict: 'user_id, role_id' });
                syncedRolesNames.push(roleName);
            } else {
                await supabase
                    .from('user_roles')
                    .delete()
                    .eq('user_id', profile.id)
                    .eq('role_id', targetDbRoleId);
            }
        }

        console.log(`[Supabase Sync] ✅ Rôles actifs pour ${newMember.user.tag} : [${syncedRolesNames.join(', ')}]`);
    }
};
