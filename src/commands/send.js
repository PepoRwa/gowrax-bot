const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { isStaff } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('send')
    .setDescription('Envoie un message au nom du bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption((opt) =>
      opt.setName('channel').setDescription('Channel cible').addChannelTypes(ChannelType.GuildText).setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('message').setDescription('Contenu du message').setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Réservé au staff.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    await channel.send(message);
    await interaction.reply({ content: `✅ Message envoyé dans ${channel}.`, ephemeral: true });
  },
};
