const { Events } = require('discord.js');
const { handleReaction } = require('../services/reactionRoles');

module.exports = {
  name: Events.MessageReactionRemove,
  async execute(reaction, user) {
    try {
      await handleReaction(reaction, user, false);
    } catch (err) {
      console.error('❌ Reaction remove:', err.message);
    }
  },
};
