const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

const badUseState = \`  const [employeeDocuments,
    globalFiles,
    uploadFile,
    deleteGlobalFile, setEmployeeDocuments] = useState<EmployeeDocumentRecord[]>(() => {\`;

const goodUseState = \`  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocumentRecord[]>(() => {\`;

content = content.replace(badUseState, goodUseState);

// Now, what about the extra bracket?
// Wait, is there an extra closing bracket?
// My bracket counter said: Open 601, Close 602.
// Let's find it.
