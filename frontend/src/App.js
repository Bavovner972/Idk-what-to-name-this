import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import Header from "./components/tracker/Header";
import StatCards from "./components/tracker/StatCards";
import SectorsTab from "./components/tracker/SectorsTab";
import AnalyticsTab from "./components/tracker/AnalyticsTab";
import DataTab from "./components/tracker/DataTab";
import EditSectorDialog from "./components/tracker/EditSectorDialog";
import EmptyState from "./components/tracker/EmptyState";
import MobileNav, { TABS } from "./components/tracker/MobileNav";
import { fetchSectors, fetchPlanets, importSectors, updateSector, deleteSector } from "./lib/api";
import { loadSettingsFromFile, extractSectors } from "./lib/mindustryParser";
import { DIFF_RANK } from "./lib/presets";

const STATUS_RANK = { under_attack: 0, captured: 1, unclaimed: 2, lost: 3 };

// Status first (under attack -> captured -> unclaimed -> lost), then threat (low -> eradication, unknown last),
// then campaign order for named sectors / id for numbered ones.
const sortSectors = (list) =>
  [...list].sort((a, b) => {
    const s = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (s) return s;
    const d = (DIFF_RANK[a.difficulty] ?? 9) - (DIFF_RANK[b.difficulty] ?? 9);
    if (d) return d;
    if (a.numbered !== b.numbered) return a.numbered ? 1 : -1;
    if (!a.numbered) return (a.order ?? 0) - (b.order ?? 0);
    return a.sector_id - b.sector_id;
  });

function App() {
  const [planet, setPlanet] = useState(() => localStorage.getItem("sc_planet") || "serpulo");
  const [planets, setPlanets] = useState(["serpulo"]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [tab, setTab] = useState("sectors");
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const [list, pl] = await Promise.all([fetchSectors(p), fetchPlanets()]);
      setSectors(sortSectors(list));
      const merged = Array.from(new Set(["serpulo", ...pl]));
      setPlanets(merged);
    } catch (e) {
      toast.error("Could not load sectors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sc_planet", planet);
    load(planet);
  }, [planet, load]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    const t = toast.loading(`Reading ${file.name}...`);
    try {
      const { values, saves } = await loadSettingsFromFile(file);
      const { planets: found, errors, skipped } = extractSectors(values, saves);
      const names = Object.keys(found);
      if (!names.length) throw new Error("No campaign sector data found in this file");
      const summary = [];
      for (const p of names) {
        const res = await importSectors(p, found[p]);
        const numbered = found[p].filter((s) => s.numbered).length;
        summary.push(`${p}: ${res.total} sectors (${numbered} numbered)`);
      }
      toast.success("Save imported", {
        id: t,
        description:
          summary.join(" | ") +
          (skipped.length ? ` — ignored ${skipped.length} leftover pre-v8 sector entr${skipped.length === 1 ? "y" : "ies"}` : "") +
          (saves ? "" : " — tip: import the full .zip for the most accurate sector status"),
      });
      if (skipped.length) console.info("Ignored leftover sector data", skipped);
      if (errors.length) console.warn("Sector parse warnings", errors);
      const next = found[planet] ? planet : names.includes("serpulo") ? "serpulo" : names[0];
      if (next === planet) load(planet);
      else setPlanet(next);
    } catch (err) {
      toast.error("Import failed", { id: t, description: err.message });
    } finally {
      setImporting(false);
    }
  };

  const onSave = async (id, data) => {
    try {
      const updated = await updateSector(id, data);
      setSectors((prev) => sortSectors(prev.map((s) => (s.id === id ? updated : s))));
      toast.success(`${updated.name} updated`);
      setEditing(null);
    } catch (e) {
      toast.error("Save failed");
    }
  };

  const onDelete = async (sector) => {
    try {
      await deleteSector(sector.id);
      setSectors((prev) => prev.filter((s) => s.id !== sector.id));
      toast.success(`${sector.name} removed`);
      setEditing(null);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const stats = useMemo(() => {
    const count = (st) => sectors.filter((s) => s.status === st).length;
    return {
      total: sectors.length,
      captured: count("captured"),
      attacked: count("under_attack"),
      lost: count("lost"),
      unclaimed: count("unclaimed"),
      output: Math.round(sectors.reduce((a, s) => a + (s.output || 0), 0)),
      maxWave: sectors.reduce((m, s) => Math.max(m, s.wave || 0), 0),
      numbered: sectors.filter((s) => s.numbered).length,
      exportTotal: Math.round(sectors.reduce((a, s) => a + (s.export_total || 0), 0)),
      exportsByItem: (() => {
        const acc = {};
        sectors.forEach((s) => (s.exports || []).forEach((e) => (acc[e.item] = (acc[e.item] || 0) + e.rate)));
        return Object.entries(acc)
          .map(([item, rate]) => ({ item, rate: Math.round(rate) }))
          .sort((a, b) => b.rate - a.rate);
      })(),
    };
  }, [sectors]);

  const openImport = () => fileRef.current?.click();

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 pb-20 md:pb-10">
      <Header
        planet={planet}
        planets={planets}
        onPlanet={setPlanet}
        onImport={openImport}
        importing={importing}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".bin,.zip"
        className="hidden"
        onChange={onFile}
        data-testid="import-file-input"
      />
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <StatCards stats={stats} />

        <div className="mt-6 hidden md:flex border-b border-slate-200" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-2.5 text-[15px] font-medium transition-colors ${
                tab === t.id ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
              <span
                className={`absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-indigo-600 transition-opacity ${
                  tab === t.id ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="mt-5 md:mt-5 animate-fade-in" key={tab + planet}>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl border border-slate-200 bg-white animate-pulse" />
              ))}
            </div>
          ) : sectors.length === 0 ? (
            <EmptyState onImport={openImport} planet={planet} importing={importing} />
          ) : tab === "sectors" ? (
            <SectorsTab sectors={sectors} onOpen={setEditing} />
          ) : tab === "analytics" ? (
            <AnalyticsTab sectors={sectors} stats={stats} />
          ) : (
            <DataTab sectors={sectors} onOpen={setEditing} />
          )}
        </div>
      </main>

      <MobileNav tab={tab} onTab={setTab} />
      <EditSectorDialog
        sector={editing}
        onClose={() => setEditing(null)}
        onSave={onSave}
        onDelete={onDelete}
      />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
