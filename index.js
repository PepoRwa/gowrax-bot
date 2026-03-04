const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const cron = require('node-cron');

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

// --- 7. CONNEXION ---
client.login(process.env.TOKEN);

//TODO: Ajouter sur le site web l'état du support (ouvert/fermé) en temps réel via une API ou un widget qui lit le statut depuis la DB ou un endpoint dédié.
//TODO: Ajouter notamment sur le site web le formulaire de contact (qui atterit sur le server via un webhook ainsi qu'une page News)