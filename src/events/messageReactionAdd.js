const { Events } = require('discord.js');
const { handleReaction } = require('../services/reactionRoles');

module.exports = {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    try {
      await handleReaction(reaction, user, true);
    } catch (err) {
      console.error('❌ Reaction add:', err.message);
    }
  },
};
