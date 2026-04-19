const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const cron = require('node-cron');
const supabaseNotifications = require('./supabase-notifications.js');
// const pool = require('./database.js');

// --- 1. CONFIGURATION DU CLIENT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.DirectMessages  
    ],
    partials: [Partials.Channel, Partials.Message]
});

// --- 2. SYSTÈME DE BASE DE DONNÉES ---
class SimpleDB extends Map {
    constructor(fileName) {
        super();
        this.fileName = path.join(__dirname, fileName);
        this.load();
    }
    load() {
        try {
            if (fs.existsSync(this.fileName)) {
                const data = JSON.parse(fs.readFileSync(this.fileName, 'utf-8'));
                for (const [key, value] of Object.entries(data)) { this.set(key, value); }
                console.log(`📂 Base de données chargée (${this.size} entrées).`);
            }
        } catch (e) { console.error("⚠️ Erreur chargement DB ou fichier inexistant."); }
    }
    save() { 
        fs.writeFileSync(this.fileName, JSON.stringify(Object.fromEntries(this), null, 2), 'utf-8'); 
    }
    set(key, value) { 
        super.set(key, value); 
        this.save(); 
        return this; 
    }
    delete(key) {
        const result = super.delete(key);
        this.save();
        return result;
    }
}

client.db = new SimpleDB("tickets.json");
client.commands = new Collection();

// --- 3. FONCTION DE MISE À JOUR AUTO DU STATUT ---
async function updateStatusEmbed(estOuvert) {
    const config = client.db.get('status_config');
    if (!config) return;

    try {
        const channel = await client.channels.fetch(config.channelId);
        const message = await channel.messages.fetch(config.messageId);
        const command = client.commands.get('staff-statut');
        
        if (command) {
            const embed = command.genererEmbed(estOuvert);
            await message.edit({ embeds: [embed] });
            console.log(estOuvert ? "✅ Statut auto : OUVERT" : "🌙 Statut auto : NUIT");
        }
    } catch (err) {
        console.error("Erreur mise à jour automatique statut :", err);
    }
}

// Planification des horaires (Cron)
cron.schedule('0 1 * * *', () => updateStatusEmbed(false), { timezone: "Europe/Paris" });
cron.schedule('0 10 * * *', () => updateStatusEmbed(true), { timezone: "Europe/Paris" });

// --- 4. CHARGEMENT DES COMMANDES ---
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.execute) client.commands.set(command.data.name, command);
    }
}
supabaseNotifications(client);



// --- 5. CHARGEMENT DES EVENTS ---
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.once) client.once(event.name, (...args) => event.execute(...args));
        else client.on(event.name, (...args) => event.execute(...args));
    }
}

// --- 6. GESTION DE L'ARRÊT (SIGINT) ---
process.on('SIGINT', async () => {
    console.log('Fermeture du bot... Mise à jour du statut...');
    const STATUS_CHANNEL_ID = '1474203660568363176';
    
    try {
        const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
        if (channel) {
            const offlineEmbed = new EmbedBuilder()
                .setTitle('📡 GOWRAX - État des Services')
                .setColor('#E74C3C')
                .setDescription('Le bot est actuellement **hors-ligne** (Hébergement local). Les services automatisés sont suspendus.')
                .addFields(
                    { name: '🤖 Bot Status', value: '🔴 Maintenance / OFF', inline: true },
                    { name: '🛠️ Mode', value: 'Développement', inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '📋 Détails des Services', value: 
                        `🔴 **Chat Vocal** : OFF\n` +
                        `🔴 **Tickets** : Fermés\n` +
                        `🔴 **Statuts** : Hors-ligne\n` +
                        `🔴 **Modération** : Manuelle\n` +
                        `🔴 **Rôles notifications** : Indisponibles` 
                    }
                )
                .setTimestamp();

            const messages = await channel.messages.fetch({ limit: 10 });
            const lastStatus = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title === '📡 GOWRAX - État des Services');

            if (lastStatus) await lastStatus.edit({ embeds: [offlineEmbed] });
            else await channel.send({ embeds: [offlineEmbed] });
        }
    } catch (err) {
        console.error("Impossible de mettre à jour le statut avant de couper :", err);
    }
    
    process.exit(0);
});

// --- 6.5 ANTI-CRASH GLOBAL ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 [ANTI-CRASH] Unhandled Rejection:', promise, 'raison:', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.error('💥 [ANTI-CRASH] Uncaught Exception:', err, 'origine:', origin);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('💥 [ANTI-CRASH] Uncaught Exception Monitor:', err, 'origine:', origin);
});

// --- 7. DÉPLOIEMENT AUTO DES COMMANDES SLASH ---
const { exec } = require('child_process');

console.log('🔄 Lancement de la synchronisation des commandes slash...');
exec('node deploy-commands.js', (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Erreur lors du déploiement : ${error.message}`);
        return;
    }
    // Affiche le résultat directement dans la console principale
    console.log(`✅ Résultat du déploiement :\n${stdout}`); 
});

// --- 7.5 SYNCHRONISATION DISCORD-WEB (RADAR) ---
const radarSupabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://hbneliavsrdurolfamjo.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncDiscordToRadar() {
    console.log('📡 [RADAR] Lancement du scan des membres Discord...');
    try {
        const guild = client.guilds.cache.first(); // Prend le premier serveur du bot
        if (!guild) return console.error('Erreur: Le bot n\'est sur aucun serveur.');
        
        await guild.members.fetch(); // Force la récupération de TOUS les membres
        
        const ignoredRoles = ['1472731688957251748', '1472732357806264465', '1472732894567858368'];

        const cacheData = guild.members.cache
            .filter(member => !member.user.bot && member.roles.cache.has('1474127750343168247')) // Ignore les bots et filtre par le rôle requis
            .map(member => {
                // Filtre les rôles ignorés et le rôle @everyone (qui possède l'ID de la guild)
                const validRoles = member.roles.cache.filter(role => !ignoredRoles.includes(role.id) && role.id !== guild.id);
                // Trie par position décroissante pour avoir le plus haut en premier
                const realHighestRole = validRoles.sort((a, b) => b.position - a.position).first();

                return {
                    discord_id: member.id,
                    username: member.user.username,
                    global_name: member.user.globalName || member.user.username,
                    highest_role: realHighestRole ? realHighestRole.name : 'Aucun rôle',
                    avatar_url: member.user.displayAvatarURL({ extension: 'png' }),
                    joined_at: new Date(member.joinedTimestamp).toISOString(),
                    last_cached_at: new Date().toISOString()
                };
            });

        if (cacheData.length > 0) {
            const { error } = await radarSupabase.from('discord_cache').upsert(cacheData, { onConflict: 'discord_id' });
            if (error) console.error('❌ Erreur de synchronisation Radar:', error.message);
            else console.log(`✅ [RADAR] ${cacheData.length} membres synchronisés avec succès vers le Web !`);
        }
    } catch (err) {
        console.error('❌ Erreur Critique lors du scan Discord:', err);
    }
}

client.once('ready', () => {
    syncDiscordToRadar(); // Check direct au démarrage 
    setInterval(syncDiscordToRadar, 2 * 60 * 60 * 1000); // Refait un check toutes les 2 Heures
});


// --- 8. CONNEXION ---
client.login(process.env.TOKEN);

//TODO: Ajouter sur le site web l'état du support (ouvert/fermé) en temps réel via une API ou un widget qui lit le statut depuis la DB ou un endpoint dédié.