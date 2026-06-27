const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { deployAllPanels } = require('../services/reactionRoles');
const { isStaff } = require('../utils/permissions');
const { EPHEMERAL } = require('../utils/interaction');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-panels')
    .setDescription('Déploie les panels de rôles réactions (langues, esport, infos)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('Channel des rôles (défaut: channel actuel)')
        .addChannelTypes(ChannelType.GuildText)
    )
    .addBooleanOption((opt) =>
      opt
        .setName('clear')
        .setDescription('Supprimer les anciens panels du bot dans ce channel (défaut: oui)')
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Réservé au staff / Staff only.', ...EPHEMERAL });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const clear = interaction.options.getBoolean('clear') ?? true;

    await interaction.deferReply(EPHEMERAL);

    await deployAllPanels(channel, { clear });

    await interaction.editReply({
      content:
        `✅ Panels déployés dans ${channel}\n` +
        '🌍 Langues · ⚔️ Esport · 📢 Infos\n\n' +
        '_Les membres peuvent réagir pour obtenir les rôles._',
    });
  },
};
