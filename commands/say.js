const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Fait parler le bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // Réservé au staff
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Le contenu du message à envoyer')
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('salon')
                .setDescription('Le salon où envoyer le message (par défaut celui-ci)')
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option => 
            option.setName('reply_to')
                .setDescription('ID du message auquel répondre (optionnel)')),

    async execute(interaction) {
        const text = interaction.options.getString('message');
        const channel = interaction.options.getChannel('salon') || interaction.channel;
        const replyId = interaction.options.getString('reply_to');

        try {
            // Remplacer les \n par de vrais retours à la ligne
            const cleanText = text.replace(/\\n/g, '\n');

            if (replyId) {
                const targetMsg = await channel.messages.fetch(replyId);
                await targetMsg.reply({ content: cleanText });
            } else {
                await channel.send({ content: cleanText });
            }

            return interaction.reply({ content: `✅ Message envoyé dans ${channel}.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: `❌ Erreur : Vérifie l'ID du message ou mes perms dans ce salon.`, ephemeral: true });
        }
    },
};