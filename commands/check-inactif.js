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
            .setColor('#2F3136')
            .setTitle('⚠️ Contrôle d\'Activité - Gowrax')
            .setDescription(`Bonjour ${target.username},\n\nComme annoncé récemment, l'équipe de la **Gowrax** effectue un contrôle général d'activité de ses membres afin de faire le point sur nos effectifs.\n\nNous avons remarqué une baisse d'activité de ta part ces derniers temps. Pourrais-tu nous confirmer si tu souhaites toujours faire partie de nos effectifs et rester actif au sein de la structure ?\n\n🕒 **Tu disposes d'un délai de 72 heures pour répondre directement à ce message.**\nPassé ce délai sans nouvelle de ta part, nous considérerons que tu ne souhaites plus poursuivre l'aventure avec nous et procéderons à un dérank.\n\n**🎟️ Numéro de suivi : #${numeroSuivi}**\n*(Réponds simplement à ce message depuis tes DMs, notre équipe recevra ta réponse)*`);

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