const pool = require('../db/pool');
const { buildEmbedFromPayload, defaultEmbed, resolveChannelId, resolveMentionRole } = require('../utils/embeds');

async function fetchPending(limit = 20) {
  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE sent = 0 ORDER BY created_at ASC LIMIT ?`,
    [limit]
  );
  return rows;
}

async function markSent(id, discordMessageId = null) {
  await pool.query(
    `UPDATE notifications SET sent = 1, sent_at = NOW(), discord_message_id = ?, error = NULL WHERE id = ?`,
    [discordMessageId, id]
  );
}

async function markError(id, error) {
  await pool.query(`UPDATE notifications SET error = ? WHERE id = ?`, [String(error).slice(0, 2000), id]);
}

async function processNotification(client, row) {
  const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;

  if (row.type === 'dm') {
    if (!row.discord_id) throw new Error('discord_id requis pour les DM');
    const user = await client.users.fetch(row.discord_id);
    const embed = payload.embed ? buildEmbedFromPayload(payload.embed) : defaultEmbed(row.type, payload);
    const msg = await user.send({ content: payload.content || null, embeds: [embed] });
    await markSent(row.id, msg.id);
    return;
  }

  const channelKey = row.channel_key;
  const channelId = payload.channel_id || resolveChannelId(channelKey);
  if (!channelId) throw new Error(`Channel introuvable pour channel_key="${channelKey}"`);

  const channel = await client.channels.fetch(channelId);
  if (!channel?.isTextBased()) throw new Error(`Channel ${channelId} non textuel`);

  const roleId = resolveMentionRole(channelKey, payload);
  const mention = roleId ? `<@&${roleId}>` : payload.content || null;
  const embed = payload.embed ? buildEmbedFromPayload(payload.embed) : defaultEmbed(row.type, payload);

  const msg = await channel.send({
    content: mention,
    embeds: [embed],
    allowedMentions: roleId ? { roles: [roleId] } : { parse: [] },
  });

  await markSent(row.id, msg.id);
}

async function startNotificationPoller(client) {
  const intervalMs = require('../config').bot.notificationPollSeconds * 1000;

  async function tick() {
    try {
      const pending = await fetchPending();
      for (const row of pending) {
        try {
          await processNotification(client, row);
        } catch (err) {
          console.error(`❌ Notification #${row.id}:`, err.message);
          await markError(row.id, err.message);
        }
      }
    } catch (err) {
      console.error('❌ Erreur poll notifications:', err.message);
    }
  }

  await tick();
  setInterval(tick, intervalMs);
  console.log(`🔔 Poller notifications actif (${intervalMs / 1000}s)`);
}

module.exports = { startNotificationPoller, processNotification, fetchPending };
