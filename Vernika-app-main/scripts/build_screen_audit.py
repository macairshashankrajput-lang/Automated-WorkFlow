from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
rows = []
for path in sorted((root / 'src/screens').glob('*.tsx')):
    text = path.read_text(errors='ignore')
    hooks = 'useApp' in text
    mutation_count = len(re.findall(r'\b(?:add|update|delete|send|submit|approve|review|clock|mark|log|upload|toggle|save)[A-Z]\w*\s*\(', text))
    realtime = 'useApp' in text or 'onSnapshot' in text
    notes = []
    lower = text.lower()
    if 'localstorage' in lower: notes.append('local-only state')
    if 'simulat' in lower or 'demo' in lower: notes.append('simulated/demo wording')
    if 'getusermedia' in lower or 'getdisplaymedia' in lower: notes.append('browser media permission')
    rows.append((path.stem, 'yes' if hooks else 'no', str(mutation_count), 'yes' if realtime else 'no', '; '.join(notes) or 'none found statically'))

out = ['# Vernika Complete Screen Audit Evidence', '', 'Generated from the current repository source. This is static coverage evidence; production external-service behavior still requires live deployment and multi-account execution.', '', '| Screen | App data hook | Mutation references | Realtime dependency | Static notes |', '|---|---:|---:|---:|---|']
out += [f'| {a} | {b} | {c} | {d} | {e} |' for a,b,c,d,e in rows]
out += ['', f'**Total screen files audited: {len(rows)}.**', '']
(root / 'complete-screen-audit.md').write_text('\n'.join(out))
print(f'wrote complete-screen-audit.md with {len(rows)} screens')
