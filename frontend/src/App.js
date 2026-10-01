import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import Header from "./components/tracker/Header";
import StatCards from "./components/tracker/StatCards";
import SectorsTab from "./components/tracker/SectorsTab";
import PlanetTab from "./components/tracker/PlanetTab";
import AnalyticsTab from "./components/tracker/AnalyticsTab";
import DataTab from "./components/tracker/DataTab";
import EditSectorDialog from "./components/tracker/EditSectorDialog";
import FolderGuidanceDialog from "./components/tracker/FolderGuidanceDialog";
import EmptyState from "./components/tracker/EmptyState";
import MobileNav, { TABS } from "./components/tracker/MobileNav";
import { fetchSectors, fetchPlanets, importSectors, updateSector, deleteSector } from "./lib/api";
import { loadSettingsFromFile, extractSectors } from "./lib/mindustryParser";
import {
  isFileSystemAccessSupported,
  pickFolder,
  loadHandle,
  clearHandle,
  readFromFolder,
  validateAndSaveHandle,
} from "./lib/gameFolder";
import { DIFF_RANK } from "./lib/presets";

const STATUS_RANK = { under_attack: 0, captured: 1, lost: 2 };

// Unclaimed sectors (only viewed/nearby, never held) carry no useful data - the tracker ignores them.
const owned = (list) => list.filter((s) => s.status !== "unclaimed");

// Status first (under attack -> captured -> lost), then threat (low -> eradication, unknown last),
// then campaign order for named sectors / id for numbered ones.
const sortSectors = (list) =>
  [...owned(list)].sort((a, b) => {
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
  const [folderLinked, setFolderLinked] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderSyncing, setFolderSyncing] = useState(false);
  const [folderGuideOpen, setFolderGuideOpen] = useState(false);
  const folderHandleRef = useRef(null);
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

  // On mount: check if a folder handle was previously saved in IndexedDB
  useEffect(() => {
    if (!isFileSystemAccessSupported()) return;
    (async () => {
      try {
        const handle = await loadHandle();
        if (handle) {
          folderHandleRef.current = handle;
          setFolderLinked(true);
          setFolderName(handle.name || "");
        }
      } catch (error) {
        toast.error("Could not restore linked folder", {
          description: error.message || "Browser storage could not be accessed",
        });
      }
    })();
  }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    const t = toast.loading(`Reading ${file.name}...`);
    try {
      const { values, saves, remaps } = await loadSettingsFromFile(file);
      const { planets: found, errors, skipped } = extractSectors(values, saves, remaps);
      for (const p of Object.keys(found)) {
        found[p] = owned(found[p]);
        if (!found[p].length) delete found[p];
      }
      const names = Object.keys(found);
      if (!names.length) throw new Error("No captured sectors found in this file");
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

  const syncFromFolder = useCallback(async (handleOverride = null, dataOverride = null) => {
    const handle = handleOverride || folderHandleRef.current;
    if (!handle) return;
    setFolderSyncing(true);
    const t = toast.loading("Syncing from Mindustry folder...");
    try {
      const { values, saves, remaps } = dataOverride || await readFromFolder(handle);
      const { planets: found, errors, skipped } = extractSectors(values, saves, remaps);
      for (const p of Object.keys(found)) {
        found[p] = owned(found[p]);
        if (!found[p].length) delete found[p];
      }
      const names = Object.keys(found);
      if (!names.length) throw new Error("No captured sectors found in settings.bin");
      const summary = [];
      for (const p of names) {
        const res = await importSectors(p, found[p]);
        const numbered = found[p].filter((s) => s.numbered).length;
        summary.push(`${p}: ${res.total} sectors (${numbered} numbered)`);
      }
      toast.success("Folder synced", {
        id: t,
        description: summary.join(" | ") + (saves ? "" : " — no saves/ folder found, sector statuses may be less accurate"),
      });
      if (skipped.length) console.info("Ignored leftover sector data", skipped);
      if (errors.length) console.warn("Sector parse warnings", errors);
      const next = found[planet] ? planet : names.includes("serpulo") ? "serpulo" : names[0];
      if (next === planet) load(planet);
      else setPlanet(next);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        toast.error("Folder permission denied", {
          id: t,
          description: "Allow read access when prompted, or change the linked folder. Browser site settings may also revoke access.",
        });
      } else if (err.name === "SecurityError") {
        toast.error("Folder access blocked", {
          id: t,
          description: "The browser or page policy blocked folder access. Open this tracker in a supported browser and, if embedded, in a new tab.",
        });
      } else {
        toast.error("Sync failed", { id: t, description: err.message });
      }
    } finally {
      setFolderSyncing(false);
    }
  }, [planet, load]);

  const openFolderGuide = useCallback(() => setFolderGuideOpen(true), []);

  const linkFolder = useCallback(async () => {
    if (!isFileSystemAccessSupported()) {
      toast.error("Folder sync is not supported", {
        description: "Use a supported Chromium browser on a secure top-level page. Embedded pages may block the folder picker.",
      });
      return;
    }
    setFolderGuideOpen(false);
    setFolderSyncing(true);
    const t = toast.loading("Choose your Mindustry data folder...");
    try {
      const handle = await pickFolder();
      const data = await validateAndSaveHandle(handle);
      folderHandleRef.current = handle;
      setFolderLinked(true);
      setFolderName(handle.name);
      toast.success("Folder linked", { id: t, description: handle.name });
      await syncFromFolder(handle, data);
    } catch (err) {
      if (err.name !== "AbortError") {
        const isStorageError = err.message?.startsWith("Could not save the folder link");
        const isInvalidFolder = err.message?.includes("No settings.bin found");
        const isSecurityError = err.name === "SecurityError";
        toast.error(
          isStorageError ? "Could not save folder link" : isInvalidFolder ? "Invalid Mindustry folder" : isSecurityError ? "Folder picker blocked" : "Could not link folder",
          {
            id: t,
            description: isSecurityError
              ? "The browser or page policy blocked the picker. Open this tracker in a supported Chromium browser and, if embedded, in a new tab."
              : err.message,
          }
        );
      } else {
        toast.dismiss(t);
      }
    } finally {
      setFolderSyncing(false);
    }
  }, [syncFromFolder]);

  const unlinkFolder = useCallback(async () => {
    try {
      await clearHandle();
      folderHandleRef.current = null;
      setFolderLinked(false);
      setFolderName("");
      toast.success("Folder unlinked");
    } catch (error) {
      toast.error("Could not unlink folder", { description: error.message || "Browser storage could not be updated" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 pb-20 md:pb-10">
      <Header
        planet={planet}
        planets={planets}
        onPlanet={setPlanet}
        onImport={openImport}
        importing={importing}
        folderLinked={folderLinked}
        folderName={folderName}
        folderSyncing={folderSyncing}
        folderSupported={isFileSystemAccessSupported()}
        onLinkFolder={openFolderGuide}
        onSyncFolder={syncFromFolder}
        onChangeFolder={openFolderGuide}
        onUnlinkFolder={unlinkFolder}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".bin,.zip"
        className="hidden"
        onChange={onFile}
        data-testid="import-file-input"
      />
      <main className="mx-auto max-w-[1920px] px-4 sm:px-6 xl:px-10 2xl:px-14">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-32 rounded-lg border border-slate-200 bg-white animate-pulse" />
              ))}
            </div>
          ) : sectors.length === 0 ? (
            <EmptyState
              onImport={openImport}
              planet={planet}
              importing={importing}
              folderSupported={isFileSystemAccessSupported()}
              folderLinked={folderLinked}
              folderName={folderName}
              onLinkFolder={openFolderGuide}
              onSyncFolder={syncFromFolder}
              onUnlinkFolder={unlinkFolder}
              folderSyncing={folderSyncing}
            />
          ) : tab === "sectors" ? (
            <SectorsTab sectors={sectors} onOpen={setEditing} />
          ) : tab === "planet" ? (
            <PlanetTab planet={planet} sectors={sectors} onOpen={setEditing} />
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
      <FolderGuidanceDialog
        open={folderGuideOpen}
        onOpenChange={setFolderGuideOpen}
        onChoose={linkFolder}
        folderSyncing={folderSyncing}
      />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
