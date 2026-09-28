from pathlib import Path
import re, json
text = (Path(__file__).resolve().parents[1] / 'src/data/mockData.ts').read_text()
manifest = {}
for match in re.finditer(r'export const (initial[A-Za-z0-9_]+)\s*:[^=]+?=\s*\[', text):
    name = match.group(1)
    start = match.end()
    depth = 1
    i = start
    ids = []
    obj_depth = 0
    current = None
    while i < len(text) and depth:
        ch = text[i]
        if ch == '[': depth += 1
        elif ch == ']': depth -= 1
        elif ch == '{':
            obj_depth += 1
            if obj_depth == 1: current = None
        elif ch == '}':
            if obj_depth == 1 and current: ids.append(current)
            obj_depth -= 1
        elif obj_depth == 1 and current is None:
            m = re.match(r"\s*id\s*:\s*['\"]([^'\"]+)", text[i:])
            if m:
                current = m.group(1)
                i += m.end() - 1
        i += 1
    if ids:
        manifest[name] = ids
Path('/home/ubuntu/vernika-project/demo-cleanup-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest, indent=2))
