const { SlashCommandBuilder } = require('discord.js');
const { linkTwitch } = require('../services/twitchLive');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link-twitch')
    .setDescription('Lie ton compte Twitch pour les annonces de live')
    .addStringOption((opt) =>
      opt
        .setName('pseudo')
        .setDescription('Ton pseudo Twitch (sans @)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    if (!member.roles.cache.has(config.roles.casterStreamer)) {
      return interaction.reply({
        content: `❌ Tu dois avoir le rôle <@&${config.roles.casterStreamer}> pour lier une chaîne Twitch.`,
        ephemeral: true,
      });
    }

    const pseudo = interaction.options.getString('pseudo');
    const linked = await linkTwitch(interaction.user.id, pseudo);

    await interaction.reply({
      content: `✅ Chaîne Twitch liée : **${linked}**\nLes annonces live seront envoyées quand tu seras en direct.`,
      ephemeral: true,
    });
  },
};
