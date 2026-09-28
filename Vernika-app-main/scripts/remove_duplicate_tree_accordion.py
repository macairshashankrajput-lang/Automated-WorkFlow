from pathlib import Path

path = Path('/home/ubuntu/vernika-project/src/screens/OrgTreeScreen.tsx')
text = path.read_text()
start = text.index('      <div className="space-y-4">\n        {liveDepartments.map((department) => {')
end = text.index('      <section className="bg-white dark:bg-slate-900 border border-indigo-200', start)
text = text[:start] + text[end:]
path.write_text(text)
