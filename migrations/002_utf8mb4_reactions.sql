-- Assure le support des emojis dans reaction_role_panels
ALTER TABLE reaction_role_panels CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
