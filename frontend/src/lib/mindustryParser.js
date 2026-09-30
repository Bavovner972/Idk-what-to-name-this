// Parses Mindustry settings.bin (Arc Settings binary format) and extracts campaign sector info.
// Sector info is stored under keys "<planet>-s-<id>-info" as UBJSON-encoded SectorInfo.
import JSZip from "jszip";
import { PRESETS, presetOrder, findPresetByKey, difficultyLabel } from "./presets";

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

// Accepts a File (settings.bin or exported .zip)
export async function loadSettingsFromFile(file) {
  let bytes = new Uint8Array(await file.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (isZip) {
    const zip = await JSZip.loadAsync(bytes);
    const entry = Object.values(zip.files).find((f) => !f.dir && /(^|\/)settings\.bin$/i.test(f.name));
    if (!entry) throw new Error("No settings.bin found inside the zip");
    bytes = await entry.async("uint8array");
  }
  return readSettings(bytes);
}

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

// SectorInfo defaults (Arc Json omits fields equal to defaults)
function toSector(planet, id, info) {
  const preset = (PRESETS[planet] || {})[id] || findPresetByKey(planet, info.lastPresetName);
  const waves = info.waves ?? true;
  const attack = info.attack ?? false;
  const hasCore = info.hasCore ?? true;
  const wasCaptured = info.wasCaptured ?? false;
  let status;
  if (hasCore && !waves && !attack) status = "captured";
  else if (hasCore) status = "under_attack";
  else if (wasCaptured) status = "lost";
  else status = "unclaimed";

  const production = statMap(info.production);
  const output = production.reduce((s, p) => s + p.rate, 0);
  const items = {};
  if (info.items && typeof info.items === "object") {
    for (const [k, v] of Object.entries(info.items)) if (typeof v === "number" && v > 0) items[k] = v;
  }
  const resources = Array.isArray(info.resources) ? info.resources.filter((x) => typeof x === "string") : [];
  const numbered = !preset;
  const name = info.name || (preset ? preset.name : `Sector ${id}`);
  const order = preset ? presetOrder(planet, preset.id ?? id) : 1000 + id;

  return {
    sector_id: id,
    name,
    preset: preset ? preset.key : null,
    numbered,
    status,
    difficulty: preset ? difficultyLabel(preset.difficulty) : "Unknown",
    power: 0,
    wave: typeof info.wave === "number" ? info.wave : 1,
    win_wave: typeof info.winWave === "number" ? info.winWave : -1,
    output,
    production,
    production_text: production.map((p) => `${p.item} ${fmtRate(p.rate)}/min`).join(", "),
    resources,
    items,
    storage_capacity: info.storageCapacity || 0,
    core_type: typeof info.bestCoreType === "string" ? info.bestCoreType : null,
    order,
  };
}

// Returns { planets: { serpulo: [...sectors], erekir: [...] }, errors: [] }
export function extractSectors(values) {
  const planets = {};
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
      if (!info || typeof info !== "object") continue;
      (planets[planet] = planets[planet] || []).push(toSector(planet, id, info));
    } catch (e) {
      errors.push(`${key}: ${e.message}`);
    }
  }
  for (const p of Object.keys(planets)) planets[p].sort((a, b) => a.order - b.order);
  return { planets, errors };
}
