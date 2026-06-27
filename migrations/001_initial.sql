CREATE TABLE IF NOT EXISTS users (
  discord_id VARCHAR(20) PRIMARY KEY,
  supabase_user_id VARCHAR(36) UNIQUE NULL,
  username VARCHAR(100) NULL,
  avatar_url VARCHAR(255) NULL,
  twitch_username VARCHAR(50) NULL,
  twitch_linked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('absence', 'match', 'evolution', 'form', 'dm', 'live', 'custom') NOT NULL,
  channel_key VARCHAR(50) NULL,
  discord_id VARCHAR(20) NULL,
  payload JSON NOT NULL,
  sent TINYINT(1) DEFAULT 0,
  sent_at TIMESTAMP NULL,
  discord_message_id VARCHAR(20) NULL,
  error TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_pending (sent, created_at)
);

CREATE TABLE IF NOT EXISTS absences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discord_id VARCHAR(20) NOT NULL,
  date_start DATE NULL,
  date_end DATE NULL,
  reason TEXT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_absences_discord (discord_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  scheduled_at DATETIME NULL,
  channel_key VARCHAR(50) DEFAULT 'matchs',
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  discord_id VARCHAR(20) NOT NULL,
  role_in_match VARCHAR(100) NULL,
  notified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_assignments_pending (notified)
);

CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_type ENUM('help', 'recruitment') NOT NULL,
  discord_channel_id VARCHAR(20) NOT NULL,
  author_discord_id VARCHAR(20) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  status ENUM('open', 'closed') DEFAULT 'open',
  staff_discord_id VARCHAR(20) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  INDEX idx_tickets_channel (discord_channel_id),
  INDEX idx_tickets_author (author_discord_id)
);

CREATE TABLE IF NOT EXISTS reaction_role_panels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  panel_key VARCHAR(50) NOT NULL,
  guild_id VARCHAR(20) NOT NULL,
  channel_id VARCHAR(20) NOT NULL,
  message_id VARCHAR(20) NOT NULL,
  emoji VARCHAR(100) NOT NULL,
  role_id VARCHAR(20) NOT NULL,
  label VARCHAR(100) NOT NULL,
  UNIQUE KEY uk_panel_message_emoji (message_id, emoji),
  INDEX idx_panel_guild (guild_id)
);

CREATE TABLE IF NOT EXISTS live_announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discord_id VARCHAR(20) NOT NULL,
  twitch_username VARCHAR(50) NOT NULL,
  stream_id VARCHAR(50) NOT NULL,
  announced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_stream (stream_id),
  INDEX idx_live_user (discord_id)
);
