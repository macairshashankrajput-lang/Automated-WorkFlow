const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');
const lines = content.split('\n');
console.log('Last 20 lines:');
console.log(lines.slice(Math.max(lines.length - 20, 0)).join('\n'));
