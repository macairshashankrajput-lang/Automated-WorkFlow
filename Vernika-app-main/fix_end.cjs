const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');
content = content.replace('  );\\n\\nexport const useApp', '  );\\n};\\n\\nexport const useApp');
content = content.replace('  );export const useApp', '  );\\n};\\nexport const useApp');
fs.writeFileSync('src/context/AppContext.tsx', content);
