const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../events/supportTickets.js');
let code = fs.readFileSync(filePath, 'utf8');

// Fix the duplicated const { data, error } = for the INSERT operation
code = code.replace(/const { data, error } = const { data, error } = /g, "const { data, error } = ");

fs.writeFileSync(filePath, code, 'utf8');
console.log("Crash INSERT resolu !");
