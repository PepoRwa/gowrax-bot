const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const MODMAIL_DB = path.join(__dirname, '..', 'modmail.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail')
        .setDescription('Système de messages privés depuis un fil.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('open')
                .setDescription('Ouvre un fil pour discuter en DM avec un membre.')
                .addUserOption(option => option.setName('membre').setDescription('Le membre à contacter').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Ferme la session Modmail via le fil actuel.')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        let db = {};
        if (fs.existsSync(MODMAIL_DB)) {
            db = JSON.parse(fs.readFileSync(MODMAIL_DB, 'utf-8'));
        }

        if (subcommand === 'open') {
            const target = interaction.options.getUser('membre');
            if (target.bot) return interaction.reply({ content: "❌ Les bots n'ont pas de DM.", ephemeral: true });

            // Vérifier si un modmail est déjà existant pour ce membre
            if (db[target.id] && db[target.id].status === 'open') {
                return interaction.reply({ content: `❌ Un modmail est déjà en cours avec ce membre dans le fil <#${db[target.id].threadId}>.`, ephemeral: true });
            }

            try {
                // Créer un fil privé lié au salon où la commande a été tapée
                const thread = await interaction.channel.threads.create({
                    name: `📞 Modmail - ${target.username}`,
                    type: ChannelType.PrivateThread, // Réservé au staff appelé/invité
                    reason: `Modmail initié par ${interaction.user.tag}`
                });

                // Enregistrer l'association Membre <=> Thread
                db[target.id] = {
                    threadId: thread.id,
                    targetTag: target.tag,
                    status: 'open',
                    openedBy: interaction.user.id
                };
                
                // On peut aussi chercher le membre grâce au threadId
                db[`thread_${thread.id}`] = target.id;

                fs.writeFileSync(MODMAIL_DB, JSON.stringify(db, null, 2));

                const embedFil = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📞 Communication Modmail ouverte')
                    .setDescription(`Tout ce que vous écrirez dans ce fil sera envoyé anonymement (via le Bot) en DM à **${target.tag}**.\n\nUtilisez la commande \`/modmail close\` ici pour mettre fin à l'échange.`);
                
                await thread.send({ embeds: [embedFil] });
                
                // Msg prévention pour le membre en DM
                const embedDM = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📞 Un membre du staff vous contacte')
                    .setDescription("L'équipe *Gowrax* vient d'initialiser une conversation avec vous via ce bot. Vos prochaines réponses seront transmises directement au modérateur.");
                await target.send({ embeds: [embedDM] });

                return interaction.reply({ content: `✅ Fil ouvert avec succès : <#${thread.id}>`, ephemeral: true });
            } catch (e) {
                console.error(e);
                return interaction.reply({ content: `❌ Impossible d'ouvrir le modmail (Vérifiez les permissions ou que ses DMs sont ouverts).`, ephemeral: true });
            }
        } 
        
        else if (subcommand === 'close') {
            const threadId = interaction.channel.id;
            const targetId = db[`thread_${threadId}`];

            if (!targetId || !interaction.channel.isThread()) {
                return interaction.reply({ content: "❌ Cette commande doit être exécutée dans un fil Modmail actif.", ephemeral: true });
            }

            // Avertir le membre que le ticket est clos
            try {
                const target = await interaction.client.users.fetch(targetId);
                const embedDM = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('🔒 Fin de la discussion')
                    .setDescription("L'équipe a clôturé cette session de discussion. Si vous répondez après ce message, il ne sera pas transmis via ce fil spécifique.");
                await target.send({ embeds: [embedDM] });
            } catch (e) { /* Au pire s'il a bloqué entre temps, pas grave */ }

            // Nettoyer la BDD
            delete db[targetId];
            delete db[`thread_${threadId}`];
            fs.writeFileSync(MODMAIL_DB, JSON.stringify(db, null, 2));

            await interaction.reply({ content: "🔒 *La liaison Modmail a été coupée. Vous pouvez supprimer ce fil ou le garder en archive.*" });
            
            // Archiver / vérouiller le fil Staff
            try {
                await interaction.channel.setArchived(true);
            } catch (e){}
        }
    }
};