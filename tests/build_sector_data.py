"""Builds /app/frontend/src/lib/sectorData.js from a Mindustry v160.5 server dump (dump.json)."""
import json, re, urllib.request

d = json.load(open('/root/mserver/dump.json'))
bundle = urllib.request.urlopen('https://raw.githubusercontent.com/Anuken/Mindustry/v160.5/core/assets/bundles/bundle.properties').read().decode()
names = dict(re.findall(r'^sector\.([A-Za-z0-9-]+)\.name\s*=\s*(.+)$', bundle, re.M))

out = {}
for pn, arr in d.items():
    presets = {}
    graph = []  # index = sector id -> [generateEnemyBase, baseline threat, neighbours]
    for s in sorted(arr, key=lambda x: x['id']):
        graph.append([s['g'], s['t'], s['n']])
        p = s['p']
        if p:
            nm = names.get(p['key'])
            presets[s['id']] = {
                'key': p['key'],
                'name': nm.strip() if nm else None,
                'difficulty': p['d'],
                'captureWave': p['cw'],
                'originalPosition': p['op'],
                'requireUnlock': bool(p['ru']),
            }
    out[pn] = {'presets': presets, 'graph': graph}

js = "// AUTO-GENERATED from the official Mindustry v160.5 (v8) server - do not edit by hand.\n"
js += "// presets: sectorId -> preset info. graph[id] = [generateEnemyBase, baselineThreat, neighbourIds]\n"
js += "export const SECTOR_DATA = " + json.dumps(out, separators=(',', ':')) + ";\n"
open('/app/frontend/src/lib/sectorData.js', 'w').write(js)
for pn in out:
    named = [(k, v['name']) for k, v in out[pn]['presets'].items() if v['name']]
    print(pn, 'sectors', len(out[pn]['graph']), 'presets', len(out[pn]['presets']), 'named', len(named))
    print(named)
