const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL; // On prend VITE_SUPABASE_URL ou SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Clé Secrète / Service Role ! (PAS la clé Anon)

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Attention: Les variables d'environnement Supabase ne sont pas configurées dans le bot.");
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

module.exports = supabase;
