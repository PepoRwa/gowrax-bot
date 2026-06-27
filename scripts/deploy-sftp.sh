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

for f in index.js deploy-commands.js package.json package-lock.json .env; do
  echo "  → $f"
  scp -P "$PORT" -i "$KEY" -o BatchMode=yes "$f" "$USER@$HOST:/$f" || true
done

sftp -P "$PORT" -i "$KEY" -o BatchMode=yes "$USER@$HOST" <<'SFTP_EOF'
put index.js
put deploy-commands.js
put package.json
put package-lock.json
put .env
put -r migrations
put src/config.js src/config.js
put -r src/commands src/commands
put -r src/data src/data
put -r src/db src/db
put -r src/events src/events
put -r src/loaders src/loaders
put -r src/services src/services
put -r src/utils src/utils
put -r scripts scripts
SFTP_EOF

echo "✅ Upload terminé."
echo ""
echo "Panel YorkHost → Console :"
echo "  npm install"
echo "  node deploy-commands.js"
echo "  puis Start / Restart"
