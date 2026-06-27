const { Events } = require('discord.js');
const {
  buildTicketModal,
  createTicketChannel,
  closeTicket,
  claimTicket,
} = require('../services/tickets');
const { isStaff } = require('../utils/permissions');
const { EPHEMERAL } = require('../utils/interaction');

async function safeReply(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (err) {
    if (err.code === 10062 || err.code === 40060) return;
    throw err;
  }
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        const { customId } = interaction;

        if (customId === 'ticket_open_help' || customId === 'ticket_open_recruitment') {
          const type = customId === 'ticket_open_help' ? 'help' : 'recruitment';
          return interaction.showModal(buildTicketModal(type));
        }

        if (customId === 'ticket_close' || customId.startsWith('ticket_close_')) {
          if (!isStaff(interaction.member)) {
            return safeReply(interaction, { content: '❌ Réservé au staff / Staff only.', ...EPHEMERAL });
          }
          await interaction.deferReply(EPHEMERAL);
          await closeTicket(interaction);
          return safeReply(interaction, { content: '✅ Ticket fermé / Ticket closed.' });
        }

        if (customId === 'ticket_claim' || customId.startsWith('ticket_claim_')) {
          if (!isStaff(interaction.member)) {
            return safeReply(interaction, { content: '❌ Réservé au staff / Staff only.', ...EPHEMERAL });
          }
          await interaction.deferReply(EPHEMERAL);
          await claimTicket(interaction);
          return safeReply(interaction, { content: '✅ Ticket pris en charge / Ticket claimed.' });
        }
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('ticket_modal_')) {
          const type = interaction.customId.replace('ticket_modal_', '');
          const formData = {
            title: interaction.fields.getTextInputValue('title'),
            concerns: interaction.fields.getTextInputValue('concerns'),
            description: interaction.fields.getTextInputValue('description'),
          };

          await interaction.deferReply(EPHEMERAL);
          const { channel } = await createTicketChannel(interaction, type, formData);
          await safeReply(interaction, { content: `✅ Ticket créé / Ticket created: ${channel}` });
        }
      }
    } catch (err) {
      console.error('❌ Interaction:', err.message);
      await safeReply(interaction, { content: `❌ ${err.message}`, ...EPHEMERAL });
    }
  },
};
