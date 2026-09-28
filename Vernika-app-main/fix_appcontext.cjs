const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');
content = content.replace('  );\\n};\\n\\nexport const useApp', '  );\\n};\\n\\nexport const useApp');
// Wait, the previous fix didn't work properly. Let's find exactly the end of the file.
const lines = content.split('\\n');
// if the last lines are missing a closing brace, add it.
let open = 0; let close = 0;
for(let i=0; i<content.length; i++) {
  if (content[i] === '{') open++;
  if (content[i] === '}') close++;
}
if (open > close) {
  content = content.replace('export const useApp = () => {', '}\\n\\nexport const useApp = () => {');
  fs.writeFileSync('src/context/AppContext.tsx', content);
}
