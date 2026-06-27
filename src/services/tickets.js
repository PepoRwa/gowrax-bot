const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const pool = require('../db/pool');
const config = require('../config');

const TICKET_TYPES = {
  help: {
    label: 'Demande d\'aide',
    labelEn: 'Help request',
    emoji: '🆘',
    mentionRoles: [config.roles.ticketHelp],
    modalTitle: '🆘 Aide / Help',
    fields: [
      {
        id: 'title',
        label: 'Titre / Title',
        style: TextInputStyle.Short,
        placeholder: 'Ex: Problème de rôle / Role issue',
        required: true,
        maxLength: 100,
      },
      {
        id: 'concerns',
        label: 'Sujet / Subject',
        style: TextInputStyle.Short,
        placeholder: 'Ex: Compte, serveur, membre…',
        required: true,
        maxLength: 100,
      },
      {
        id: 'description',
        label: 'Détails / Details',
        style: TextInputStyle.Paragraph,
        placeholder: 'Décris ton problème en détail / Describe your issue…',
        required: true,
        maxLength: 1000,
      },
    ],
  },
  recruitment: {
    label: 'Recrutement',
    labelEn: 'Recruitment',
    emoji: '📋',
    mentionRoles: [config.roles.ticketRecruitment],
    modalTitle: '📋 Recrutement / Recruitment',
    fields: [
      {
        id: 'title',
        label: 'Poste / Position',
        style: TextInputStyle.Short,
        placeholder: 'Ex: Joueur, Coach, Staff…',
        required: true,
        maxLength: 100,
      },
      {
        id: 'concerns',
        label: 'Pseudo / Contact',
        style: TextInputStyle.Short,
        placeholder: 'Ton pseudo Discord ou contact',
        required: true,
        maxLength: 100,
      },
      {
        id: 'description',
        label: 'Motivation / About you',
        style: TextInputStyle.Paragraph,
        placeholder: 'Présente-toi et explique ta candidature…',
        required: true,
        maxLength: 1000,
      },
    ],
  },
};

function buildTicketPanel() {
  const embed = new EmbedBuilder()
    .setTitle('🎫 Centre de tickets / Ticket Center')
    .setDescription(
      '**Bienvenue !** Sélectionne le type de demande ci-dessous.\n' +
      '**Welcome!** Select the type of request below.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '🆘 **Demander de l\'aide / Request help**\n' +
      '> Un problème sur le serveur, une question, un conflit, un bug…\n' +
      '> A server issue, question, conflict, bug…\n' +
      '_Le staff concerné sera notifié · Relevant staff will be pinged_\n\n' +
      '📋 **Recrutement / Recruitment**\n' +
      '> Candidature pour rejoindre la team (joueur, staff, partenaire…)\n' +
      '> Apply to join the team (player, staff, partner…)\n' +
      '_L\'équipe recrutement sera notifiée · Recruiters will be pinged_\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n' +
      '_Un salon privé sera créé pour toi · A private channel will be opened for you_'
    )
    .setColor(0x5865f2)
    .setFooter({ text: 'Team Gowrax · Un seul ticket ouvert à la fois / One open ticket at a time' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_open_help')
      .setLabel('Aide / Help')
      .setEmoji('🆘')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('ticket_open_recruitment')
      .setLabel('Recrutement / Apply')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

function buildTicketModal(type) {
  const def = TICKET_TYPES[type];
  const modal = new ModalBuilder().setCustomId(`ticket_modal_${type}`).setTitle(def.modalTitle);

  for (const field of def.fields) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(field.id)
          .setLabel(field.label)
          .setStyle(field.style)
          .setPlaceholder(field.placeholder)
          .setRequired(field.required)
          .setMaxLength(field.maxLength)
      )
    );
  }

  return modal;
}

function buildTicketControls({ claimed = false } = {}) {
  const row = new ActionRowBuilder();

  if (!claimed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Prendre en charge / Claim')
        .setEmoji('✋')
        .setStyle(ButtonStyle.Success)
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Fermer / Close')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );

  return row;
}

function isTicketChannel(channel) {
  return Boolean(channel?.name?.startsWith('ticket-'));
}

async function getOpenTicketByUser(authorId) {
  const [rows] = await pool.query(
    `SELECT * FROM tickets WHERE author_discord_id = ? AND status = 'open' LIMIT 1`,
    [String(authorId)]
  );
  return rows[0] || null;
}

async function getOpenTicketByChannel(channelId) {
  const [rows] = await pool.query(
    `SELECT * FROM tickets WHERE discord_channel_id = ? AND status = 'open' LIMIT 1`,
    [String(channelId)]
  );
  return rows[0] || null;
}

async function createTicketChannel(interaction, type, formData) {
  const def = TICKET_TYPES[type];
  const guild = interaction.guild;
  const author = interaction.member;

  const existing = await getOpenTicketByUser(author.id);
  if (existing) {
    throw new Error(`Tu as déjà un ticket ouvert / You already have an open ticket: <#${existing.discord_channel_id}>`);
  }

  const safeName = author.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'user';
  const channelName = `ticket-${safeName}-${Date.now().toString(36).slice(-4)}`;

  const overwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: author.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: config.roles.staff,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    },
  ];

  for (const roleId of def.mentionRoles) {
    if (!roleId) continue;
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: config.channels.categoryTickets,
    permissionOverwrites: overwrites,
    topic: `Ticket ${type} — ${author.user.tag}`,
  });

  // DB avant le message — évite les tickets orphelins si crash
  const [result] = await pool.query(
    `INSERT INTO tickets (ticket_type, discord_channel_id, author_discord_id, subject, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [type, String(channel.id), String(author.id), formData.title, JSON.stringify(formData)]
  );

  const mentions = def.mentionRoles.filter(Boolean).map((id) => `<@&${id}>`).join(' ');

  const embed = new EmbedBuilder()
    .setTitle(`${def.emoji} ${def.label} / ${def.labelEn}`)
    .setColor(type === 'help' ? 0xed4245 : 0x57f287)
    .setDescription(
      'Merci d\'avoir ouvert un ticket. Un membre de l\'équipe te répondra bientôt.\n' +
      'Thanks for opening a ticket. A team member will respond soon.'
    )
    .addFields(
      { name: 'Auteur / Author', value: `${author}`, inline: true },
      { name: 'Type', value: `${def.label} / ${def.labelEn}`, inline: true },
      { name: 'Titre / Title', value: formData.title },
      { name: 'Sujet / Subject', value: formData.concerns },
      { name: 'Détails / Details', value: formData.description }
    )
    .setTimestamp()
    .setFooter({ text: `Ticket #${result.insertId}` });

  await channel.send({
    content: `${author} ${mentions}`.trim(),
    embeds: [embed],
    components: [buildTicketControls()],
    allowedMentions: { roles: def.mentionRoles.filter(Boolean), users: [author.id] },
  });

  return { channel, ticketId: result.insertId };
}

async function closeTicket(interaction) {
  const channel = interaction.channel;
  if (!isTicketChannel(channel)) {
    throw new Error('Ce bouton doit être utilisé dans un salon de ticket / Use this button inside a ticket channel.');
  }

  const channelId = String(channel.id);
  const ticket = await getOpenTicketByChannel(channelId);

  if (ticket) {
    await pool.query(`UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE id = ?`, [ticket.id]);
  }

  await channel.send(
    '🔒 **Ticket fermé / Ticket closed**\nCe salon sera supprimé dans 5 secondes… / This channel will be deleted in 5 seconds…'
  );
  setTimeout(() => channel.delete().catch(() => {}), 5000);

  return ticket;
}

async function claimTicket(interaction) {
  const channel = interaction.channel;
  if (!isTicketChannel(channel)) {
    throw new Error('Ce bouton doit être utilisé dans un salon de ticket / Use this button inside a ticket channel.');
  }

  const channelId = String(channel.id);
  const ticket = await getOpenTicketByChannel(channelId);

  if (ticket?.staff_discord_id) {
    throw new Error('Ce ticket est déjà pris en charge / This ticket is already claimed.');
  }

  if (ticket) {
    await pool.query(`UPDATE tickets SET staff_discord_id = ? WHERE id = ?`, [
      String(interaction.user.id),
      ticket.id,
    ]);
  }

  const staffLabel = `**${interaction.user.displayName}**`;

  const recent = await channel.messages.fetch({ limit: 10 });
  const ticketMessage = recent.find((m) => m.author.id === interaction.client.user.id && m.embeds.length > 0);

  if (ticketMessage) {
    const embed = EmbedBuilder.from(ticketMessage.embeds[0]);
    const fields = embed.data.fields?.filter((f) => f.name !== 'Staff / Pris en charge') ?? [];
    embed.setFields([
      ...fields,
      { name: 'Staff / Pris en charge', value: staffLabel, inline: true },
    ]);
    await ticketMessage.edit({
      embeds: [embed],
      components: [buildTicketControls({ claimed: true })],
    });
  }

  return ticket;
}

module.exports = {
  TICKET_TYPES,
  buildTicketPanel,
  buildTicketModal,
  createTicketChannel,
  closeTicket,
  claimTicket,
  isTicketChannel,
};
