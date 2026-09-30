// Mindustry sector presets (from Anuken/Mindustry SectorPresets.java)
// difficulty: 1-10 numeric -> label mapping below
export const PRESETS = {
  serpulo: {
    15: { key: "groundZero", name: "Ground Zero", difficulty: 1, captureWave: 10 },
    86: { key: "frozenForest", name: "Frozen Forest", difficulty: 2, captureWave: 15 },
    18: { key: "crateredBattleground", name: "The Craters", difficulty: 2, captureWave: 20 },
    21: { key: "fungalPass", name: "Fungal Pass", difficulty: 2 },
    81: { key: "biomassFacility", name: "Biomass Synthesis Facility", difficulty: 3, captureWave: 20 },
    213: { key: "ruinousShores", name: "Ruinous Shores", difficulty: 3, captureWave: 30 },
    246: { key: "windsweptIslands", name: "Windswept Islands", difficulty: 4, captureWave: 30 },
    20: { key: "stainedMountains", name: "Stained Mountains", difficulty: 3, captureWave: 30 },
    50: { key: "frontier", name: "Frontier", difficulty: 4 },
    47: { key: "perilousHarbor", name: "Perilous Harbour", difficulty: 4 },
    64: { key: "facility32m", name: "Facility 32M", difficulty: 4, captureWave: 25 },
    210: { key: "infestedCanyons", name: "Infested Canyons", difficulty: 4 },
    101: { key: "saltFlats", name: "Salt Flats", difficulty: 5 },
    165: { key: "extractionOutpost", name: "Extraction Outpost", difficulty: 5 },
    108: { key: "coastline", name: "Humid Coastline", difficulty: 5, captureWave: 30 },
    134: { key: "overgrowth", name: "Overgrowth", difficulty: 5 },
    23: { key: "tarFields", name: "Tar Fields", difficulty: 5, captureWave: 40 },
    227: { key: "impact0078", name: "Impact 0078", difficulty: 7, captureWave: 45 },
    221: { key: "taintedWoods", name: "Tainted Woods", difficulty: 5, captureWave: 33 },
    3: { key: "testingGrounds", name: "Testing Grounds", difficulty: 7, captureWave: 33 },
    1: { key: "atolls", name: "Atolls", difficulty: 7 },
    130: { key: "nuclearComplex", name: "Nuclear Production Complex", difficulty: 7, captureWave: 50 },
    216: { key: "navalFortress", name: "Naval Fortress", difficulty: 8 },
    260: { key: "mycelialBastion", name: "Mycelial Bastion", difficulty: 8 },
    39: { key: "weatheredChannels", name: "Weathered Channels", difficulty: 9, captureWave: 40 },
    123: { key: "desolateRift", name: "Desolate Rift", difficulty: 8, captureWave: 18 },
    204: { key: "littoralShipyard", name: "Littoral Shipyard", difficulty: 9 },
    93: { key: "planetaryTerminal", name: "Planetary Launch Terminal", difficulty: 10 },
  },
  erekir: {
    10: { key: "onset", name: "Onset", difficulty: 1 },
    19: { key: "split", name: "Split", difficulty: 2 },
    88: { key: "aegis", name: "Aegis", difficulty: 3 },
    30: { key: "peaks", name: "Peaks", difficulty: 3 },
    41: { key: "lake", name: "Lake", difficulty: 4 },
    25: { key: "marsh", name: "Marsh", difficulty: 4 },
    39: { key: "ravine", name: "Ravine", difficulty: 4 },
    43: { key: "caldera-erekir", name: "Caldera", difficulty: 4 },
    36: { key: "intersect", name: "Intersect", difficulty: 5 },
    14: { key: "atlas", name: "Atlas", difficulty: 5 },
    29: { key: "basin", name: "Basin", difficulty: 6 },
    3: { key: "crevice", name: "Crevice", difficulty: 6 },
    18: { key: "stronghold", name: "Stronghold", difficulty: 7 },
    37: { key: "crossroads", name: "Crossroads", difficulty: 7 },
    58: { key: "siege", name: "Siege", difficulty: 8 },
    5: { key: "karst", name: "Karst", difficulty: 9 },
    12: { key: "origin", name: "Origin", difficulty: 10 },
  },
};

// Insertion order of each planet's preset map is used as campaign progression order
export const presetOrder = (planet, id) => {
  const keys = Object.keys(PRESETS[planet] || {});
  // Object.keys sorts integer keys ascending, so keep an explicit order list
  return ORDER[planet] ? ORDER[planet].indexOf(Number(id)) : keys.indexOf(String(id));
};

const ORDER = {
  serpulo: [15, 86, 18, 21, 81, 213, 246, 20, 50, 47, 64, 210, 101, 165, 108, 134, 23, 227, 221, 3, 1, 130, 216, 260, 39, 123, 204, 93],
  erekir: [10, 19, 88, 30, 41, 25, 39, 43, 36, 14, 29, 3, 18, 37, 58, 5, 12],
};

export const findPresetByKey = (planet, key) => {
  if (!key) return null;
  const map = PRESETS[planet] || {};
  for (const id of Object.keys(map)) {
    if (map[id].key === key) return { id: Number(id), ...map[id] };
  }
  return null;
};

export const difficultyLabel = (n) => {
  if (n == null) return "Unknown";
  if (n <= 2) return "Low";
  if (n <= 4) return "Medium";
  if (n <= 7) return "High";
  if (n <= 9) return "Extreme";
  return "Eradication";
};

export const DIFFICULTIES = ["Low", "Medium", "High", "Extreme", "Eradication", "Unknown"];
export const DIFF_RANK = { Low: 0, Medium: 1, High: 2, Extreme: 3, Eradication: 4, Unknown: 5 };
export const DIFF_COLOR = {
  Low: "text-emerald-600",
  Medium: "text-sky-600",
  High: "text-orange-500",
  Extreme: "text-red-600",
  Eradication: "text-fuchsia-700",
  Unknown: "text-slate-400",
};

export const STATUSES = ["captured", "under_attack", "lost", "unclaimed"];
export const STATUS_META = {
  captured: { label: "Captured", dot: "bg-emerald-500", badge: "border-emerald-200 bg-emerald-50 text-emerald-700", color: "#10b981" },
  under_attack: { label: "Under Attack", dot: "bg-amber-500", badge: "border-amber-200 bg-amber-50 text-amber-700", color: "#f59e0b" },
  lost: { label: "Lost", dot: "bg-rose-500", badge: "border-rose-200 bg-rose-50 text-rose-700", color: "#f43f5e" },
  unclaimed: { label: "Unclaimed", dot: "bg-slate-300", badge: "border-slate-200 bg-slate-50 text-slate-500", color: "#cbd5e1" },
};
