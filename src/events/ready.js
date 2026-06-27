const { Events } = require('discord.js');
const { startNotificationPoller } = require('../services/notifications');
const { startTwitchPoller } = require('../services/twitchLive');
const config = require('../config');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    console.log(`📡 Guild: ${config.discord.guildId}`);

    startNotificationPoller(client);
    startTwitchPoller(client);
  },
};
