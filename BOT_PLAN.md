# Plan de développement — Gowrax Bot

> Document de référence avant implémentation.  
> À la fin du bot : voir `SITE_INTEGRATION.md` (guide pour l'agent site Next.js + Supabase).

---

## Stack technique

| Couche | Choix |
|---|---|
| Runtime | Node.js 20+ |
| Discord | discord.js v14 |
| Base de données | MySQL (mysql2) — YorkHost |
| Auth site | Supabase Discord OAuth (hors scope bot) |
| Twitch | API Helix (client credentials + app access token) |
| Hébergement bot | YorkHost (serveur Discord Bot) |

---

## Structure du projet (prévue)

```
gowrax-bot/
├── index.js                 # Point d'entrée, charge events + services
├── deploy-commands.js       # Enregistrement des slash commands
├── package.json
├── .env
├── migrations/
│   └── 001_initial.sql      # Schéma MySQL complet
├── src/
│   ├── config.js            # Lecture .env + validation
│   ├── db/
│   │   ├── pool.js          # Connexion MySQL
│   │   └── queries/         # Requêtes par domaine
│   ├── services/
│   │   ├── notifications.js # Poll + envoi Discord
│   │   ├── tickets.js       # Panel, création salon, modals
│   │   ├── reactionRoles.js # Panel réactions → rôles notif
│   │   └── twitchLive.js    # Surveillance lives
│   ├── events/
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   └── messageReactionAdd.js / Remove
│   └── commands/
│       ├── admin/
│       │   ├── send.js          # Envoyer un msg au nom du bot
│       │   ├── setup-notifs.js  # Déployer le panel réaction-rôles
│       │   └── setup-tickets.js # Déployer le panel tickets
│       └── user/
│           └── link-twitch.js   # Lier chaîne Twitch (si pas via site)
└── docs/
    ├── SETUP.md
    ├── BOT_PLAN.md            # ce fichier
    └── SITE_INTEGRATION.md    # rédigé en fin de bot
```

---

## Phases d'implémentation

### Phase 1 — Fondations
- [ ] `package.json`, dépendances (`discord.js`, `mysql2`, `dotenv`)
- [ ] `config.js` avec validation des variables obligatoires au démarrage
- [ ] Pool MySQL + migration auto au boot (`migrations/001_initial.sql`)
- [ ] Client Discord, event `ready`, logs propres
- [ ] `deploy-commands.js` pour les slash commands

### Phase 2 — Notifications site → Discord
- [ ] Service `notifications.js` : poll `notifications WHERE sent = 0`
- [ ] Routage par `type` + `channel_key` vers les bons channels `.env`
- [ ] Support DM (`type = 'dm'`) pour assignations match
- [ ] Marquer `sent = 1`, `sent_at`, `discord_message_id` en cas d'erreur → retry
- [ ] Templates d'embed par type : `absence`, `match`, `evolution`, `form`, `custom`

**Contrat site → bot :** le site INSERT dans `notifications`, le bot ne fait que lire.

### Phase 3 — Rôles réactions (pings serveur)
- [ ] Commande admin `/setup-notifs` : poste un embed + réactions (🔴 Absences, ⚽ Matchs, 📈 Evolution, etc.)
- [ ] `messageReactionAdd/Remove` : ajoute/retire le rôle Discord lié
- [ ] Table `reaction_role_panels` pour persister message_id → emoji → role_id
- [ ] À l'envoi d'une notif channel : ping du rôle correspondant (ex: `@Notif Absences`)

> Pas de table `notification_preferences` côté user : les prefs = les rôles Discord qu'il a via réactions.

### Phase 4 — Tickets
- [ ] Commande admin `/setup-tickets` : embed + bouton "Ouvrir un ticket"
- [ ] Clic bouton → modal (sujet, description, type de demande)
- [ ] Création channel dans `CATEGORY_TICKETS` : `ticket-{username}-{id}`
- [ ] Permissions : user + `ROLE_STAFF` (+ rôles mentionnés selon le type choisi dans le modal)
- [ ] Boutons dans le ticket : Fermer, Claim (staff)
- [ ] Persistance table `tickets` (discord_channel_id, author_discord_id, status, metadata JSON)

### Phase 5 — Twitch live
- [ ] Table `users.twitch_username` (lié via site ou `/link-twitch`)
- [ ] Poll Twitch API toutes les X minutes
- [ ] Filtre : membre du guild + a `ROLE_CASTER_STREAMER` + `twitch_username` renseigné
- [ ] Table `live_announcements` pour ne pas re-notifier le même stream
- [ ] Annonce dans un channel configurable (`CHANNEL_LIVES` à ajouter au `.env`)

### Phase 6 — Commandes admin
- [ ] `/send #channel message` — poster au nom du bot (staff only)
- [ ] `/link-twitch username` — fallback si liaison faite hors site

### Phase 7 — Documentation site
- [ ] `SITE_INTEGRATION.md` : schéma SQL complet, exemples INSERT, sync Supabase → MySQL, variables Next.js

---

## Schéma MySQL (version cible)

### `users` — pont Supabase ↔ Discord ↔ Twitch
```sql
discord_id         VARCHAR(20)  PRIMARY KEY
supabase_user_id   VARCHAR(36)  UNIQUE NULL      -- rempli par le SITE au login
username           VARCHAR(100)
avatar_url         VARCHAR(255)
twitch_username    VARCHAR(50)  NULL             -- sans le @
twitch_linked_at   TIMESTAMP NULL
created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at         TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### `notifications` — file d'attente bot
```sql
id                 INT AUTO_INCREMENT PRIMARY KEY
type               ENUM('absence','match','evolution','form','dm','live','custom')
channel_key        VARCHAR(50) NULL    -- 'absences' | 'matchs' | 'evolution' → map .env
discord_id         VARCHAR(20) NULL    -- cible DM ou auteur
payload            JSON NOT NULL       -- { title, description, fields, mention_role_id?, ... }
sent               TINYINT(1) DEFAULT 0
sent_at            TIMESTAMP NULL
discord_message_id VARCHAR(20) NULL
error              TEXT NULL
created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### `absences` — données métier (écrites par le site)
```sql
id, discord_id, date_start, date_end, reason, status, created_at
```

### `matches` — entraînements / matchs
```sql
id, title, scheduled_at, channel_key, metadata JSON, created_at
```

### `match_assignments` — assignations → déclenchent DM
```sql
id, match_id, discord_id, role_in_match, notified TINYINT(1) DEFAULT 0
```
> Le site peut soit INSERT direct dans `notifications` type `dm`, soit INSERT ici et le bot poll.

### `tickets`
```sql
id, discord_channel_id, author_discord_id, subject, status ENUM('open','closed'),
staff_discord_id NULL, metadata JSON, created_at, closed_at
```

### `reaction_role_panels`
```sql
id, guild_id, channel_id, message_id, emoji, role_id, label
```

### `live_announcements`
```sql
id, discord_id, twitch_username, stream_id, announced_at
```

---

## Flux par fonctionnalité

### Absence ETT (site → Discord)
```
Site: formulaire absence
  → INSERT absences (...)
  → INSERT notifications (type='absence', channel_key='absences', payload={...})
Bot: poll → embed dans CHANNEL_ABSENCES + ping rôle @Notif Absences
```

### Assignation match (site → DM)
```
Site: assigne joueur au match
  → INSERT notifications (type='dm', discord_id='...', payload={ match, role, date })
Bot: poll → user.send(embed)
```

### Évolution
```
Site: INSERT notifications (type='evolution', channel_key='evolution', payload={...})
Bot: CHANNEL_EVOLUTION + ping rôle concerné
```

### Live Twitch
```
Site ou /link-twitch: UPDATE users SET twitch_username WHERE discord_id=...
Bot: vérifie role CASTER + twitch_username → poll Twitch → annonce si live nouveau
```

### Tickets
```
Admin: /setup-tickets → panel
User: bouton → modal → channel créé + mentions rôles selon type
Staff: fermer / claim
```

---

## Variables `.env` — état actuel

| Variable | Statut |
|---|---|
| DISCORD_TOKEN | ✅ rempli |
| DISCORD_CLIENT_ID | ✅ rempli |
| DISCORD_GUILD_ID | ✅ rempli |
| DB_* | ⏳ à remplir |
| ROLE_CASTER_STREAMER | ⏳ |
| ROLE_STAFF | ⏳ |
| CHANNEL_* | ⏳ |
| CATEGORY_TICKETS | ⏳ |
| TWITCH_* | ⏳ |

**À ajouter probablement :**
- `CHANNEL_LIVES` — annonces de stream
- `ROLE_NOTIF_ABSENCES`, `ROLE_NOTIF_MATCHS`, `ROLE_NOTIF_EVOLUTION` — rôles pingés par les réactions

---

## Questions encore ouvertes

Réponds quand tu peux — le bot peut démarrer sans tout, mais ça affine le détail.

1. **Formulaires site** — Quels formulaires exactement au lancement ?
   - Absences ETT seulement ?
   - Assignation match ?
   - Autres (évolution = quoi concrètement : montée de rang, changement de roster ?) ?

2. **Channels matchs** — Un seul `CHANNEL_MATCHS` ou plusieurs (par équipe / par jeu) ?
   - Si plusieurs : le site enverra `channel_key` custom et on mappe en DB ou `.env` ?

3. **Ticket modal** — Quels "types de demande" et quels rôles mentionner pour chacun ?
   - Ex: `Staff`, `Coach`, `ETT Manager` → IDs de rôles ?

4. **Panel réactions** — Quels types de notif au départ ?
   - Absences, Matchs, Evolution, Autre ?

5. **Langue** — Tout en français (embeds, boutons, erreurs) ?

6. **Ancien bot** — Données à migrer (tickets.json, anciennes tables Supabase) ou fresh start ?

7. **CHANNEL_LIVES** — Un channel dédié pour les annonces live, ou reposter dans un channel général ?

---

## Livrable final pour l'agent site (`SITE_INTEGRATION.md`)

Ce doc sera rédigé **après** le bot et contiendra :

1. **Schéma SQL complet** avec commentaires colonne par colonne
2. **Diagramme** Supabase Auth → `users.discord_id` → tables métier
3. **Sync au login** (code Next.js App Router + Server Action)
4. **Exemples INSERT** pour chaque type de notification
5. **Variables `.env` site** (Supabase anon + MySQL serveur)
6. **Checklist Supabase** : créer projet, activer Discord provider, redirect URL
7. **Pas de dépendance bot ↔ Supabase** — tout passe par MySQL + `discord_id`

---

## Ordre de dev recommandé (quand `.env` prêt)

```
Phase 1 Fondations
    ↓
Phase 2 Notifications (cœur métier)
    ↓
Phase 3 Réaction-rôles
    ↓
Phase 4 Tickets
    ↓
Phase 5 Twitch
    ↓
Phase 6 Admin /send
    ↓
SITE_INTEGRATION.md
```

Estimation : on peut avoir un **MVP notif + DB** fonctionnel rapidement, puis itérer tickets / twitch / réactions.
