/** Panels réaction-rôles Gowrax — bilingue FR/EN, une réaction = un rôle */

const LANGUAGE_PANEL = {
  key: 'langues',
  title: '🌍 CHOIX DE LA LANGUE / LANGUAGE CHOICE',
  description:
    '**À quoi ça sert ? / What is this?**\n' +
    'Choisis la langue des annonces que tu préfères recevoir sur le serveur.\n' +
    'Pick the language of announcements you prefer on the server.\n\n' +
    '**Comment ? / How?**\n' +
    'Réagis avec l\'emoji ci-dessous · React with the emoji below\n' +
    '_Re-clique sur ta réaction pour retirer le rôle · Click again to remove_',
  color: 0x5865f2,
  reactions: [
    {
      emoji: '🇫🇷',
      roleId: '1483160519966855270',
      label: 'Français',
      description:
        '**🇫🇷 Français**\n' +
        '• Annonces et messages importants en français\n' +
        '• Événements communautaires annoncés en FR\n' +
        '• Idéal si tu es plus à l\'aise en français\n\n' +
        '**🇫🇷 French**\n' +
        '• Important announcements in French\n' +
        '• Community events posted in FR\n' +
        '• Best if you\'re more comfortable in French',
    },
    {
      emoji: '🇬🇧',
      roleId: '1483160477109321921',
      label: 'English',
      description:
        '**🇬🇧 English**\n' +
        '• Important announcements in English\n' +
        '• Community events posted in EN\n' +
        '• Best if you\'re more comfortable in English\n\n' +
        '**🇬🇧 Anglais**\n' +
        '• Annonces et messages importants en anglais\n' +
        '• Événements communautaires annoncés en EN\n' +
        '• Idéal si tu es plus à l\'aise en anglais',
    },
  ],
};

const ESPORT_PANEL = {
  key: 'esport',
  title: '⚔️ SUIVI ESPORT / ESPORT UPDATES',
  description:
    '**À quoi ça sert ? / What is this?**\n' +
    'Reste informé de l\'activité compétitive de la **Team Gowrax**.\n' +
    'Stay updated on **Team Gowrax** competitive activity.\n\n' +
    '**Comment ? / How?**\n' +
    'Réagis pour activer les pings · React to enable pings',
  color: 0xed4245,
  reactions: [
    {
      emoji: '🔴',
      roleId: '1472735339796889784',
      label: 'Lives',
      description:
        '**🔴 Lives**\n' +
        '• Ping quand un membre de la team passe **en live** (Twitch, etc.)\n' +
        '• Ne rate plus les streams de la roster\n' +
        '• Uniquement les lives des joueurs/streamers de la team\n\n' +
        '**🔴 Lives**\n' +
        '• Get pinged when a team member goes **live**\n' +
        '• Never miss roster streams',
    },
    {
      emoji: '⚔️',
      roleId: '1472735427571220655',
      label: 'Matchs',
      description:
        '**⚔️ Matchs / Matches**\n' +
        '• Ping quand la Gowrax joue un **match officiel** ou un scrim\n' +
        '• Horaires, adversaires, liens de stream\n' +
        '• Pour suivre la team en compétition\n\n' +
        '**⚔️ Matches**\n' +
        '• Get pinged when Gowrax plays an **official match** or scrim\n' +
        '• Schedules, opponents, stream links',
    },
  ],
};

const INFO_PANEL = {
  key: 'infos',
  title: '📢 RESTEZ INFORMÉS / STAY INFORMED',
  description:
    '**À quoi ça sert ? / What is this?**\n' +
    'Personnalise les annonces que tu reçois sur le serveur.\n' +
    'Customize which server announcements you receive.\n\n' +
    '**Tu peux cumuler plusieurs rôles / You can pick multiple roles**',
  color: 0x57f287,
  reactions: [
    {
      emoji: '📢',
      roleId: '1472735238642995232',
      label: 'Annonces',
      description:
        '**📢 Annonces / Announcements**\n' +
        '• Infos importantes de la team et du serveur\n' +
        '• Changements de règles, nouvelles majeures\n' +
        '• Communications officielles Gowrax',
    },
    {
      emoji: '📅',
      roleId: '1472735294087233598',
      label: 'Events',
      description:
        '**📅 Events**\n' +
        '• Tournois, soirées communautaires, activités\n' +
        '• Événements spéciaux sur le serveur Discord\n' +
        '• Inscriptions et rappels d\'événements',
    },
    {
      emoji: '🎬',
      roleId: '1472735380569591828',
      label: 'Vidéos',
      description:
        '**🎬 Vidéos / Videos**\n' +
        '• Nouvelles vidéos **YouTube** de la team\n' +
        '• VOD, highlights, best-of, montages\n' +
        '• Contenu vidéo publié par Gowrax',
    },
    {
      emoji: '📝',
      roleId: '1499461791829463110',
      label: 'Posts',
      description:
        '**📝 Posts**\n' +
        '• Publications sur les **réseaux sociaux** (X, Instagram…)\n' +
        '• Threads, clips, partages importants\n' +
        '• Actu hors Discord',
    },
  ],
};

const ALL_PANELS = [LANGUAGE_PANEL, ESPORT_PANEL, INFO_PANEL];

module.exports = { LANGUAGE_PANEL, ESPORT_PANEL, INFO_PANEL, ALL_PANELS };
