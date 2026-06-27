const { EmbedBuilder } = require('discord.js');
const config = require('../config');

function buildEmbedFromPayload(payload) {
  const embed = new EmbedBuilder();
  if (payload.color) embed.setColor(payload.color);
  if (payload.title) embed.setTitle(payload.title);
  if (payload.description) embed.setDescription(payload.description);
  if (payload.url) embed.setURL(payload.url);
  if (payload.thumbnail) embed.setThumbnail(payload.thumbnail);
  if (payload.image) embed.setImage(payload.image);
  if (payload.footer) embed.setFooter(typeof payload.footer === 'string' ? { text: payload.footer } : payload.footer);
  if (payload.timestamp) embed.setTimestamp(payload.timestamp === true ? new Date() : new Date(payload.timestamp));
  if (Array.isArray(payload.fields)) {
    embed.addFields(payload.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline ?? false })));
  }
  return embed;
}

function defaultEmbed(type, payload) {
  const titles = {
    absence: '📋 Absence ETT',
    match: '⚔️ Match Gowrax',
    evolution: '📈 Évolution',
    form: '📝 Formulaire',
    custom: payload.title || 'Notification',
  };
  const embed = new EmbedBuilder()
    .setColor(payload.color ?? 0x5865f2)
    .setTitle(payload.title || titles[type] || 'Notification')
    .setTimestamp();
  if (payload.description) embed.setDescription(payload.description);
  if (Array.isArray(payload.fields)) {
    embed.addFields(payload.fields);
  }
  return embed;
}

function resolveChannelId(channelKey) {
  if (!channelKey) return null;
  return config.channels.resolve(channelKey) || null;
}

function resolveMentionRole(channelKey, payload) {
  if (payload.mention_role_id) return payload.mention_role_id;
  if (channelKey && config.rolePings[channelKey]) return config.rolePings[channelKey];
  return null;
}

module.exports = { buildEmbedFromPayload, defaultEmbed, resolveChannelId, resolveMentionRole };
