const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../events/supportTickets.js');
let code = fs.readFileSync(filePath, 'utf8');

// Replace standard key with service role key to bypass RLS
code = code.replace(
    "process.env.SUPABASE_KEY);",
    "process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);"
);

// Manually patch claim injection if it's missing
const claimTarget = "newRow.components[0].setDisabled(true).setLabel('Pris en charge');";
const claimInjection = `

                // --- SUPABASE: TICKET EN COURS (PENDING) ---
                try {
                    await supabase.from('tickets')
                        .update({ status: 'pending' })
                        .eq('channel_id', interaction.channel.id);
                } catch (dbErr) {
                    console.error("Supabase Error on Ticket Claim:", dbErr);
                }
                // -------------------------------------------
`;

if (!code.includes('SUPABASE: TICKET EN COURS')) {
    code = code.replace(claimTarget, claimTarget + claimInjection);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log("Fix appliqué avec succès !");
