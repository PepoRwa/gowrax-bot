#!/bin/bash
# Upload gowrax-bot vers YorkHost (SFTP — pas de shell distant)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY="$HOME/.ssh/id_ed25519_yorkhost"
HOST="game-node05.yorkhost.fr"
PORT="2022"
USER="antoinef30350@gmail.com.5ce0f7f3"

cd "$ROOT"

echo "⏳ Upload vers $USER@$HOST ..."

sftp -P "$PORT" -i "$KEY" -o BatchMode=yes "$USER@$HOST" <<'SFTP_EOF'
put index.js
put deploy-commands.js
put package.json
put package-lock.json
put .env
put migrations/001_initial.sql migrations/001_initial.sql
put migrations/003_sync_roles.sql migrations/003_sync_roles.sql
put migrations/004_site_users.sql migrations/004_site_users.sql
put migrations/005_VODS.sql migrations/005_VODS.sql
put src/services/syncRoles.js src/services/syncRoles.js
put src/events/guildMemberUpdate.js src/events/guildMemberUpdate.js
put src/events/guildMemberRemove.js src/events/guildMemberRemove.js
put src/config.js src/config.js
put src/commands/link-twitch.js src/commands/link-twitch.js
put src/commands/send.js src/commands/send.js
put src/commands/setup-panels.js src/commands/setup-panels.js
put src/commands/setup-tickets.js src/commands/setup-tickets.js
put src/data/reactionPanels.js src/data/reactionPanels.js
put src/db/migrate.js src/db/migrate.js
put src/db/pool.js src/db/pool.js
put src/events/interactionCreate.js src/events/interactionCreate.js
put src/events/messageReactionAdd.js src/events/messageReactionAdd.js
put src/events/messageReactionRemove.js src/events/messageReactionRemove.js
put src/events/ready.js src/events/ready.js
put src/loaders/commands.js src/loaders/commands.js
put src/loaders/events.js src/loaders/events.js
put src/services/notifications.js src/services/notifications.js
put src/services/reactionRoles.js src/services/reactionRoles.js
put src/services/tickets.js src/services/tickets.js
put src/services/twitchLive.js src/services/twitchLive.js
put src/utils/presence.js src/utils/presence.js
put src/utils/embeds.js src/utils/embeds.js
put src/utils/interaction.js src/utils/interaction.js
put src/utils/permissions.js src/utils/permissions.js
put scripts/deploy-sftp.sh scripts/deploy-sftp.sh
put scripts/test-notification.js scripts/test-notification.js
SFTP_EOF

echo "✅ Upload terminé — Restart le serveur dans le panel."
