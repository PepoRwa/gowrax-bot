const pool = require('../db/pool');
const config = require('../config');
const { reportDbOk, reportDbError } = require('../utils/presence');

async function getKnownRoleIds() {
  const [rows] = await pool.query(`SELECT role_id FROM discord_roles`);
  return new Set(rows.map((r) => r.role_id));
}

async function syncMemberRoles(guild, discordId) {
  const knownIds = await getKnownRoleIds();
  if (!knownIds.size) throw new Error('discord_roles vide — migration 003 non appliquée ?');

  let member;
  try {
    member = await guild.members.fetch(discordId);
  } catch {
    throw new Error(`Membre ${discordId} introuvable sur le serveur Discord`);
  }

  const matchedRoleIds = [...member.roles.cache.keys()].filter((id) => knownIds.has(id));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM user_roles WHERE discord_id = ?`, [String(discordId)]);
    for (const roleId of matchedRoleIds) {
      await conn.query(`INSERT INTO user_roles (discord_id, role_id) VALUES (?, ?)`, [
        String(discordId),
        roleId,
      ]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return matchedRoleIds;
}

async function removeMemberRoles(discordId) {
  await pool.query(`DELETE FROM user_roles WHERE discord_id = ?`, [String(discordId)]);
}

async function fetchPendingSyncRequests(limit = 10) {
  const [rows] = await pool.query(
    `SELECT * FROM sync_roles_requests WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
    [limit]
  );
  return rows;
}

async function markSyncDone(id) {
  await pool.query(
    `UPDATE sync_roles_requests SET status = 'done', processed_at = NOW(), error = NULL WHERE id = ?`,
    [id]
  );
}

async function markSyncError(id, error) {
  await pool.query(
    `UPDATE sync_roles_requests SET status = 'error', processed_at = NOW(), error = ? WHERE id = ?`,
    [String(error).slice(0, 2000), id]
  );
}

async function processSyncRequest(client, row) {
  const guild = await client.guilds.fetch(config.discord.guildId);
  await syncMemberRoles(guild, row.discord_id);
  await markSyncDone(row.id);
}

function startSyncRolesPoller(client) {
  const intervalMs = config.bot.syncRolesPollSeconds * 1000;

  async function tick() {
    try {
      const pending = await fetchPendingSyncRequests();
      for (const row of pending) {
        try {
          await processSyncRequest(client, row);
          console.log(`🔄 Rôles sync OK → ${row.discord_id}`);
        } catch (err) {
          console.error(`❌ Sync rôles #${row.id}:`, err.message);
          await markSyncError(row.id, err.message);
        }
      }
      await reportDbOk(client);
    } catch (err) {
      console.error('❌ Erreur poll sync_roles:', err.message);
      await reportDbError(client, err);
    }
  }

  tick();
  setInterval(tick, intervalMs);
  console.log(`🔄 Poller sync rôles actif (${config.bot.syncRolesPollSeconds}s)`);
}

module.exports = {
  syncMemberRoles,
  removeMemberRoles,
  startSyncRolesPoller,
  processSyncRequest,
};
