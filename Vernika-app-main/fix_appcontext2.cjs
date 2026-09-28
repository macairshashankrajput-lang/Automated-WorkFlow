const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');
content = content.replace('}\\n\\n\\nexport const useApp', '}\\n\\nexport const useApp');
content = content.replace('  );}\\n\\nexport const useApp', '  );\\n};\\n\\nexport const useApp');
content = content.replace('  );\\n}\\n\\nexport const useApp', '  );\\n};\\n\\nexport const useApp');
content = content.replace('  );}\\n\\n\\nexport const useApp', '  );\\n};\\n\\nexport const useApp');

// Wait, the output had a literal \n? `);}\n\nexport const useApp` - ah, the replace I did inserted `\\n` literal! Let me fix that.
content = content.replace(/}\\n\\nexport const useApp/g, '}\\nexport const useApp'); // literal string replacement 
fs.writeFileSync('src/context/AppContext.tsx', content.replace(/\\\\n/g, '\\n'));
