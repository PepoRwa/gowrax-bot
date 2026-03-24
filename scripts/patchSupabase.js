const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../events/supportTickets.js');
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('@supabase/supabase-js')) {
    code = code.replace(
        "module.exports = {",
        "const { createClient } = require('@supabase/supabase-js');\nconst supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);\n\nmodule.exports = {"
    );
}

const createTarget = "components: [row] \n                    });";
const createInjection = `

                    // --- SUPABASE: CREATION TICKET ---
                    try {
                        const ticketSubject = isRecruit ? 'Recrutement: ' + interaction.fields.getTextInputValue('role') : interaction.fields.getTextInputValue('subject');
                        const ticketMessage = isRecruit ? interaction.fields.getTextInputValue('motivations') : interaction.fields.getTextInputValue('description');
                        
                        await supabase.from('tickets').insert([{ 
                            discord_user: interaction.user.username, 
                            subject: ticketSubject, 
                            status: 'open', 
                            latest_message: ticketMessage,
                            channel_id: ticketChannel.id
                        }]);
                    } catch (dbErr) {
                        console.error("Supabase Error on Ticket Create:", dbErr);
                    }
                    // ---------------------------------
`;

if (!code.includes('SUPABASE: CREATION TICKET')) {
    code = code.replace(createTarget, createTarget + createInjection);
}

const closeTarget = "setTimeout(() => interaction.channel.delete().catch(() => null), 5000);";
const closeInjection = `

                // --- SUPABASE: FERMETURE TICKET ---
                try {
                    await supabase.from('tickets')
                        .update({ status: 'closed' })
                        .eq('channel_id', interaction.channel.id);
                } catch (dbErr) {
                    console.error("Supabase Error on Ticket Close:", dbErr);
                }
                // ----------------------------------
`;

if (!code.includes('SUPABASE: FERMETURE TICKET')) {
    code = code.replace(closeTarget, closeTarget + closeInjection);
}

const claimTarget = "await interaction.reply({ content: `✅ Ticket pris en charge par <@${interaction.user.id}>.` });";
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
console.log("Les injections Supabase ont ete patchees avec succes !");
