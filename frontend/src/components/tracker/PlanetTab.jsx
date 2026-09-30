import React, { useEffect, useMemo, useState } from "react";
import { Send, Package, Waves, Pencil, LocateFixed, Flag, Flame } from "lucide-react";
import PlanetGlobe, { faceVector, tileCenter, planetThreats } from "./PlanetGlobe";
import ResourceIcon from "./ResourceIcon";
import { STATUS_META, DIFF_COLOR, THREAT_COLOR, getPreset, computeThreat, threatLabel } from "../../lib/presets";

const STATUS_LEGEND = ["captured", "under_attack", "lost"];
const THREAT_LEGEND = ["Low", "Medium", "High", "Extreme", "Eradication"];
const SPIN_SPEED = 0.00012; // rad per ms

const fmtQty = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`);

function SectorPanel({ planet, id, sector, onOpen }) {
  if (id == null) {
    return (
      <p className="text-[13px] leading-relaxed text-[#94a3b8]" data-testid="planet-hint">
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
          <div className="label-ui">{planet} · #{id}</div>
          <h3 className="mt-0.5 font-heading text-[16px] font-bold uppercase tracking-tight text-[#e2e8f0]" data-testid="planet-sector-name">{name}</h3>
          <div className={`font-mono-ui text-[11px] font-semibold uppercase tracking-wide ${DIFF_COLOR[diff] || DIFF_COLOR.Unknown}`}>
            {diff === "Unknown" ? "Unknown threat" : `${diff} threat`}
          </div>
        </div>
        <span
          data-testid="planet-sector-status"
          className="shrink-0 rounded-[2px] border px-1.5 py-0.5 font-mono-ui text-[10px] font-semibold uppercase tracking-wide"
          style={{ borderColor: `${meta ? meta.color : "#475569"}66`, color: meta ? meta.color : "#94a3b8", background: `${meta ? meta.color : "#475569"}1a` }}
        >
          {meta ? meta.label : "Not captured"}
        </span>
      </div>
      {sector ? (
        <div className="mt-3 space-y-1.5 text-[12.5px] text-[#cbd5e1]">
          <div className="flex items-start gap-2"><Send className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#60a5fa]" /><span>{sector.export_text || "No exports logged"}</span></div>
          <div className="flex items-start gap-2">
            <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#64748b]" />
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {storage.length
                ? storage.slice(0, 6).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1"><ResourceIcon name={k} size={14} /><b className="font-mono-ui text-[#e2e8f0]">{fmtQty(v)}</b></span>
                  ))
                : "No storage logged"}
              {storage.length > 6 && <span className="text-[#64748b]">+{storage.length - 6} more</span>}
            </span>
          </div>
          {sector.wave > 0 && <div className="flex items-center gap-2"><Waves className="h-3.5 w-3.5 text-[#64748b]" />Wave {sector.wave}</div>}
          <button data-testid="planet-edit-btn" onClick={() => onOpen(sector)} className="btn-ghost mt-2 inline-flex h-8 items-center gap-1.5 px-3 text-[11px]">
            <Pencil className="h-3.5 w-3.5" /> Edit sector
          </button>
        </div>
      ) : (
        <p className="mt-3 text-[12.5px] text-[#94a3b8]">This sector isn't in your save yet.</p>
      )}
    </div>
  );
}

export default function PlanetTab({ planet, sectors, onOpen }) {
  const byId = useMemo(() => Object.fromEntries(sectors.map((s) => [s.sector_id, s])), [sectors]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("status");
  const [spinning, setSpinning] = useState(true);

  const home = useMemo(() => {
    const owned = sectors.map((s) => tileCenter(planet, s.sector_id)).filter(Boolean);
    if (!owned.length) return { yaw: 0, pitch: 0 };
    const sum = owned.reduce((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]], [0, 0, 0]);
    return faceVector(sum);
  }, [planet, sectors]);
  const [view, setView] = useState(home);
  useEffect(() => { setView(home); setSelected(null); setSpinning(true); }, [home]);

  // idle spin like the in-game menu planet; stops as soon as the user grabs it
  useEffect(() => {
    if (!spinning) return undefined;
    let raf;
    let last = performance.now();
    const step = (t) => {
      const dt = Math.min(t - last, 50);
      last = t;
      setView((v) => ({ ...v, yaw: v.yaw + dt * SPIN_SPEED }));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [spinning]);

  const threatCounts = useMemo(() => {
    const t = planetThreats(planet, byId);
    return THREAT_LEGEND.map((l) => [l, t.filter((x) => x === l).length]);
  }, [planet, byId]);
  const statusCounts = STATUS_LEGEND.map((st) => [st, sectors.filter((s) => s.status === st).length]);

  return (
    <div className="panel panel-ticks overflow-hidden !bg-[#0e0f13]" data-testid="planet-tab">
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="relative flex items-center justify-center p-4 sm:p-8">
          <PlanetGlobe
            planet={planet}
            byId={byId}
            view={view}
            onView={setView}
            selected={selected}
            onSelect={setSelected}
            mode={mode}
            onGrab={() => setSpinning(false)}
          />
          <div className="absolute left-4 top-4 flex items-center gap-0.5 rounded-[3px] border border-[#343845] bg-[#15161a]/90 p-0.5 backdrop-blur" data-testid="planet-mode-toggle">
            {[
              { id: "status", label: "Status", icon: Flag },
              { id: "threat", label: "Threat", icon: Flame },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  data-testid={`planet-mode-${m.id}`}
                  onClick={() => setMode(m.id)}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-[2px] px-2.5 font-mono-ui text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    mode === m.id ? "bg-[#ffd37f] text-[#121317]" : "text-[#94a3b8] hover:text-[#e2e8f0]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {m.label}
                </button>
              );
            })}
          </div>
          <button
            data-testid="planet-recenter-btn"
            onClick={() => { setView(home); setSpinning(true); }}
            className="btn-ghost absolute right-4 top-4 inline-flex h-8 items-center gap-1.5 px-3 text-[11px] !bg-[#15161a]/90 backdrop-blur"
          >
            <LocateFixed className="h-3.5 w-3.5" /> Recenter
          </button>
          {spinning && (
            <span className="absolute bottom-4 left-4 label-ui !text-[#64748b]" data-testid="planet-spinning">auto-rotate · grab to stop</span>
          )}
        </div>
        <aside className="border-t border-[#343845] p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between">
            <h2 className="label-ui !text-[#ffd37f]">{planet}</h2>
            <span className="font-mono-ui text-[11px] text-[#64748b]" data-testid="planet-owned-count">{sectors.length} sectors in save</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" data-testid="planet-legend">
            {mode === "status" ? (
              <>
                {statusCounts.map(([st, n]) => (
                  <span key={st} className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2a2d37] bg-[#15161a] px-2 py-1 font-mono-ui text-[11px] text-[#cbd5e1]">
                    <i className="h-2 w-2 rounded-full" style={{ background: STATUS_META[st].color }} />
                    {STATUS_META[st].label} <b className="text-[#e2e8f0]">{n}</b>
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2a2d37] bg-[#15161a] px-2 py-1 font-mono-ui text-[11px] text-[#94a3b8]">
                  <i className="h-2 w-2 rounded-full bg-slate-600" /> Not captured
                </span>
              </>
            ) : (
              threatCounts.map(([l, n]) => (
                <span key={l} className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2a2d37] bg-[#15161a] px-2 py-1 font-mono-ui text-[11px] text-[#cbd5e1]" data-testid={`threat-legend-${l}`}>
                  <i className="h-2 w-2 rounded-full" style={{ background: THREAT_COLOR[l] }} />
                  {l} <b className="text-[#e2e8f0]">{n}</b>
                </span>
              ))
            )}
          </div>
          {mode === "threat" && (
            <p className="mt-2 text-[11.5px] text-[#64748b]">Whole-planet threat map. Your sectors keep a bright outline; unexplored tiles are dimmed.</p>
          )}
          <div className="mt-5 border-t border-[#343845] pt-5">
            <SectorPanel planet={planet} id={selected} sector={selected != null ? byId[selected] : null} onOpen={onOpen} />
          </div>
        </aside>
      </div>
    </div>
  );
}
