// Sector presets + threat logic, based on the official Mindustry v8 (build 160.5) data in sectorData.js
import { SECTOR_DATA } from "./sectorData";

export const getPreset = (planet, id) => {
  const p = SECTOR_DATA[planet]?.presets?.[id];
  return p ? { id: Number(id), ...p } : null;
};

export const findPresetByKey = (planet, key) => {
  if (!key) return null;
  const map = SECTOR_DATA[planet]?.presets || {};
  for (const id of Object.keys(map)) if (map[id].key === key) return { id: Number(id), ...map[id] };
  return null;
};

// Named (requireUnlock) presets are registered before the generated "sector-<planet>-N" ones, so they win
export const findPresetByOriginalPosition = (planet, pos) => {
  const map = SECTOR_DATA[planet]?.presets || {};
  const ids = Object.keys(map).filter((id) => map[id].originalPosition === pos);
  const id = ids.find((i) => map[i].requireUnlock) ?? ids[0];
  return id != null ? { id: Number(id), ...map[id] } : null;
};

// Mindustry Sector.displayThreat(): index = (int)(threat / 0.25), capped at eradication
export const threatLabel = (t) => {
  if (t == null || Number.isNaN(t)) return "Unknown";
  const idx = Math.min(Math.floor(t / 0.25 + 1e-6), 4);
  return ["Low", "Medium", "High", "Extreme", "Eradication"][idx];
};

// Mindustry v8 Planet.updateBaseCoverage():
//  preset sectors: clamp(difficulty / 10)
//  others (and hidden presets with difficulty 0): max(min((1 + 0.9 * enemy-base neighbours + (own enemy base ? 0.88 : 0)) / 5, 1.2), 0.3)
export const computeThreat = (planet, id, { hasBase = false, attack = false } = {}) => {
  const preset = getPreset(planet, id);
  const useFormula = !preset || (!preset.requireUnlock && preset.difficulty === 0);
  if (!useFormula) return Math.min(Math.max(preset.difficulty / 10, 0), 1);
  const graph = SECTOR_DATA[planet]?.graph;
  const node = graph?.[id];
  if (!node) return null;
  const [gen, , near] = node;
  let sum = 1;
  for (const n of near) if (graph[n] && graph[n][0]) sum += 0.9;
  // hasEnemyBase(): (generated base && no preset) || (preset && captureWave == 0), unless the player holds the sector
  const enemyBase = (gen && !preset) || (preset && !preset.captureWave);
  if (enemyBase && (!hasBase || attack)) sum += 0.88;
  return Math.max(Math.min(sum / 5, 1.2), 0.3);
};

export const hasSectorData = (planet) => !!SECTOR_DATA[planet];

export const DIFFICULTIES = ["Low", "Medium", "High", "Extreme", "Eradication", "Unknown"];
export const DIFF_RANK = { Low: 0, Medium: 1, High: 2, Extreme: 3, Eradication: 4, Unknown: 5 };
export const THREAT_COLOR = { Low: "#38d39f", Medium: "#60a5fa", High: "#ffaa5f", Extreme: "#f43f5e", Eradication: "#d946ef", Unknown: "#475569" };
export const DIFF_COLOR = {
  Low: "text-[#38d39f]",
  Medium: "text-[#60a5fa]",
  High: "text-[#ffaa5f]",
  Extreme: "text-[#f43f5e]",
  Eradication: "text-[#d946ef]",
  Unknown: "text-slate-500",
};

export const STATUSES = ["captured", "under_attack", "lost"];
export const STATUS_META = {
  captured: { label: "Captured", dot: "bg-[#38d39f]", badge: "border-[#38d39f]/30 bg-[#38d39f]/10 text-[#38d39f]", color: "#38d39f" },
  under_attack: { label: "Under Attack", dot: "bg-[#ffaa5f] pulse-dot", badge: "border-[#ffaa5f]/30 bg-[#ffaa5f]/10 text-[#ffaa5f]", color: "#ffaa5f" },
  lost: { label: "Lost", dot: "bg-[#e55858]", badge: "border-[#e55858]/30 bg-[#e55858]/10 text-[#e55858]", color: "#e55858" },
  unclaimed: { label: "Unclaimed", dot: "bg-slate-600", badge: "border-slate-600/40 bg-slate-600/10 text-slate-400", color: "#475569" },
};
