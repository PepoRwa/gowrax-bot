const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const config = require('./src/config');
const { runMigrations } = require('./src/db/migrate');
const { loadCommands } = require('./src/loaders/commands');
const { loadEvents } = require('./src/loaders/events');

async function deployCommands() {
  const commands = [...loadCommands().values()].map((c) => c.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(config.discord.token);
  const data = await rest.put(
    Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
    { body: commands }
  );
  console.log(`✅ ${data.length} commande(s) slash synchronisée(s)`);
}

async function main() {
  try {
    await runMigrations();
  } catch (err) {
    console.error('❌ DB / migrations:', err.message);
  }

  await deployCommands();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });

  client.commands = new Collection();
  for (const [name, command] of loadCommands()) {
    client.commands.set(name, command);
  }

  client.on('error', (err) => console.error('❌ Client error:', err.message));
  process.on('unhandledRejection', (err) => console.error('❌ Unhandled:', err?.message || err));

  loadEvents(client);

  await client.login(config.discord.token);
}

main().catch((err) => {
  console.error('❌ Démarrage impossible:', err);
  process.exit(1);
});
