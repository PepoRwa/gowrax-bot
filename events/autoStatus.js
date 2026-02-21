const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const STATUS_CHANNEL_ID = '1474203660568363176';
        console.log(`✅ ${client.user.tag} est prêt !`);
        
        const channel = await client.channels.fetch(STATUS_CHANNEL_ID).catch(() => null);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('📡 GOWRAX - État des Services')
            .setColor('#2ECC71')
            .setDescription('Tous les systèmes sont actuellement **en ligne**. Les services ci-dessous sont opérationnels.')
            .addFields(
                { name: '🤖 Bot Status', value: '🟢 Opérationnel', inline: true },
                { name: '🛠️ Mode', value: 'Développement (Local)', inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '📋 Détails des Services', value: 
                    `🟢 **Chat Vocal** : Actif\n` +
                    `🟢 **Tickets** : Ouverts\n` +
                    `🟢 **Statuts** : Synchronisés\n` +
                    `🟢 **Modération** : Active\n` +
                    `🟢 **Rôles notifications** : Disponibles` 
                }
            )
            .setTimestamp()
            .setFooter({ text: 'GOWRAX Network — Automatique' });

        const messages = await channel.messages.fetch({ limit: 10 });
        const lastStatus = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title === '📡 GOWRAX - État des Services');

        if (lastStatus) {
            await lastStatus.edit({ embeds: [embed] });
        } else {
            await channel.send({ embeds: [embed] });
        }
    },
};