require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('notifications').insert([{
    title: 'Test Bot Discord',
    message: 'Coucou c le bot',
    type: 'global',
    target_roster: 'Tous'
  }]);
  console.log('Insert:', data ? data : error);
}
test();
