// File System Access API wrapper: lets the user link their Mindustry data folder once,
// then re-read settings.bin + saves/ without manual importing. The folder handle is
// persisted in IndexedDB so it survives page reloads (permission is re-requested on each load).
import { readSettings, readSaveMeta } from "./mindustryParser";
import { findPresetByKey, findPresetByOriginalPosition } from "./presets";

const DB_NAME = "sc_game_folder";
const STORE = "handle";
const KEY = "mindustry_dir";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable in this browser or browsing context"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Could not open IndexedDB"));
    req.onblocked = () => reject(new Error("IndexedDB is blocked by another open tab"));
  });
}

export function isFileSystemAccessSupported() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined" && "showDirectoryPicker" in window;
}

export async function saveHandle(handle) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not save the folder handle"));
    tx.onabort = () => reject(tx.error || new Error("Saving the folder handle was aborted"));
  });
}

export async function loadHandle() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error("Could not restore the folder handle"));
    tx.onabort = () => reject(tx.error || new Error("Restoring the folder handle was aborted"));
  });
}

export async function clearHandle() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not remove the folder handle"));
    tx.onabort = () => reject(tx.error || new Error("Removing the folder handle was aborted"));
  });
}

// Permission is queried without prompting on restore. A request only happens during an
// explicit user action such as Sync or choosing a folder.
async function ensurePermission(handle) {
  const opts = { mode: "read" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  if ((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

export async function pickFolder() {
  return window.showDirectoryPicker({ mode: "read" });
}

// Validate a newly picked folder before replacing the saved handle. If either reading
// the folder or persisting it fails, the previously linked folder remains untouched.
export async function validateAndSaveHandle(handle) {
  const data = await readFromFolder(handle);
  try {
    await saveHandle(handle);
  } catch (error) {
    throw new Error(`Could not save the folder link in browser storage: ${error.message || "IndexedDB is unavailable"}`);
  }
  return data;
}

// Reads the first file in `dir` whose name matches `pattern` (case-insensitive).
async function findFile(dir, pattern) {
  for await (const entry of dir.values()) {
    if (entry.kind === "file" && pattern.test(entry.name)) return entry;
  }
  return null;
}

// Recursively collect all .msav files under a saves/ subdirectory.
async function collectSaveFiles(dir) {
  const out = [];
  let savesDir = null;
  for await (const entry of dir.values()) {
    if (entry.kind === "directory" && /^saves$/i.test(entry.name)) {
      savesDir = entry;
      break;
    }
  }
  if (!savesDir) return out;
  for await (const entry of savesDir.values()) {
    if (entry.kind === "file" && /\.msav$/i.test(entry.name) && !/backup/i.test(entry.name)) {
      out.push(entry);
    }
  }
  return out;
}

// Adapts FileSystemFileHandle into the shape findSectorSaves expects ({ name, async("uint8array") }).
function fileHandleAdapter(fh) {
  return {
    name: fh.name,
    async async(kind) {
      const f = await fh.getFile();
      if (kind === "uint8array") return new Uint8Array(await f.arrayBuffer());
      return f;
    },
  };
}

// Mirrors findSectorSaves in mindustryParser.js but works with FileSystemFileHandle objects.
async function findSectorSavesFromFolder(saveFiles) {
  const saves = {};
  const remaps = {};
  const add = (planet, id) => (saves[planet] = saves[planet] || new Set()).add(id);
  const reName = /^sector-([a-z0-9_-]+?)-(\d+)\.msav$/i;
  for (const sf of saveFiles) {
    let planet = null;
    let id = null;
    let meta = null;
    try {
      const file = await sf.getFile();
      meta = await readSaveMeta(new Uint8Array(await file.arrayBuffer()));
      const m = (meta.rules || "").match(/"?sector"?\s*:\s*"?([a-z0-9_]+)-(\d+)"?/i);
      if (m) { planet = m[1].toLowerCase(); id = Number(m[2]); }
    } catch (e) {
      // unreadable save — fall back to filename
    }
    if (planet == null) {
      const n = sf.name.match(reName);
      if (!n) continue;
      planet = n[1].toLowerCase();
      id = Number(n[2]);
    }
    let target = null;
    const presetKey = meta ? meta.sectorPreset : "";
    if (presetKey != null) {
      if (presetKey) {
        const preset = findPresetByKey(planet, presetKey);
        if (preset && preset.id !== id && preset.requireUnlock) target = preset.id;
      }
    } else {
      const legacy = findPresetByOriginalPosition(planet, id);
      if (legacy && legacy.id !== id && legacy.requireUnlock) target = legacy.id;
    }
    if (target != null) {
      (remaps[planet] = remaps[planet] || new Map()).set(id, target);
      id = target;
    }
    add(planet, id);
  }
  return { saves, remaps };
}

// Reads settings.bin + saves/ from the linked folder and returns the same shape as loadSettingsFromFile.
export async function readFromFolder(handle) {
  let granted;
  try {
    granted = await ensurePermission(handle);
  } catch (error) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") throw error;
    throw new Error(`Could not check folder permission: ${error.message || "browser permission check failed"}`);
  }
  if (!granted) {
    const error = new Error("Folder access was denied. Use Sync and allow read access, or change the linked folder.");
    error.name = "NotAllowedError";
    throw error;
  }

  const settingsFile = await findFile(handle, /^settings\.bin$/i);
  if (!settingsFile) throw new Error("No settings.bin found in the linked folder. Make sure you selected your Mindustry data directory.");

  const file = await settingsFile.getFile();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const values = await readSettings(bytes);

  const saveFiles = await collectSaveFiles(handle);
  let saves = null;
  let remaps = null;
  if (saveFiles.length) {
    ({ saves, remaps } = await findSectorSavesFromFolder(saveFiles));
  }

  return { values, saves, remaps };
}
