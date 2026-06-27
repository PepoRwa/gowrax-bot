# Site Web — Intégration MySQL + Supabase Auth

> Guide pour l'agent / dev qui construit le site Next.js.  
> Le bot est la source de vérité pour le schéma MySQL (`migrations/001_initial.sql`).

---

## Principe

| Service | Rôle |
|---|---|
| **Supabase Auth** | Login Discord sur le site uniquement |
| **MySQL YorkHost** | Toutes les données métier + file de notifications vers le bot |
| **Bot Discord** | Lit MySQL, envoie sur Discord — **ne lit pas Supabase** |

**Clé de liaison : `discord_id`** (identifiant Discord numérique, ex. `123456789012345678`).

---

## Variables `.env` du site (Next.js)

```env
# Client — OK à exposer
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Serveur uniquement — JAMAIS NEXT_PUBLIC_
DB_HOST=83.150.218.23
DB_PORT=3306
DB_USER=u0_xxxx
DB_PASSWORD="..."
DB_NAME=s0_Gowraxbot
```

---

## Setup Supabase (nouveau projet)

1. Créer un projet Supabase (nouvelle orga si besoin)
2. **Authentication → Providers → Discord** : activer, coller Client ID + Secret de l'app Discord
3. **Redirect URL** dans Discord Developer Portal :
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
4. Ne pas utiliser `service_role` côté client navigateur

### Type d'app Twitch (pour info bot, pas le site)
Application **Confidentielle** si tu génères un secret côté serveur. Pour le bot qui poll l'API Helix en server-to-server, c'est le bon choix.

---

## Sync utilisateur au login

Après `signInWithOAuth({ provider: 'discord' })`, côté **serveur** :

```typescript
import { createClient } from '@/utils/supabase/server'
import pool from '@/lib/mysql' // mysql2/promise

export async function syncUserToMysql() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const discord = user.identities?.find((i) => i.provider === 'discord')
  const discordId = discord?.id
  if (!discordId) throw new Error('Pas de compte Discord lié')

  await pool.execute(
    `INSERT INTO users (discord_id, supabase_user_id, username, avatar_url)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       supabase_user_id = VALUES(supabase_user_id),
       username = VALUES(username),
       avatar_url = VALUES(avatar_url)`,
    [
      discordId,
      user.id,
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      user.user_metadata?.avatar_url ?? null,
    ]
  )

  return discordId
}
```

Appeler `syncUserToMysql()` après chaque login et dans un middleware de session.

---

## Tables MySQL — référence

### `users`
| Colonne | Type | Description |
|---|---|---|
| `discord_id` | VARCHAR(20) PK | ID Discord |
| `supabase_user_id` | VARCHAR(36) | UUID Supabase Auth |
| `twitch_username` | VARCHAR(50) | Lié via site ou `/link-twitch` |
| `username` | VARCHAR(100) | Pseudo affiché |
| `avatar_url` | VARCHAR(255) | Avatar |

### `notifications` — file d'attente bot

Le site **INSERT**, le bot **lit et marque `sent = 1`**.

| Colonne | Type | Description |
|---|---|---|
| `type` | enum | `absence`, `match`, `evolution`, `form`, `dm`, `custom` |
| `channel_key` | varchar | `absences`, `matchs`, `lives`… → map vers channels Discord |
| `discord_id` | varchar | Cible pour les `dm` |
| `payload` | JSON | Contenu du message (voir exemples) |
| `sent` | tinyint | 0 = en attente, 1 = envoyé |

### `absences`, `matches`, `match_assignments`
Données métier — le site écrit, le bot peut lire pour enrichir les notifs.

### `tickets`
Géré par le bot Discord — le site n'a pas besoin d'y toucher pour l'instant.

---

## Exemples INSERT — notifications

### Absence ETT → channel absences

```sql
INSERT INTO absences (discord_id, date_start, date_end, reason)
VALUES ('123456789012345678', '2026-06-28', '2026-06-30', 'Indisponible');

INSERT INTO notifications (type, channel_key, discord_id, payload)
VALUES (
  'absence',
  'absences',
  '123456789012345678',
  JSON_OBJECT(
    'title', '📋 Nouvelle absence ETT',
    'description', 'Un membre a déclaré une absence.',
    'fields', JSON_ARRAY(
      JSON_OBJECT('name', 'Membre', 'value', '<@123456789012345678>', 'inline', true),
      JSON_OBJECT('name', 'Du', 'value', '28/06/2026', 'inline', true),
      JSON_OBJECT('name', 'Au', 'value', '30/06/2026', 'inline', true),
      JSON_OBJECT('name', 'Raison', 'value', 'Indisponible', 'inline', false)
    )
  )
);
```

Le bot ping automatiquement le rôle configuré pour `channel_key = 'absences'` si `ROLE_NOTIF_ABSENCES` est défini.

### Match Gowrax → channel matchs + ping @Matchs

```sql
INSERT INTO matches (title, scheduled_at, channel_key, metadata)
VALUES ('Gowrax vs Team X', '2026-07-01 20:00:00', 'matchs', JSON_OBJECT('opponent', 'Team X'));

INSERT INTO notifications (type, channel_key, payload)
VALUES (
  'match',
  'matchs',
  JSON_OBJECT(
    'title', '⚔️ La Gowrax joue un match !',
    'description', '**Gowrax vs Team X**\n📅 1er juillet 2026 à 20h',
    'color', 2371685
  )
);
```

→ Envoyé dans `CHANNEL_MATCHS` avec ping du rôle **Matchs** (`1472735427571220655`).

### DM assignation joueur

```sql
INSERT INTO notifications (type, discord_id, payload)
VALUES (
  'dm',
  '123456789012345678',
  JSON_OBJECT(
    'title', '⚔️ Tu es assigné à un match',
    'description', 'Tu as été sélectionné pour **Gowrax vs Team X** le 01/07 à 20h.',
    'fields', JSON_ARRAY(
      JSON_OBJECT('name', 'Rôle', 'value', 'Titulaire', 'inline', true)
    )
  )
);
```

### Notification custom (annonce, event, etc.)

```sql
INSERT INTO notifications (type, channel_key, payload)
VALUES (
  'custom',
  'lives',
  JSON_OBJECT(
    'title', '📢 Annonce importante',
    'description', 'Contenu libre…',
    'mention_role_id', '1472735238642995232'
  )
);
```

`channel_key` disponibles côté bot :

| `channel_key` | Channel `.env` | Rôle pingé par défaut |
|---|---|---|
| `absences` | `CHANNEL_ABSENCES` | `ROLE_NOTIF_ABSENCES` (si défini) |
| `matchs` | `CHANNEL_MATCHS` | Rôle Matchs |
| `lives` | `CHANNEL_LIVES` | Rôle Lives |
| `evolution` | `CHANNEL_EVOLUTION` | — |

---

## Lier Twitch depuis le site

```sql
UPDATE users
SET twitch_username = 'monpseudo', twitch_linked_at = NOW()
WHERE discord_id = '123456789012345678';
```

Conditions pour annonce live :
1. `twitch_username` renseigné
2. Membre du serveur avec rôle **Caster/Streamer**
3. `TWITCH_CLIENT_SECRET` configuré sur le bot

---

## Sécurité site

- Vérifier la session Supabase avant tout INSERT
- Comparer `discord_id` session === `discord_id` du formulaire
- MySQL credentials **uniquement** dans API Routes / Server Actions
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` au client

```typescript
// Exemple garde-fou
if (formDiscordId !== sessionDiscordId && !await isStaff(sessionDiscordId)) {
  throw new Error('Non autorisé')
}
```

---

## Checklist intégration

- [ ] Projet Supabase créé, Discord OAuth activé
- [ ] Redirect URL Discord configurée
- [ ] `.env` site avec Supabase anon + MySQL serveur
- [ ] `syncUserToMysql()` au login
- [ ] Formulaires INSERT dans `notifications` + tables métier
- [ ] Tester : INSERT notif test → vérifier réception Discord sous 30s

### Test rapide depuis MySQL

```sql
INSERT INTO notifications (type, channel_key, payload)
VALUES ('custom', 'matchs', JSON_OBJECT('title', 'Test', 'description', 'Si tu vois ça, la liaison site→bot→Discord marche.'));
```

---

## Ce que le site n'a PAS à faire

- Gérer les tickets Discord (bot only)
- Gérer les panels réaction-rôles (bot only, `/setup-panels`)
- Appeler l'API Discord directement pour les notifs (passer par `notifications`)
- Parler à Supabase depuis le bot
