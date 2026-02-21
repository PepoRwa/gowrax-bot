const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche la latence du bot.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FF00FF') // Magenta Gowrax
            .setTitle('📡 Statut Connexion')
            .addFields(
                { name: 'Latence API', value: `\`${Math.round(interaction.client.ws.ping)}ms\``, inline: true },
                { name: 'Uptime', value: `<t:${Math.round(interaction.client.readyTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'GOWRAX Bot System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};