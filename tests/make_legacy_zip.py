import struct, zlib, zipfile, sys
sys.path.insert(0, '/app/tests')
from make_settings import ub, utf  # noqa

def msav(tags):
    meta = struct.pack('>H', len(tags))
    for k, v in tags.items():
        meta += utf(k) + utf(v)
    return zlib.compress(b"MSAV" + struct.pack('>i', 8) + struct.pack('>i', len(meta)) + meta)

P = {"lastWidth": 200, "lastHeight": 200, "storageCapacity": 9300, "waves": False, "wave": 30, "wasCaptured": True,
     "items": {"copper": 209, "titanium": 9300}, "resources": ["copper", "titanium"]}
sectors = {
    # legacy Stained Mountains: info + save still at old id 20 (no sectorPreset tag in the save)
    "serpulo-s-20-info": {**P, "lastPresetName": "stainedMountains"},
    # v8 save with tag pointing to another sector -> remap 30 -> 64 (frozenForest)
    "serpulo-s-30-info": {**P, "wave": 15},
    # already-remapped v8 sector: tag empty, no move
    "serpulo-s-170-info": {**P, "wave": 10, "resources": ["copper", "lead", "scrap", "water"]},
    # only viewed
    "serpulo-s-60-info": {"shown": True},
}
vals = []
for k, info in sectors.items():
    b = ub(info)
    vals.append((k, 5, struct.pack('>i', len(b)) + b))
data = struct.pack('>i', len(vals))
for k, t, payload in vals:
    data += utf(k) + bytes([t]) + payload
with zipfile.ZipFile('/app/tests/legacy_export.zip', 'w') as z:
    z.writestr('settings.bin', data)
    z.writestr('saves/sector-serpulo-20.msav', msav({"rules": "{sector:serpulo-20,winWave:30}", "build": "146"}))
    z.writestr('saves/sector-serpulo-30.msav', msav({"rules": "{sector:serpulo-30}", "sectorPreset": "frozenForest", "build": "160"}))
    z.writestr('saves/sector-serpulo-170.msav', msav({"rules": "{sector:serpulo-170}", "sectorPreset": "groundZero", "build": "160"}))
    z.writestr('saves/sector-serpulo-170-backup.msav', msav({"rules": "{sector:serpulo-99}", "sectorPreset": "", "build": "160"}))
print('ok')
