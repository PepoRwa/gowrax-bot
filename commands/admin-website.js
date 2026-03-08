const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-website')
        .setDescription('Gère l’affichage de l’état du site GOWRAX.me')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt => opt.setName('statut').setDescription('État du site').setRequired(true).addChoices(
            { name: '✅ En Ligne', value: 'online' },
            { name: '❌ Hors Ligne', value: 'offline' },
            { name: '🛠️ Maintenance', value: 'maintenance' }
        )),

    async execute(interaction) {
        const statut = interaction.options.getString('statut');
        const user = interaction.user;

        if (statut === 'maintenance') {
            await interaction.reply({ content: "📥 Vérifie tes DMs pour configurer le rapport de maintenance.", ephemeral: true });

            try {
                const dmChannel = await user.createDM();
                await dmChannel.send("🔧 **MODE MAINTENANCE GOWRAX**\nExplique brièvement la raison de la maintenance (Logs/Rapport) :");
                
                const filter = m => m.author.id === user.id;
                
                // Collecte du Rapport
                const collectedLog = await dmChannel.awaitMessages({ filter, max: 1, time: 300000 }); // 5 min
                if (!collectedLog.size) return await dmChannel.send("⌛ Délai expiré. Re-tape la commande sur le serveur.");
                const log = collectedLog.first().content;

                await dmChannel.send("⏳ **DURÉE ESTIMÉE**\nCombien de temps cela va-t-il durer ? (ex: 30 min, 2h...)");

                // Collecte de la Durée
                const collectedTime = await dmChannel.awaitMessages({ filter, max: 1, time: 300000 });
                if (!collectedTime.size) return await dmChannel.send("⌛ Délai expiré.");
                const duree = collectedTime.first().content;

                await updateWebsiteEmbed(interaction, '🛠️ Maintenance', log, duree);
                await dmChannel.send("✅ **Déploiement réussi.** Le statut a été mis à jour sur le réseau.");

            } catch (err) {
                console.error(err);
                return interaction.followUp({ content: "❌ Erreur : Tes DMs sont fermés ou une erreur est survenue.", ephemeral: true });
            }
        } else {
            const label = statut === 'online' ? '✅ En Ligne' : '❌ Hors Ligne';
            await updateWebsiteEmbed(interaction, label);
            return interaction.reply({ content: `✅ Statut mis à jour : **${label}**`, ephemeral: true });
        }
    }
};

async function updateWebsiteEmbed(interaction, label, log = null, duree = null) {
    const client = interaction.client;
    
    const embed = new EmbedBuilder()
        .setTitle('🌐 GOWRAX // ÉTAT DU SITE')
        .setTimestamp()
        .setFooter({ text: 'GOWRAX NETWORK MONITORING' });

    if (label.includes('En Ligne')) {
        embed.setColor('#6F2DBD') // Gowrax Purple
             .setDescription('### 🟢 SYSTÈMES OPÉRATIONNELS\nLe site **Gowrax.me** est entièrement accessible.');
    } else if (label.includes('Hors Ligne')) {
        embed.setColor('#1A1C2E') // Void Blue
             .setDescription('### 🔴 SYSTÈME HORS LIGNE\nLe site est actuellement inaccessible pour une durée indéterminée.');
    } else {
        embed.setColor('#D62F7F') // Neon Magenta pour l'alerte maintenance
             .setDescription('### 🛠️ MAINTENANCE EN COURS\nDes modifications techniques sont appliquées sur le serveur Web.')
             .addFields(
                 { name: '📂 RAPPORT DE MODIFICATION', value: `\`\`\`\n${log}\n\`\`\`` },
                 { name: '⏳ DURÉE ESTIMÉE', value: `\`${duree}\``, inline: true }
             );
    }

    // Gestion du message unique via tickets.json
    const config = client.db.get('website_status_config');
    let targetMessage = null;

    if (config) {
        try {
            const channel = await client.channels.fetch(config.channelId);
            targetMessage = await channel.messages.fetch(config.messageId);
            await targetMessage.edit({ embeds: [embed] });
        } catch (e) {
            targetMessage = null; // Si le message a été supprimé, on en recrée un
        }
    }

    if (!targetMessage) {
        const msg = await interaction.channel.send({ embeds: [embed] });
        client.db.set('website_status_config', { channelId: interaction.channel.id, messageId: msg.id });
    }
}