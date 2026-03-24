const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../events/supportTickets.js');
let code = fs.readFileSync(filePath, 'utf8');

// Fix the duplicated const { error } = 
code = code.replace(/const { error } = const { error } = /g, "const { error } = ");
// Fix any potential duplicated console.error from multiple runs just in case
code = code.replace(/if \(error\) console.error\('SUPABASE DB ERROR \(CREATE\):', error\);\n                        if \(error\) console.error\('SUPABASE DB ERROR \(CREATE\):', error\);/g, "if (error) console.error('SUPABASE DB ERROR (CREATE):', error);");
code = code.replace(/if \(error\) console.error\('SUPABASE DB ERROR \(CLOSE\):', error\);\n                    if \(error\) console.error\('SUPABASE DB ERROR \(CLOSE\):', error\);/g, "if (error) console.error('SUPABASE DB ERROR (CLOSE):', error);");
code = code.replace(/if \(error\) console.error\('SUPABASE DB ERROR \(CLAIM\):', error\);\n                    if \(error\) console.error\('SUPABASE DB ERROR \(CLAIM\):', error\);/g, "if (error) console.error('SUPABASE DB ERROR (CLAIM):', error);");

fs.writeFileSync(filePath, code, 'utf8');
console.log("Crash resolu !");
