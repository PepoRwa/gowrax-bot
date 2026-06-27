require('dotenv').config();

function env(key, { required = false, defaultValue = '' } = {}) {
  let value = process.env[key];
  if (value === undefined || value === null) {
    if (required) throw new Error(`Variable manquante dans .env : ${key}`);
    return defaultValue;
  }
  value = String(value).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (required && !value) throw new Error(`Variable vide dans .env : ${key}`);
  return value;
}

const channelMap = {
  absences: env('CHANNEL_ABSENCES'),
  matchs: env('CHANNEL_MATCHS'),
  lives: env('CHANNEL_LIVES', { defaultValue: env('CHANNEL_MATCHS') }),
  evolution: env('CHANNEL_EVOLUTION'),
};

const rolePingMap = {
  absences: env('ROLE_NOTIF_ABSENCES'),
  matchs: '1472735427571220655',
  lives: '1472735339796889784',
  annonces: '1472735238642995232',
  events: '1472735294087233598',
  videos: '1472735380569591828',
  posts: '1499461791829463110',
};

module.exports = {
  discord: {
    token: env('DISCORD_TOKEN', { required: true }),
    clientId: env('DISCORD_CLIENT_ID', { required: true }),
    guildId: env('DISCORD_GUILD_ID', { required: true }),
  },
  db: {
    host: env('DB_HOST', { required: true }),
    port: Number(env('DB_PORT', { defaultValue: '3306' })),
    user: env('DB_USER', { required: true }),
    password: env('DB_PASSWORD', { required: true }),
    database: env('DB_NAME', { required: true }),
  },
  roles: {
    casterStreamer: env('ROLE_CASTER_STREAMER', { required: true }),
    staff: env('ROLE_STAFF', { required: true }),
    ticketHelp: env('TICKET_ROLE_HELP', { defaultValue: '1472731056603136061' }),
    ticketRecruitment: env('TICKET_ROLE_RECRUITMENT', { defaultValue: '1474139472164556981' }),
  },
  channels: {
    absences: channelMap.absences,
    matchs: channelMap.matchs,
    lives: channelMap.lives || channelMap.matchs,
    evolution: channelMap.evolution,
    categoryTickets: env('CATEGORY_TICKETS', { required: true }),
    resolve(key) {
      return channelMap[key] || null;
    },
  },
  rolePings: rolePingMap,
  twitch: {
    clientId: env('TWITCH_CLIENT_ID'),
    clientSecret: env('TWITCH_CLIENT_SECRET'),
    pollIntervalMinutes: Number(env('TWITCH_POLL_INTERVAL_MINUTES', { defaultValue: '5' })),
    enabled() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },
  bot: {
    notificationPollSeconds: Number(env('NOTIFICATION_POLL_INTERVAL_SECONDS', { defaultValue: '30' })),
    nodeEnv: env('NODE_ENV', { defaultValue: 'production' }),
  },
};
