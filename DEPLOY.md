# Déploiement sur YorkHost

## ⚠️ SSH / SFTP ≠ `.env` (c'est quoi quoi ?)

Ce sont **3 choses différentes** :

| | À quoi ça sert | Où c'est |
|---|---|---|
| **SFTP / SSH** | Accéder au **serveur** pour uploader le code du bot (`index.js`, `src/`, etc.) | Panel YorkHost + ton mot de passe **panel** |
| **`.env` → `DISCORD_*`** | Token du bot Discord | Discord Developer Portal |
| **`.env` → `DB_*`** | Base **MySQL** (données, notifications) | Panel → Databases |

```
Toi (Mac)
   │
   ├── SFTP/SSH ──────────► Serveur bot (83.150.218.90)
   │                        └── tu déposes le code ici, npm install, npm start
   │
   └── Le bot une fois lancé ──► MySQL (83.150.218.23:3306)
                                  └── DB_HOST, DB_USER… dans .env
```

Le `.env` **ne sert pas** à te connecter en SSH. Il est **sur le serveur** une fois le code uploadé, pour que le bot parle à Discord et MySQL.

---

## Tes infos YorkHost (SFTP — le plus simple)

| Champ | Valeur |
|---|---|
| **Adresse** | `game-node05.yorkhost.fr` |
| **Port** | `2022` |
| **Protocole** | **SFTP** (pas FTP / FTPS) |
| **Username** | `antoinef30350@gmail.com.5ce0f7f3` |
| **Mot de passe** | Celui de ta **connexion au panel** game.yorkhost.fr |

### Se connecter en SFTP (Terminal Mac)

```bash
sftp -P 2022 antoinef30350@gmail.com.5ce0f7f3@game-node05.yorkhost.fr
```

→ Il demande ton mot de passe **panel**, puis tu es dans le dossier du serveur bot.

### Uploader les fichiers (une fois connecté en SFTP)

```bash
# Depuis ton Mac, dans un autre terminal (pas dans sftp) :
cd ~/Documents/gowrax-bot

rsync -avz --exclude node_modules --exclude .git \
  -e "sftp -P 2022" \
  ./ antoinef30350@gmail.com.5ce0f7f3@game-node05.yorkhost.fr:/
```

Ou avec **FileZilla** / **Cyberduck** :
- Hôte : `game-node05.yorkhost.fr`
- Port : `2022`
- User : `antoinef30350@gmail.com.5ce0f7f3`
- Mot de passe : panel
- Protocole : SFTP

---

## SSH (alternative avec clé)

Tu as aussi : `83.150.218.90:26055` (port **26055**, pas 22).

1. Crée ta clé (une fois) :
```bash
ssh-keygen -t ed25519 -C "yorkhost-gowrax" -f ~/.ssh/id_ed25519_yorkhost
cat ~/.ssh/id_ed25519_yorkhost.pub
```
→ Colle la ligne dans **Account settings → Add SSH Key** (panel YorkHost)

2. Connecte-toi :
```bash
ssh -p 26055 -i ~/.ssh/id_ed25519_yorkhost antoinef30350@gmail.com.5ce0f7f3@83.150.218.90
```

> Si "Hostname unknown" dans le panel, utilise l'**IP + port** ci-dessus, ou le hostname SFTP `game-node05.yorkhost.fr` avec le bon port.

---

## Vue d'ensemble

| Étape | Où |
|---|---|
| 1. Clé SSH | Sur ton Mac (une fois) |
| 2. Upload du code | SSH / SFTP → serveur YorkHost |
| 3. Install + start | Console panel ou SSH |
| 4. Panels Discord | Commandes slash sur le serveur |

---

## 1. Créer ta clé SSH (Mac)

YorkHost demande la **clé publique** (`.pub`), jamais la privée.

Ouvre le Terminal et lance :

```bash
ssh-keygen -t ed25519 -C "yorkhost-gowrax" -f ~/.ssh/id_ed25519_yorkhost
```

- Appuie sur **Entrée** pour la passphrase (ou mets-en une si tu veux plus de sécurité)
- Ça crée deux fichiers :
  - `~/.ssh/id_ed25519_yorkhost` → **privée, ne jamais partager**
  - `~/.ssh/id_ed25519_yorkhost.pub` → **celle-ci va dans le panel**

Affiche la clé publique à copier :

```bash
cat ~/.ssh/id_ed25519_yorkhost.pub
```

Tu obtiens une ligne du genre :
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... yorkhost-gowrax
```

→ Colle **toute la ligne** dans le panel YorkHost : **Add SSH Key → Public key → Add SSH Key**

---

## 2. Se connecter en SSH

Les infos de connexion sont dans le panel (host, port, user). Exemple :

```bash
ssh -i ~/.ssh/id_ed25519_yorkhost -p 22 utilisateur@ton-host.yorkhost.fr
```

Pour ne pas retaper `-i` à chaque fois, ajoute dans `~/.ssh/config` :

```
Host yorkhost-gowrax
  HostName ton-host.yorkhost.fr
  User utilisateur-du-panel
  Port 22
  IdentityFile ~/.ssh/id_ed25519_yorkhost
```

Puis : `ssh yorkhost-gowrax`

---

## 3. Déployer le code (depuis ton Mac)

Dans le dossier du projet sur ton Mac :

```bash
cd ~/Documents/gowrax-bot
```

### Option A — rsync (recommandé)

Remplace `yorkhost-gowrax` et le chemin distant selon ton panel (souvent `/home/container/`) :

```bash
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  -e "ssh -i ~/.ssh/id_ed25519_yorkhost -p 22" \
  ./ utilisateur@ton-host.yorkhost.fr:/home/container/
```

### Option B — SFTP (FileZilla / Cyberduck)

Même fichiers, sans `node_modules/` ni `.git/`.

---

## 4. Installer et démarrer (SSH ou console panel)

Une fois les fichiers sur le serveur :

```bash
cd /home/container
npm install
```

Puis **Start** dans le panel. Les commandes slash se synchronisent **automatiquement** au démarrage.

### Logs attendus

```
✅ 4 commande(s) slash synchronisée(s)
✅ Migration appliquée : 001_initial.sql
✅ Connecté en tant que Team Gowrax#xxxx
🔔 Poller notifications actif (30s)
⚠️  Twitch désactivé — TWITCH_CLIENT_SECRET manquant   ← normal pour l'instant
```

---

## 5. Setup des panels Discord (slash commands)

Une fois le bot en ligne, sur ton serveur Discord :

### Panels rôles réactions (langues, esport, infos)

Dans le channel dédié aux rôles (ex. `#rôles`) :

```
/setup-panels
```

Ou en ciblant un channel :

```
/setup-panels channel:#rôles
```

→ Poste **3 messages** avec réactions :
| Panel | Réactions |
|---|---|
| 🌍 Langues | 🇫🇷 Français · 🇬🇧 Anglais |
| ⚔️ Esport | 🔴 Lives · ⚔️ Matchs |
| 📢 Infos | 📢 Annonces · 📅 Events · 🎬 Vidéos · 📝 Posts |

Les membres réagissent → le bot ajoute/retire le rôle.

### Panel tickets

Dans le channel d'accueil tickets (ex. `#ouvrir-un-ticket`) :

```
/setup-tickets
```

Ou :

```
/setup-tickets channel:#ouvrir-un-ticket
```

→ Un message avec 2 boutons :
- **🆘 Demander de l'aide** → modal → salon privé + mention staff
- **📋 Recrutement** → modal → salon privé + mention recruteurs

> Ces commandes sont réservées aux **admins / staff** (permission Manage Server ou rôle staff configuré).

### Commandes utiles ensuite

| Commande | Usage |
|---|---|
| `/send` | Poster un message au nom du bot (staff) |
| `/link-twitch pseudo` | Lier sa chaîne Twitch (rôle Caster requis) |

---

## 6. Tester que tout marche

### Test notification (SSH ou local)

```bash
node scripts/test-notification.js matchs
```

→ Message de test dans le channel matchs/lives sous 30s.

### Test tickets

Clique sur un bouton du panel → remplis le modal → vérifie que le salon privé se crée.

### Test réactions

Réagis sur un panel → vérifie que le rôle apparaît dans ta liste de rôles.

---

## Mises à jour (redéploiement)

```bash
# 1. Upload (rsync)
rsync -avz --exclude node_modules --exclude .git -e "ssh -i ~/.ssh/id_ed25519_yorkhost" ./ yorkhost-gowrax:/home/container/

# 2. SSH
ssh yorkhost-gowrax
cd /home/container
npm install          # si package.json a changé
node deploy-commands.js   # optionnel en local — auto au boot sur le serveur
# Redémarrer via panel (Stop → Start)
```

---

## Sécurité

- **Jamais** coller la clé **privée** (`id_ed25519_yorkhost` sans `.pub`) dans le panel ou le chat
- **Jamais** partager le `.env` (tokens Discord, DB…)
- Un seul bot actif à la fois avec le même `DISCORD_TOKEN` (coupe le local si YorkHost tourne)

---

## Checklist

- [ ] Clé SSH créée + publique ajoutée au panel YorkHost
- [ ] Code uploadé (`rsync` ou SFTP)
- [ ] `npm install` + **Start** (deploy commands auto)
- [ ] Bot démarré, logs OK
- [ ] `/setup-panels` dans le channel rôles
- [ ] `/setup-tickets` dans le channel tickets
- [ ] Test : `node scripts/test-notification.js matchs`
