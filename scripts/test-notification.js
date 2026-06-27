#!/usr/bin/env node
/**
 * Insère une notification test dans MySQL.
 * Usage: node scripts/test-notification.js [channel_key]
 * Défaut: absences (évite les pings @Matchs / @Lives)
 * ⚠️  N'utilise pas "matchs" ou "lives" sauf si tu veux ping un rôle.
 */
require('dotenv').config();
const pool = require('../src/db/pool');

const channelKey = process.argv[2] || 'absences';

(async () => {
  const payload = {
    title: '🧪 Test local Gowrax Bot',
    description: `Notification de test envoyée depuis \`scripts/test-notification.js\`\nChannel key: **${channelKey}**`,
    color: 0x57f287,
  };

  const [result] = await pool.query(
    `INSERT INTO notifications (type, channel_key, payload) VALUES ('custom', ?, ?)`,
    [channelKey, JSON.stringify(payload)]
  );

  console.log(`✅ Notification #${result.insertId} insérée (channel_key=${channelKey})`);
  console.log('   Le bot l enverra dans les 30s si il tourne.');
  process.exit(0);
})().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
