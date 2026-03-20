const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'inactifs.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check-inactif')
        .setDescription('Envoie un message de vérification d\'activité à un membre.')
        .addUserOption(option => 
            option.setName('membre')
                .setDescription('Le membre à qui envoyer le message.')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const target = interaction.options.getUser('membre');
        if (target.bot) return interaction.reply({ content: '❌ Impossible d\'envoyer un message à un bot.', ephemeral: true });

        // Génère un numéro de suivi
        const numeroSuivi = Math.floor(1000 + Math.random() * 9000); 

        const embedMessage = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('👋 Bonjour de la Gowrax !')
            .setDescription(`Salut ${target.username},\n\nNous faisons le point sur l'activité de nos membres. Es-tu toujours actif au sein de la structure ?\n\n**🎟️ Numéro de suivi : #${numeroSuivi}**\n*Merci de répondre directement à ce message pour nous tenir informés.*`);

        try {
            await target.send({ embeds: [embedMessage] });
            
            // On sauvegarde l'information
            let db = {};
            if (fs.existsSync(DB_FILE)) {
                db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
            }
            
            db[target.id] = {
                numero: numeroSuivi,
                date: new Date().toISOString(),
                staffId: interaction.user.id
            };
            
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

            await interaction.reply({ content: `✅ Message de vérification d'activité (#${numeroSuivi}) envoyé à ${target.tag}.`, ephemeral: true });
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `❌ Impossible d'envoyer un DM à ${target.tag}. Les messages privés de ce membre sont peut-être fermés.`, ephemeral: true });
        }
    },
};