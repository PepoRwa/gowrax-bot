const config = require('../config');

function isStaff(member) {
  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;
  return member.roles.cache.has(config.roles.staff);
}

module.exports = { isStaff };
