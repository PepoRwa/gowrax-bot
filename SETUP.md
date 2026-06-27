# Gowrax Bot — Architecture & Setup

Ce guide explique comment connecter **Discord**, **MySQL YorkHost** et **Supabase Auth** sans te perdre entre les services.

---

## L'idée en une phrase

> **Supabase = qui est connecté sur le site** (login Discord)  
> **MySQL YorkHost = toutes les données partagées** (absences, matchs, notifications, tickets…)  
> **Le bot = lit MySQL, parle sur Discord** — il n'a pas besoin de Supabase.

---

## Schéma global

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SITE WEB                                      │
│                                                                         │
│   Utilisateur clique "Se connecter avec Discord"                      │
│         │                                                               │
│         ▼                                                               │
│   Supabase Auth  ──►  session + discord_id de l'utilisateur            │
│         │                                                               │
│         ▼                                                               │
│   API serveur (Next.js, etc.)  ──►  écrit dans MySQL                  │
│   (jamais les credentials MySQL dans le navigateur)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │  même base MySQL
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MYSQL (YorkHost)                                 │
│                                                                         │
│   users          → discord_id, supabase_user_id, pseudo…               │
│   notifications  → file d'attente pour le bot (sent = false)             │
│   absences       → formulaires absences ETT                              │
│   matches        → entraînements, assignations…                        │
│   tickets        → état des tickets Discord                              │
│   notif_prefs    → qui veut recevoir quoi                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │  poll toutes les 30s
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BOT DISCORD (YorkHost)                           │
│                                                                         │
│   Lit notifications non envoyées  →  poste sur le bon channel           │
│   Lit assignations match          →  envoie un DM                        │
│   Vérifie Twitch                  →  annonce si streamer en live       │
│   Gère les tickets                →  crée des channels privés          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Pourquoi le bot n'interroge PAS Supabase

| Question | Réponse |
|---|---|
| Le bot doit-il vérifier si quelqu'un est connecté sur le site ? | **Non.** Le bot agit sur Discord et sur MySQL. |
| Comment le site et le bot se "comprennent" ? | Via le **`discord_id`** — identifiant unique Discord, présent partout. |
| Qui fait le lien Supabase ↔ MySQL ? | **Le site**, au moment du login (voir ci-dessous). |

Supabase gère les **sessions web** (cookies, JWT, refresh token).  
MySQL gère les **données métier**.  
Le seul pont : quand un user se connecte sur le site, on enregistre son `discord_id` + `supabase_user_id` dans MySQL.

---

## Flux concret : login Discord sur le site

```
1. User clique "Login Discord" sur le site
2. Supabase redirige vers Discord OAuth
3. Discord renvoie vers Supabase avec le code
4. Supabase crée une session → tu récupères :
      - session.user.id          (UUID Supabase)
      - identities[0].id         (discord_id, ex: "123456789012345678")
      - user.user_metadata       (avatar, username…)
5. Ton API serveur fait un UPSERT dans MySQL :

   INSERT INTO users (discord_id, supabase_user_id, username, avatar_url)
   VALUES (?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE username = VALUES(username), ...
```

Ensuite, quand le user remplit un formulaire "absence ETT" :

```
1. Le site vérifie la session Supabase (user connecté ?)
2. Le site récupère son discord_id depuis la session
3. Le site INSERT dans MySQL :

   INSERT INTO absences (discord_id, date, reason, ...)
   INSERT INTO notifications (type, discord_id, payload, sent)
   VALUES ('absence', '123...', '{"date":"..."}', false)

4. Le bot poll `notifications WHERE sent = false`
5. Le bot envoie sur CHANNEL_ABSENCES
6. Le bot UPDATE notifications SET sent = true
```

---

## Setup Bot (maintenant)

### 1. Créer la base MySQL sur YorkHost

1. Va sur [game.yorkhost.fr](https://game.yorkhost.fr)
2. Sélectionne ton serveur (bot ou dédié)
3. Onglet **Databases** → **New Database**
4. Note : Host, Port, User, Password, Database name

### 2. Remplir le `.env`

```bash
cp .env.example .env
# Puis remplis toutes les valeurs
```

Variables obligatoires pour démarrer :

| Variable | Où la trouver |
|---|---|
| `DISCORD_TOKEN` | [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Token |
| `DISCORD_CLIENT_ID` | Même page → General → Application ID |
| `DISCORD_GUILD_ID` | Clic droit sur ton serveur Discord → Copier l'identifiant |
| `DB_*` | Panel YorkHost → Databases |
| `ROLE_CASTER_STREAMER` | Clic droit sur le rôle → Copier l'identifiant |
| `CHANNEL_*` | Clic droit sur le channel → Copier l'identifiant |
| `CATEGORY_TICKETS` | Clic droit sur la catégorie → Copier l'identifiant |
| `ROLE_STAFF` | Clic droit sur le rôle staff → Copier l'identifiant |
| `TWITCH_CLIENT_ID/SECRET` | [Twitch Dev Console](https://dev.twitch.tv/console/apps) |

### 3. Accès MySQL depuis le site web

Si ton site est hébergé **ailleurs** que YorkHost :

- Vérifie que MySQL accepte les connexions **distantes** (IP de ton serveur web)
- Sinon : expose une **API backend** hébergée chez YorkHost, ou demande à YorkHost d'ouvrir l'IP
- **Jamais** mettre `DB_PASSWORD` dans le frontend (pas de `VITE_DB_*`)

---

## Setup Site (à faire ensuite)

> Section à compléter quand le schéma MySQL et le bot seront en place.

### Stack recommandée

- **Next.js** (ou équivalent) avec API Routes / Server Actions
- **Supabase Auth** : provider Discord uniquement
- **mysql2** côté serveur pour parler à MySQL YorkHost

### Variables d'environnement site

```env
# Supabase — côté client (OK à exposer)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # clé "anon", PAS service_role

# Supabase — côté serveur uniquement (optionnel, selon architecture)
# SUPABASE_SERVICE_ROLE_KEY=   # seulement si ton API en a besoin

# MySQL — SERVEUR UNIQUEMENT, jamais NEXT_PUBLIC_
DB_HOST=mysql.yorkhost.fr
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
```

### Configurer Discord OAuth dans Supabase

1. [Discord Developer Portal](https://discord.com/developers/applications) → ton app
2. OAuth2 → Redirects → ajoute :
   ```
   https://<ton-projet>.supabase.co/auth/v1/callback
   ```
3. Supabase Dashboard → Authentication → Providers → Discord
4. Colle Client ID + Client Secret Discord
5. Active le provider

### Récupérer le discord_id côté site (exemple)

```typescript
// Après login, côté serveur
const { data: { user } } = await supabase.auth.getUser()

const discordIdentity = user?.identities?.find(i => i.provider === 'discord')
const discordId = discordIdentity?.id  // "123456789012345678"

// Puis sync vers MySQL
await db.query(
  `INSERT INTO users (discord_id, supabase_user_id, username)
   VALUES (?, ?, ?)
   ON DUPLICATE KEY UPDATE username = VALUES(username)`,
  [discordId, user.id, user.user_metadata?.full_name]
)
```

### Autorisation sur le site

Pas besoin que le bot vérifie Supabase. Côté site :

```typescript
// Avant d'écrire une absence, vérifier que l'user modifie SES données
if (formDiscordId !== sessionDiscordId && !isStaff(session)) {
  throw new Error('Non autorisé')
}
```

Pour le staff : tu peux checker un rôle Discord via l'API Discord (côté serveur) ou une colonne `is_staff` dans MySQL synchronisée manuellement.

---

## Schéma MySQL (aperçu — sera créé avec le bot)

```sql
-- Lien Supabase ↔ Discord ↔ app
CREATE TABLE users (
  discord_id        VARCHAR(20) PRIMARY KEY,
  supabase_user_id  VARCHAR(36) UNIQUE,
  username          VARCHAR(100),
  avatar_url        VARCHAR(255),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File d'attente notifications → bot
CREATE TABLE notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  type        ENUM('absence','match','evolution','dm','custom') NOT NULL,
  discord_id  VARCHAR(20),          -- cible DM ou auteur
  channel_key VARCHAR(50),          -- 'absences', 'matchs'…
  payload     JSON NOT NULL,        -- contenu du message
  sent        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Préférences notifications par membre
CREATE TABLE notification_preferences (
  discord_id  VARCHAR(20) PRIMARY KEY,
  absences    BOOLEAN DEFAULT TRUE,
  matchs      BOOLEAN DEFAULT TRUE,
  evolution   BOOLEAN DEFAULT TRUE
);
```

---

## Récap : qui fait quoi ?

| Besoin | Service |
|---|---|
| Login Discord sur le site | **Supabase Auth** |
| Stocker absences, matchs, forms | **MySQL YorkHost** |
| Envoyer notifs Discord | **Bot** (lit MySQL) |
| DM assignation match | **Bot** (lit MySQL) |
| Détecter streamer en live | **Bot** (Twitch API + rôle Discord) |
| Tickets Discord | **Bot** (MySQL pour persistance) |
| Lier un compte site à un membre Discord | **`discord_id`** dans table `users` |

---

## Prochaines étapes

1. **Toi** : remplis le `.env` (copie depuis `.env.example`)
2. **Moi** : je code le bot + le schéma SQL complet
3. **Ensuite** : on complète la section "Setup Site" avec ton stack exact (Next.js ? autre ?)

---

## FAQ

**Je garde Supabase pour autre chose que l'auth ?**  
Possible (Storage, Realtime…), mais pour ce projet une seule source de vérité métier = MySQL évite la confusion.

**Le bot peut utiliser la service_role Supabase ?**  
Techniquement oui, mais ça ajoute une dépendance inutile. MySQL suffit.

**Et si je veux que le site lise des données en temps réel ?**  
Polling court côté site, ou WebSocket custom. Supabase Realtime ne marchera pas sur MySQL YorkHost.

**Mon ancien `.env` avait `VITE_SUPABASE_*` — c'est pour le site, pas le bot.**  
Le bot n'a pas besoin de ces variables.
