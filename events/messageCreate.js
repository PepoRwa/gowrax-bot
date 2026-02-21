const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignorer les bots et les messages de serveurs
        if (message.author.bot || message.guild !== null) return;

        // Bridge DM désactivé pour le moment.
    },
};