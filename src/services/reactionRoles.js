const { EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');
const { ALL_PANELS } = require('../data/reactionPanels');

/** Clé emoji stable pour la DB (unicode ou custom name:id) */
function emojiKey(emoji) {
  if (typeof emoji === 'string') return emoji;
  if (emoji?.id) return `${emoji.name}:${emoji.id}`;
  return emoji?.name || String(emoji);
}

async function savePanelReaction(panelKey, guildId, channelId, messageId, reaction, storedEmoji) {
  await pool.query(
    `INSERT INTO reaction_role_panels (panel_key, guild_id, channel_id, message_id, emoji, role_id, label)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), label = VALUES(label), panel_key = VALUES(panel_key)`,
    [panelKey, guildId, channelId, messageId, storedEmoji, reaction.roleId, reaction.label]
  );
}

async function findReactionMapping(messageId, emojiKeys) {
  const keys = Array.isArray(emojiKeys) ? emojiKeys : [emojiKeys];
  const [rows] = await pool.query(`SELECT * FROM reaction_role_panels WHERE message_id = ?`, [messageId]);

  for (const row of rows) {
    if (keys.includes(row.emoji)) return row;
    // unicode parfois lu différemment
    for (const key of keys) {
      if (row.emoji && key && row.emoji.codePointAt(0) === key.codePointAt(0)) return row;
    }
  }
  return null;
}

async function clearChannelPanels(channel) {
  const [rows] = await pool.query(
    `SELECT DISTINCT message_id FROM reaction_role_panels WHERE channel_id = ?`,
    [channel.id]
  );

  for (const row of rows) {
    try {
      const msg = await channel.messages.fetch(row.message_id);
      if (msg.author.id === channel.client.user.id) await msg.delete();
    } catch {
      // message déjà supprimé
    }
  }

  await pool.query(`DELETE FROM reaction_role_panels WHERE channel_id = ?`, [channel.id]);
}

async function deployPanel(channel, panel) {
  const reactionLine = panel.reactions.map((r) => `${r.emoji} = **${r.label}**`).join('  ·  ');

  const embed = new EmbedBuilder()
    .setTitle(panel.title)
    .setDescription(`${panel.description}\n\n**Réactions / Reactions :** ${reactionLine}`)
    .setColor(panel.color)
    .setFooter({ text: 'Réagis en bas du message · React below the message' });

  for (const reaction of panel.reactions) {
    embed.addFields({
      name: `${reaction.emoji} ${reaction.label}`,
      value: reaction.description.slice(0, 1024),
      inline: false,
    });
  }

  const message = await channel.send({ embeds: [embed] });

  for (const reaction of panel.reactions) {
    await message.react(reaction.emoji);
  }

  // Recharger pour récupérer les emojis tels que Discord les stocke
  const fresh = await message.fetch();
  for (const reaction of panel.reactions) {
    const discordReaction = fresh.reactions.cache.find(
      (r) => r.emoji.name === reaction.emoji || emojiKey(r.emoji) === reaction.emoji
    );
    const stored = discordReaction ? emojiKey(discordReaction.emoji) : reaction.emoji;
    await savePanelReaction(panel.key, channel.guildId, channel.id, message.id, reaction, stored);
  }

  return message;
}

async function deployAllPanels(channel, { clear = true } = {}) {
  if (clear) await clearChannelPanels(channel);

  const messages = [];
  for (const panel of ALL_PANELS) {
    messages.push(await deployPanel(channel, panel));
  }
  return messages;
}

async function toggleRole(member, roleId, add) {
  const role = member.guild.roles.cache.get(roleId);
  if (!role) throw new Error(`Rôle ${roleId} introuvable sur le serveur`);

  const botMember = member.guild.members.me;
  if (!botMember.permissions.has('ManageRoles')) {
    throw new Error('Le bot n\'a pas la permission Gérer les rôles');
  }
  if (role.position >= botMember.roles.highest.position) {
    throw new Error(`Le rôle ${role.name} est au-dessus du bot — déplace le rôle du bot plus haut`);
  }

  if (add) {
    if (!member.roles.cache.has(roleId)) await member.roles.add(role);
  } else if (member.roles.cache.has(roleId)) {
    await member.roles.remove(role);
  }
}

async function handleReaction(reaction, user, add) {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.partial) await reaction.message.fetch();

  const keys = [
    emojiKey(reaction.emoji),
    reaction.emoji.name,
    reaction.emoji.toString(),
  ].filter(Boolean);

  const mapping = await findReactionMapping(reaction.message.id, keys);
  if (!mapping) return;

  const guild = reaction.message.guild;
  if (!guild) return;

  const member = await guild.members.fetch(user.id);
  await toggleRole(member, mapping.role_id, add);

  console.log(
    `${add ? '➕' : '➖'} Rôle ${mapping.label} (${mapping.role_id}) → ${user.tag}`
  );
}

module.exports = {
  deployPanel,
  deployAllPanels,
  clearChannelPanels,
  handleReaction,
  findReactionMapping,
  emojiKey,
};
