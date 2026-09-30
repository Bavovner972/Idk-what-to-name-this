import React, { useEffect, useMemo, useState } from "react";
import { Send, Package, Waves, Pencil, LocateFixed } from "lucide-react";
import PlanetGlobe, { faceVector, tileCenter } from "./PlanetGlobe";
import { STATUS_META, DIFF_COLOR, getPreset, computeThreat, threatLabel } from "../../lib/presets";

const LEGEND = ["captured", "under_attack", "lost"];

const fmtQty = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`);

function SectorPanel({ planet, id, sector, onOpen }) {
  if (id == null) {
    return (
      <p className="text-[13px] leading-relaxed text-slate-400" data-testid="planet-hint">
        Drag to rotate the planet. Click any tile to inspect it — coloured tiles are the sectors from your save.
      </p>
    );
  }
  const preset = getPreset(planet, id);
  const name = sector?.name || (preset?.name ?? `Sector ${id}`);
  const meta = sector ? STATUS_META[sector.status] : null;
  const diff = sector ? sector.difficulty : threatLabel(computeThreat(planet, id));
  const storage = Object.entries(sector?.items || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return (
    <div data-testid="planet-sector-panel">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono-ui text-[10.5px] uppercase tracking-wider text-slate-500">{planet} · #{id}</div>
          <h3 className="mt-0.5 text-[17px] font-semibold tracking-tightish text-white" data-testid="planet-sector-name">{name}</h3>
          <div className={`text-[12.5px] font-medium ${DIFF_COLOR[diff] || DIFF_COLOR.Unknown}`}>{diff === "Unknown" ? "Unknown threat" : `${diff} threat`}</div>
        </div>
        <span
          data-testid="planet-sector-status"
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: meta ? meta.color : "#475569", color: "#fff" }}
        >
          {meta ? meta.label : "Not captured"}
        </span>
      </div>
      {sector ? (
        <div className="mt-3 space-y-1.5 text-[12.5px] text-slate-300">
          <div className="flex items-start gap-2"><Send className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" /><span>{sector.export_text || "No exports logged"}</span></div>
          <div className="flex items-start gap-2">
            <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              {storage.length
                ? storage.slice(0, 4).map(([k, v], i) => (
                    <span key={k}>{i > 0 && ", "}{k} <b className="text-white">{fmtQty(v)}</b></span>
                  ))
                : "No storage logged"}
              {storage.length > 4 && <span className="text-slate-500"> +{storage.length - 4} more</span>}
            </span>
          </div>
          {sector.wave > 0 && <div className="flex items-center gap-2"><Waves className="h-3.5 w-3.5 text-slate-400" />Wave {sector.wave}</div>}
          <button
            data-testid="planet-edit-btn"
            onClick={() => onOpen(sector)}
            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-md bg-white/10 px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-white/20"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit sector
          </button>
        </div>
      ) : (
        <p className="mt-3 text-[12.5px] text-slate-400">This sector isn't in your save yet.</p>
      )}
    </div>
  );
}

export default function PlanetTab({ planet, sectors, onOpen }) {
  const byId = useMemo(() => Object.fromEntries(sectors.map((s) => [s.sector_id, s])), [sectors]);
  const [selected, setSelected] = useState(null);

  const home = useMemo(() => {
    const owned = sectors.map((s) => tileCenter(planet, s.sector_id)).filter(Boolean);
    if (!owned.length) return { yaw: 0, pitch: 0 };
    const sum = owned.reduce((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]], [0, 0, 0]);
    return faceVector(sum);
  }, [planet, sectors]);
  const [view, setView] = useState(home);
  useEffect(() => { setView(home); setSelected(null); }, [home]);

  const counts = LEGEND.map((st) => [st, sectors.filter((s) => s.status === st).length]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1020] text-slate-200 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.8)]" data-testid="planet-tab">
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="relative flex items-center justify-center p-4 sm:p-8">
          <PlanetGlobe planet={planet} byId={byId} view={view} onView={setView} selected={selected} onSelect={setSelected} />
          <button
            data-testid="planet-recenter-btn"
            onClick={() => setView(home)}
            className="absolute right-4 top-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[12px] font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <LocateFixed className="h-3.5 w-3.5" /> Recenter
          </button>
        </div>
        <aside className="border-t border-slate-800 p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between">
            <h2 className="font-mono-ui text-[11px] font-semibold uppercase tracking-wider text-slate-400">{planet}</h2>
            <span className="text-[12px] text-slate-500" data-testid="planet-owned-count">{sectors.length} sectors in save</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="planet-legend">
            {counts.map(([st, n]) => (
              <span key={st} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11.5px] text-slate-300">
                <i className="h-2 w-2 rounded-full" style={{ background: STATUS_META[st].color }} />
                {STATUS_META[st].label} <b className="text-white">{n}</b>
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11.5px] text-slate-400">
              <i className="h-2 w-2 rounded-full bg-slate-500" /> Not captured
            </span>
          </div>
          <div className="mt-5 border-t border-slate-800 pt-5">
            <SectorPanel planet={planet} id={selected} sector={selected != null ? byId[selected] : null} onOpen={onOpen} />
          </div>
        </aside>
      </div>
    </div>
  );
}
