const pool = require('../db/pool');
const config = require('../config');
const { EmbedBuilder } = require('discord.js');

let appAccessToken = null;
let tokenExpiresAt = 0;

async function getAppAccessToken() {
  if (!config.twitch.enabled()) return null;
  if (appAccessToken && Date.now() < tokenExpiresAt) return appAccessToken;

  const params = new URLSearchParams({
    client_id: config.twitch.clientId,
    client_secret: config.twitch.clientSecret,
    grant_type: 'client_credentials',
  });

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!res.ok) throw new Error(`Twitch token error: ${res.status}`);
  const data = await res.json();
  appAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return appAccessToken;
}

async function fetchLiveStreams(logins) {
  if (!logins.length) return [];
  const token = await getAppAccessToken();
  if (!token) return [];

  const url = new URL('https://api.twitch.tv/helix/streams');
  logins.forEach((login) => url.searchParams.append('user_login', login));

  const res = await fetch(url, {
    headers: {
      'Client-ID': config.twitch.clientId,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error(`Twitch streams error: ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

async function getWatchlist(guild) {
  const [rows] = await pool.query(
    `SELECT discord_id, twitch_username FROM users WHERE twitch_username IS NOT NULL AND twitch_username != ''`
  );

  const eligible = [];
  for (const row of rows) {
    try {
      const member = await guild.members.fetch(row.discord_id);
      if (!member.roles.cache.has(config.roles.casterStreamer)) continue;
      eligible.push({ discordId: row.discord_id, twitchUsername: row.twitch_username.toLowerCase(), member });
    } catch {
      // membre plus sur le serveur
    }
  }
  return eligible;
}

async function wasAnnounced(streamId) {
  const [rows] = await pool.query(`SELECT id FROM live_announcements WHERE stream_id = ?`, [streamId]);
  return rows.length > 0;
}

async function markAnnounced(discordId, twitchUsername, streamId) {
  await pool.query(
    `INSERT IGNORE INTO live_announcements (discord_id, twitch_username, stream_id) VALUES (?, ?, ?)`,
    [discordId, twitchUsername, streamId]
  );
}

async function announceLive(client, guild, watcher, stream) {
  const channelId = config.channels.lives;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId);
  if (!channel?.isTextBased()) return;

  const roleId = config.rolePings.lives;
  const url = `https://twitch.tv/${stream.user_login}`;
  const embed = new EmbedBuilder()
    .setTitle(`🔴 ${stream.user_name} est en live !`)
    .setDescription(stream.title || 'En direct sur Twitch')
    .setURL(url)
    .setColor(0x9146ff)
    .addFields(
      { name: 'Jeu', value: stream.game_name || '—', inline: true },
      { name: 'Viewers', value: String(stream.viewer_count), inline: true }
    )
    .setThumbnail(stream.thumbnail_url?.replace('{width}', '320').replace('{height}', '180'))
    .setTimestamp();

  await channel.send({
    content: roleId ? `<@&${roleId}> ${watcher.member}` : `${watcher.member}`,
    embeds: [embed],
    allowedMentions: { roles: roleId ? [roleId] : [], users: [watcher.discordId] },
  });

  await markAnnounced(watcher.discordId, stream.user_login, stream.id);
}

async function checkLives(client) {
  if (!config.twitch.enabled()) return;

  const guild = await client.guilds.fetch(config.discord.guildId);
  const watchlist = await getWatchlist(guild);
  if (!watchlist.length) return;

  const logins = [...new Set(watchlist.map((w) => w.twitchUsername))];
  const streams = await fetchLiveStreams(logins);
  const loginToWatcher = Object.fromEntries(watchlist.map((w) => [w.twitchUsername, w]));

  for (const stream of streams) {
    const login = stream.user_login.toLowerCase();
    const watcher = loginToWatcher[login];
    if (!watcher) continue;
    if (await wasAnnounced(stream.id)) continue;
    await announceLive(client, guild, watcher, stream);
  }
}

async function linkTwitch(discordId, username) {
  const clean = username.replace(/^@/, '').toLowerCase().trim();
  await pool.query(
    `INSERT INTO users (discord_id, twitch_username, twitch_linked_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE twitch_username = VALUES(twitch_username), twitch_linked_at = NOW()`,
    [discordId, clean]
  );
  return clean;
}

function startTwitchPoller(client) {
  if (!config.twitch.enabled()) {
    console.warn('⚠️  Twitch désactivé — TWITCH_CLIENT_SECRET manquant dans .env');
    return;
  }

  const intervalMs = config.twitch.pollIntervalMinutes * 60 * 1000;

  const tick = async () => {
    try {
      await checkLives(client);
    } catch (err) {
      console.error('❌ Erreur poll Twitch:', err.message);
    }
  };

  tick();
  setInterval(tick, intervalMs);
  console.log(`📺 Poller Twitch actif (${config.twitch.pollIntervalMinutes} min)`);
}

module.exports = { startTwitchPoller, linkTwitch, checkLives };
