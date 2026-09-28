const fs = require('fs');
const content = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');
let open = 0;
let close = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') open++;
  if (content[i] === '}') close++;
}
console.log(`Open: \${open}, Close: \${close}, Diff: \${open - close}`);
