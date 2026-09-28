const fs = require('fs');
let content = fs.readFileSync('src/components/common/FileManager.tsx', 'utf-8');

if (!content.includes('FolderKanban')) {
  content = content.replace(
    "import { FileText, Download, Trash2, Upload, ExternalLink, Image as ImageIcon } from 'lucide-react';",
    "import { FileText, Download, Trash2, Upload, ExternalLink, Image as ImageIcon, FolderKanban } from 'lucide-react';"
  );
}

fs.writeFileSync('src/components/common/FileManager.tsx', content);
console.log('Fixed FileManager missing icon');
