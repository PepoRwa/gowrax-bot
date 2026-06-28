const { Events } = require('discord.js');
const { startNotificationPoller } = require('../services/notifications');
const { startTwitchPoller } = require('../services/twitchLive');
const { startSyncRolesPoller } = require('../services/syncRoles');
const { syncPresenceFromDb } = require('../utils/presence');
const config = require('../config');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    console.log(`📡 Guild: ${config.discord.guildId}`);

    await syncPresenceFromDb(client);

    startNotificationPoller(client);
    startSyncRolesPoller(client);
    startTwitchPoller(client);
  },
};
