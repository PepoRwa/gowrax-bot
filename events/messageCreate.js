const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignorer les bots et les messages privés (DMs)
        if (message.author.bot || !message.guild) return;

        // 📊 TRACKING : Compteur de messages
        try {
            // S'assure que client.mysql est bien défini (ton pool de connexion)
            if (message.client.mysql) {
                const query = `
                    INSERT INTO user_stats (user_id, messages_count, vocal_time_ms) 
                    VALUES (?, 1, 0) 
                    ON DUPLICATE KEY UPDATE messages_count = messages_count + 1
                `;
                await message.client.mysql.execute(query, [message.author.id]);
            }
        } catch (error) {
            console.error("Erreur tracking message :", error.message);
        }
    },
};