const { REST, Routes } = require('discord.js');
const config = require('./src/config');
const { loadCommands } = require('./src/loaders/commands');

const commands = [...loadCommands().values()].map((c) => c.data.toJSON());
const rest = new REST({ version: '10' }).setToken(config.discord.token);

(async () => {
  try {
    console.log(`⏳ Déploiement de ${commands.length} commandes…`);
    await rest.put(
      Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
      { body: commands }
    );
    console.log('✅ Commandes déployées.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur déploiement:', err);
    process.exit(1);
  }
})();
