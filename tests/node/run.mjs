import { loadSettingsFromFile, extractSectors } from "./parser.mjs";
import { computeThreat } from "./presets.mjs";
import { SECTOR_DATA } from "./sectorData.mjs";
import fs from "fs";
// 1. threat formula vs the game's own baseline (no player bases)
for (const pn of Object.keys(SECTOR_DATA)) {
  let bad = 0, n = 0;
  SECTOR_DATA[pn].graph.forEach(([g, t], id) => { n++; const c = computeThreat(pn, id); if (Math.abs(c - t) > 0.002) { bad++; if (bad < 4) console.log("mismatch", pn, id, c, t); } });
  console.log(`threat check ${pn}: ${n - bad}/${n} match`);
}
for (const f of process.argv.slice(2)) {
  const file = { arrayBuffer: async () => new Uint8Array(fs.readFileSync(f)).buffer };
  const { values, saves } = await loadSettingsFromFile(file);
  const r = extractSectors(values, saves);
  console.log("==", f, "saves:", saves ? JSON.stringify(Object.fromEntries(Object.entries(saves).map(([k, v]) => [k, [...v]]))) : null, "errors:", r.errors, "skipped:", r.skipped);
  for (const [p, l] of Object.entries(r.planets)) for (const s of l) console.log(" ", p, "#" + s.sector_id, s.name, "|", s.status, "|", s.difficulty, "| numbered:", s.numbered, "| wave", s.wave, "| exp:", s.export_text, "| items:", JSON.stringify(s.items).slice(0, 60));
}
