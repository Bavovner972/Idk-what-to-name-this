// Parses Mindustry settings.bin (Arc Settings binary format) and extracts campaign sector info.
// Sector info is stored under keys "<planet>-s-<id>-info" as UBJSON-encoded SectorInfo.
import JSZip from "/app/frontend/node_modules/jszip/lib/index.js";
import { getPreset, findPresetByKey, computeThreat, threatLabel } from "./presets.mjs";

const utf8 = new TextDecoder("utf-8");

class Reader {
  constructor(bytes) {
    this.b = bytes;
    this.v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.p = 0;
  }
  eof() { return this.p >= this.b.length; }
  u8() { return this.v.getUint8(this.p++); }
  i8() { return this.v.getInt8(this.p++); }
  u16() { const r = this.v.getUint16(this.p); this.p += 2; return r; }
  i16() { const r = this.v.getInt16(this.p); this.p += 2; return r; }
  i32() { const r = this.v.getInt32(this.p); this.p += 4; return r; }
  u32() { const r = this.v.getUint32(this.p); this.p += 4; return r; }
  i64() { const r = this.v.getBigInt64(this.p); this.p += 8; return Number(r); }
  f32() { const r = this.v.getFloat32(this.p); this.p += 4; return r; }
  f64() { const r = this.v.getFloat64(this.p); this.p += 8; return r; }
  bytes(n) { const r = this.b.subarray(this.p, this.p + n); this.p += n; return r; }
  utf() { const n = this.u16(); return utf8.decode(this.bytes(n)); }
}

// ---------- UBJSON (Arc / libGDX flavour) ----------
function ubSize(r, type) {
  switch (type) {
    case 0x69: return r.u8(); // 'i'
    case 0x55: return r.u8(); // 'U'
    case 0x49: return r.u16(); // 'I'
    case 0x6c: return r.u32(); // 'l'
    case 0x4c: return r.i64(); // 'L'
    default: throw new Error("Bad UBJSON size marker " + type);
  }
}

function ubString(r, type, keyMode) {
  let size;
  if (type === 0x53) size = ubSize(r, r.u8()); // 'S'
  else if (type === 0x73) size = r.u8(); // 's'
  else if (keyMode) size = ubSize(r, type);
  else throw new Error("Bad string marker");
  return utf8.decode(r.bytes(size));
}

function ubValue(r, type) {
  switch (type) {
    case 0x7b: return ubObject(r); // {
    case 0x5b: return ubArray(r); // [
    case 0x5a: case 0x4e: return null; // Z N
    case 0x54: return true; // T
    case 0x46: return false; // F
    case 0x69: return r.i8();
    case 0x55: return r.u8();
    case 0x49: return r.i16();
    case 0x6c: return r.i32();
    case 0x4c: return r.i64();
    case 0x64: return r.f32(); // d
    case 0x44: return r.f64(); // D
    case 0x43: return String.fromCharCode(r.u16()); // C (java char)
    case 0x53: case 0x73: case 0x48: return ubString(r, type === 0x48 ? 0x53 : type, false);
    default: throw new Error("Unknown UBJSON type 0x" + type.toString(16) + " at " + r.p);
  }
}

function ubContainerHeader(r) {
  let valueType = 0, count = -1;
  let t = r.u8();
  if (t === 0x24) { valueType = r.u8(); t = r.u8(); } // $
  if (t === 0x23) { count = ubSize(r, r.u8()); t = count > 0 ? (valueType ? null : r.u8()) : null; } // #
  return { valueType, count, t };
}

function ubArray(r) {
  const out = [];
  let { valueType, count, t } = ubContainerHeader(r);
  if (count >= 0) {
    for (let i = 0; i < count; i++) {
      const vt = valueType || (i === 0 && t != null ? t : r.u8());
      out.push(ubValue(r, vt));
    }
    return out;
  }
  while (!r.eof() && t !== 0x5d) {
    out.push(ubValue(r, valueType || t));
    t = r.u8();
  }
  return out;
}

function ubObject(r) {
  const out = {};
  let { valueType, count, t } = ubContainerHeader(r);
  if (count >= 0) {
    for (let i = 0; i < count; i++) {
      const kt = i === 0 && t != null ? t : r.u8();
      const key = ubString(r, kt, true);
      out[key] = ubValue(r, valueType || r.u8());
    }
    return out;
  }
  while (!r.eof() && t !== 0x7d) {
    const key = ubString(r, t, true);
    out[key] = ubValue(r, valueType || r.u8());
    t = r.u8();
  }
  return out;
}

export function parseUBJson(bytes) {
  const r = new Reader(bytes);
  return ubValue(r, r.u8());
}

// ---------- settings.bin ----------
async function inflate(bytes) {
  const ds = new DecompressionStream("deflate");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

export async function readSettings(bytes) {
  const compressed = bytes[0] === 0x78 && [0x01, 0x5e, 0x9c, 0xda].includes(bytes[1]);
  if (compressed) bytes = await inflate(bytes);
  const r = new Reader(bytes);
  const amount = r.i32();
  if (amount <= 0 || amount > 10_000_000) throw new Error("This doesn't look like a Mindustry settings.bin file");
  const values = {};
  for (let i = 0; i < amount; i++) {
    const key = r.utf();
    const type = r.u8();
    switch (type) {
      case 0: values[key] = r.u8() !== 0; break;
      case 1: values[key] = r.i32(); break;
      case 2: values[key] = r.i64(); break;
      case 3: values[key] = r.f32(); break;
      case 4: values[key] = r.utf(); break;
      case 5: { const n = r.i32(); values[key] = r.bytes(n); break; }
      default: throw new Error("Unknown settings value type " + type + " for key " + key);
    }
  }
  return values;
}

// Accepts a File (settings.bin or exported .zip).
// Returns { values, saves } where saves = { planet: Set(sectorIds) } when the zip contains a saves/ folder, else null.
export async function loadSettingsFromFile(file) {
  let bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  let saves = null;
  if (isZip) {
    const zip = await JSZip.loadAsync(bytes);
    const files = Object.values(zip.files).filter((f) => !f.dir);
    const entry = files.find((f) => /(^|\/)settings\.bin$/i.test(f.name));
    if (!entry) throw new Error("No settings.bin found inside the zip");
    bytes = await entry.async("uint8array");
    const hasSavesDir = files.some((f) => /(^|\/)saves\//i.test(f.name));
    if (hasSavesDir) saves = await findSectorSaves(files);
  }
  const values = await readSettings(bytes);
  return { values, saves };
}

// ---------- .msav save files ----------
// Layout (after zlib inflate): "MSAV" | int version | int metaLength | StringMap(short count, (utf key, utf value)*)
async function inflatePrefix(bytes, maxBytes = 4 * 1024 * 1024) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate")).getReader();
  const chunks = [];
  let total = 0;
  let need = 12;
  while (total < Math.min(need, maxBytes)) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
    if (total >= 12 && need === 12) {
      const head = concat(chunks, total);
      need = 12 + new DataView(head.buffer).getInt32(8);
    }
  }
  reader.cancel().catch(() => {});
  return concat(chunks, total);
}

function concat(chunks, total) {
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

export async function readSaveMeta(bytes) {
  const data = await inflatePrefix(bytes);
  if (String.fromCharCode(...data.subarray(0, 4)) !== "MSAV") throw new Error("not a MSAV file");
  const r = new Reader(data);
  r.p = 12;
  const count = r.i16();
  const meta = {};
  for (let i = 0; i < count; i++) meta[r.utf()] = r.utf();
  return meta;
}

// Mirrors Saves.load(): a save belongs to rules.sector, unless its "sectorPreset" tag points to a
// preset that now lives at another sector id (v8 renumbered Serpulo) - then it's remapped there.
async function findSectorSaves(files) {
  const saves = {};
  const add = (planet, id) => (saves[planet] = saves[planet] || new Set()).add(id);
  const reName = /(^|\/)sector-([a-z0-9_-]+?)-(\d+)\.msav$/i;
  for (const f of files) {
    if (!/(^|\/)saves\/[^/]+\.msav$/i.test(f.name)) continue;
    let planet = null;
    let id = null;
    let presetKey = null;
    try {
      const meta = await readSaveMeta(await f.async("uint8array"));
      const m = (meta.rules || "").match(/"?sector"?\s*:\s*"?([a-z0-9_]+)-(\d+)"?/i);
      if (m) { planet = m[1].toLowerCase(); id = Number(m[2]); }
      presetKey = meta.sectorPreset || null;
    } catch (e) {
      // unreadable save - fall back to the file name
    }
    if (planet == null) {
      const n = f.name.match(reName);
      if (!n) continue; // custom (non-campaign) save
      planet = n[2].toLowerCase();
      id = Number(n[3]);
    }
    if (presetKey) {
      const preset = findPresetByKey(planet, presetKey);
      if (preset && preset.requireUnlock) id = preset.id;
    }
    add(planet, id);
  }
  return saves;
}

// ---------- sector info -> tracker sector ----------
const fmtRate = (n) => (Math.round(n * 10) / 10).toFixed(1);

function statMap(obj) {
  const res = [];
  if (!obj || typeof obj !== "object") return res;
  for (const [item, stat] of Object.entries(obj)) {
    if (item === "class") continue;
    const mean = typeof stat === "number" ? stat : stat && typeof stat.mean === "number" ? stat.mean : 0;
    const perMin = Math.round(mean * 60);
    if (perMin > 0) res.push({ item, rate: perMin });
  }
  return res.sort((a, b) => b.rate - a.rate);
}

const hasItems = (info) =>
  info.items && typeof info.items === "object" && Object.values(info.items).some((v) => typeof v === "number" && v > 0);

// Whether the player has a base here. hasSave: true/false when known from the zip's saves, null otherwise.
function playerBase(info, hasSave) {
  if (hasSave != null) return hasSave;
  // settings.bin only: SectorInfo.prepare() records map size / storage / spawn every time a base is saved
  return (
    (info.lastWidth || 0) > 0 ||
    (info.storageCapacity || 0) > 0 ||
    (info.spawnPosition || 0) !== 0 ||
    hasItems(info) ||
    !!info.wasCaptured
  );
}

// SectorInfo defaults (Arc Json omits fields equal to defaults): waves=true, attack=false, hasCore=true, wasCaptured=false
export function computeStatus(info, hasSave) {
  const waves = info.waves ?? true;
  const attack = info.attack ?? false;
  const hasCore = info.hasCore ?? true;
  const wasCaptured = info.wasCaptured ?? false;
  if (!playerBase(info, hasSave) || !hasCore) return wasCaptured ? "lost" : "unclaimed";
  if (!waves && !attack) return "captured";
  return "under_attack";
}

function toSector(planet, id, info, hasSave = null) {
  const preset = getPreset(planet, id);
  const status = computeStatus(info, hasSave);
  const base = status === "captured" || status === "under_attack";
  const threat = computeThreat(planet, id, { hasBase: base, attack: !!info.attack });

  const production = statMap(info.production);
  const output = production.reduce((s, p) => s + p.rate, 0);
  const exports = statMap(info.export);
  const export_total = exports.reduce((s, p) => s + p.rate, 0);
  const items = {};
  if (info.items && typeof info.items === "object") {
    for (const [k, v] of Object.entries(info.items)) if (typeof v === "number" && v > 0) items[k] = v;
  }
  const resources = Array.isArray(info.resources) ? info.resources.filter((x) => typeof x === "string") : [];
  // Sector.name(): named presets use their localized name, everything else shows its number (or a custom name)
  const named = !!(preset && preset.name);
  const name = info.name || (named ? preset.name : `Sector ${id}`);

  return {
    sector_id: id,
    name,
    preset: preset ? preset.key : null,
    numbered: !named,
    status,
    difficulty: threatLabel(threat),
    power: 0,
    wave: typeof info.wave === "number" ? info.wave : 1,
    win_wave: typeof info.winWave === "number" ? info.winWave : -1,
    output,
    production,
    production_text: production.map((p) => `${p.item} ${fmtRate(p.rate)}/min`).join(", "),
    exports,
    export_total,
    export_text: exports.map((p) => `${p.item} ${fmtRate(p.rate)}/min`).join(", "),
    has_save: hasSave,
    resources,
    items,
    storage_capacity: info.storageCapacity || 0,
    core_type: typeof info.bestCoreType === "string" ? info.bestCoreType : null,
    order: named ? preset.difficulty * 1000 + id : 100000 + id,
  };
}

// Returns { planets: { serpulo: [...sectors], erekir: [...] }, errors: [], skipped: [] }
export function extractSectors(values, saves = null) {
  const raw = {}; // planet -> Map(id -> info)
  const errors = [];
  const re = /^([a-z0-9_-]+?)-s-(\d+)-info$/;
  for (const [key, val] of Object.entries(values)) {
    const m = key.match(re);
    if (!m) continue;
    const planet = m[1];
    const id = Number(m[2]);
    try {
      let info;
      if (val instanceof Uint8Array) info = parseUBJson(val);
      else if (typeof val === "string") info = JSON.parse(val);
      else continue;
      if (!info || typeof info !== "object" || Array.isArray(info)) continue;
      (raw[planet] = raw[planet] || new Map()).set(id, info);
    } catch (e) {
      errors.push(`${key}: ${e.message}`);
    }
  }

  const planets = {};
  const skipped = [];
  for (const [planet, infos] of Object.entries(raw)) {
    const saveSet = saves ? saves[planet] || new Set() : null;
    // Leftover info from before v8 renumbered the presets: lastPresetName says it belongs to a preset
    // that now lives at another id. Move it there if that sector has no info, otherwise drop the stale copy.
    for (const [id, info] of [...infos.entries()]) {
      const target = findPresetByKey(planet, info.lastPresetName);
      if (!target || target.id === id || !target.requireUnlock) continue;
      const own = getPreset(planet, id);
      if (own && own.key === info.lastPresetName) continue;
      infos.delete(id);
      if (!infos.has(target.id)) infos.set(target.id, info);
      else skipped.push(`${planet} #${id} (old ${info.lastPresetName} data)`);
    }
    const list = [];
    for (const [id, info] of infos.entries()) {
      const hasSave = saveSet ? saveSet.has(id) : null;
      list.push(toSector(planet, id, info, hasSave));
    }
    list.sort((a, b) => a.order - b.order);
    planets[planet] = list;
  }
  return { planets, errors, skipped };
}
