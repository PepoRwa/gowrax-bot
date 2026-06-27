const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { buildTicketPanel } = require('../services/tickets');
const { isStaff } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-tickets')
    .setDescription('Déploie le panel de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('Channel où poster le panel (défaut: channel actuel)')
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Réservé au staff.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    await channel.send(buildTicketPanel());

    await interaction.reply({
      content: `✅ Panel tickets déployé dans ${channel}.`,
      ephemeral: true,
    });
  },
};
