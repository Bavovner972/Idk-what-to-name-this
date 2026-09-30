"""Generates a fake Mindustry settings.bin (Arc format, UBJSON sector info) for testing."""
import struct, zlib, sys, zipfile


def ub_len(n):
    if n <= 127:
        return b'i' + struct.pack('>b', n)
    if n <= 32767:
        return b'I' + struct.pack('>h', n)
    return b'l' + struct.pack('>i', n)


def ub(v):
    if v is None:
        return b'Z'
    if v is True:
        return b'T'
    if v is False:
        return b'F'
    if isinstance(v, int):
        if -128 <= v <= 127:
            return b'i' + struct.pack('>b', v)
        if -32768 <= v <= 32767:
            return b'I' + struct.pack('>h', v)
        return b'l' + struct.pack('>i', v)
    if isinstance(v, float):
        return b'd' + struct.pack('>f', v)
    if isinstance(v, str):
        b = v.encode()
        return b'S' + ub_len(len(b)) + b
    if isinstance(v, list):
        return b'[' + b''.join(ub(x) for x in v) + b']'
    if isinstance(v, dict):
        out = b'{'
        for k, x in v.items():
            kb = k.encode()
            out += ub_len(len(kb)) + kb + ub(x)
        return out + b'}'
    raise TypeError(v)


def utf(s):
    b = s.encode()
    return struct.pack('>H', len(b)) + b


P = {"lastWidth": 200, "lastHeight": 200, "storageCapacity": 4000, "spawnPosition": 12345}
sectors = {
    "serpulo-s-15-info": {**P, "waves": False, "wave": 12, "winWave": 10, "production": {"copper": {"mean": 5.0}, "lead": {"mean": 2.5}}, "export": {"copper": {"mean": 2.0}}, "items": {"copper": 4000, "lead": 1200, "graphite": 300, "sand": 50}, "bestCoreType": "core-foundation", "storageCapacity": 9000, "wasCaptured": True, "lastPresetName": "groundZero"},
    "serpulo-s-23-info": {**P, "waves": False, "wave": 40, "production": {"silicon": {"mean": 30.0}, "plastanium": {"mean": 10.0}}, "export": {"silicon": {"mean": 10.0}, "copper": {"mean": 3.0}}, "wasCaptured": True},
    "serpulo-s-86-info": {**P, "wave": 7, "winWave": 15},
    "serpulo-s-45-info": {**P, "waves": False, "wave": 31, "production": {"titanium": {"mean": 12.0}}, "wasCaptured": True, "resources": ["copper", "titanium", "sand"]},
    "serpulo-s-112-info": {**P, "wave": 4, "attack": True},
    "serpulo-s-200-info": {"hasCore": False, "wasCaptured": True, "wave": 22, "name": "My Outpost"},
    "serpulo-s-7-info": {"hasCore": False},
    # Only-viewed sectors: info exists with all defaults (waves=true, hasCore=true) but never played -> must be Unclaimed
    "serpulo-s-60-info": {"shown": True},
    "serpulo-s-101-info": {"resources": ["copper", "sand"]},
    "erekir-s-10-info": {**P, "waves": False, "wave": 3, "production": {"beryllium": {"mean": 4.0}}},
}
SAVES = ["serpulo-15", "serpulo-23", "serpulo-86", "serpulo-45", "serpulo-112", "erekir-10"]

vals = [("locale", 4, utf("default")), ("musicvol", 1, struct.pack('>i', 80)), ("fpscap", 3, struct.pack('>f', 60.0))]
for k, info in sectors.items():
    b = ub(info)
    vals.append((k, 5, struct.pack('>i', len(b)) + b))

data = struct.pack('>i', len(vals))
for k, t, payload in vals:
    data += utf(k) + bytes([t]) + payload

compress = len(sys.argv) > 1 and sys.argv[1] == 'z'
if compress:
    data = zlib.compress(data)
open('/app/tests/settings.bin', 'wb').write(data)
with zipfile.ZipFile('/app/tests/export.zip', 'w') as z:
    z.writestr('settings.bin', data)
    for s in SAVES:
        z.writestr(f'saves/sector-{s}.msav', b'dummy')
print('ok', len(data), 'compressed' if compress else 'raw')
