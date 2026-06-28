const { ActivityType } = require('discord.js');
const pool = require('../db/pool');

const DB_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENOTFOUND',
  'PROTOCOL_CONNECTION_LOST',
]);

let dbHealthy = null;

function isDbConnectionError(err) {
  return Boolean(err?.code && DB_ERROR_CODES.has(err.code));
}

async function pingDb() {
  await pool.query('SELECT 1');
}

async function setBotAvailable(client) {
  if (dbHealthy === true) return;
  dbHealthy = true;
  await client.user.setPresence({
    status: 'online',
    activities: [],
  });
}

async function setBotUnavailable(client) {
  if (dbHealthy === false) return;
  dbHealthy = false;
  await client.user.setPresence({
    status: 'idle',
    activities: [{ type: ActivityType.Custom, state: 'BOT INDISPONIBLE' }],
  });
}

async function reportDbOk(client) {
  try {
    await setBotAvailable(client);
  } catch (err) {
    console.error('❌ Mise à jour présence (dispo):', err.message);
  }
}

async function reportDbError(client, err) {
  if (!isDbConnectionError(err)) return;
  try {
    await setBotUnavailable(client);
  } catch (presenceErr) {
    console.error('❌ Mise à jour présence (indispo):', presenceErr.message);
  }
}

async function syncPresenceFromDb(client) {
  try {
    await pingDb();
    await setBotAvailable(client);
  } catch (err) {
    await reportDbError(client, err);
  }
}

module.exports = {
  pingDb,
  syncPresenceFromDb,
  reportDbOk,
  reportDbError,
  isDbConnectionError,
};
