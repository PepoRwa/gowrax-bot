const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs'); // On utilise le système de fichiers natif
const path = require('path');
require('dotenv').config();

// --- 1. SYSTÈME DE BASE DE DONNÉES SIMPLE (Sans Enmap) ---
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
                for (const [key, value] of Object.entries(data)) {
                    this.set(key, value);
                }
                console.log(`📂 Base de données chargée (${this.size} tickets).`);
            }
        } catch (e) {
            console.error("⚠️ Création d'une nouvelle base de données.");
        }
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

    clear() {
        super.clear();
        this.save();
    }
}

// --- 2. CONFIGURATION DU CLIENT ---
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
    partials: [
        Partials.Channel, 
        Partials.Message
    ]
});

// --- 3. ATTACHEMENT DE LA DB ---
// On crée un fichier "tickets.json" pour stocker les infos
client.db = new SimpleDB("tickets.json"); 

client.commands = new Collection();

// --- CHARGEMENT DES COMMANDES ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    }
}

// --- CHARGEMENT DES EVENTS ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Détection de l'arrêt du bot
// Détection de l'arrêt du bot
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

client.login(process.env.TOKEN);
