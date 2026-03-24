const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../events/supportTickets.js');
let code = fs.readFileSync(filePath, 'utf8');

// Update Ticket Creation
code = code.replace(
    "await supabase.from('tickets').insert([{",
    "const { data, error } = await supabase.from('tickets').insert([{"
);
code = code.replace(
    "channel_id: ticketChannel.id\n                        }]);",
    "channel_id: ticketChannel.id\n                        }]);\n                        if (error) console.error('SUPABASE DB ERROR (CREATE):', error);"
);

// Update Ticket Close
code = code.replace(
    "await supabase.from('tickets')\n                        .update({ status: 'closed' })",
    "const { error } = await supabase.from('tickets')\n                        .update({ status: 'closed' })"
);
code = code.replace(
    ".eq('channel_id', interaction.channel.id);",
    ".eq('channel_id', interaction.channel.id);\n                    if (error) console.error('SUPABASE DB ERROR (CLOSE):', error);"
);

// Update Ticket Claim
code = code.replace(
    "await supabase.from('tickets')\n                        .update({ status: 'pending' })",
    "const { error } = await supabase.from('tickets')\n                        .update({ status: 'pending' })"
);
code = code.replace(
    ".eq('channel_id', interaction.channel.id);",
    ".eq('channel_id', interaction.channel.id);\n                    if (error) console.error('SUPABASE DB ERROR (CLAIM):', error);"
);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Debug patch appliqué !");
