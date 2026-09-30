import React, { useMemo, useState } from "react";
import { Search, Gem, X } from "lucide-react";
import SectorCard from "./SectorCard";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "captured", label: "Captured" },
  { id: "under_attack", label: "Attacked" },
  { id: "lost", label: "Lost" },
];

const TYPE_FILTERS = [
  { id: "all", label: "All types" },
  { id: "named", label: "Named" },
  { id: "numbered", label: "Numbered" },
];

const Pill = ({ active, onClick, children, testid }) => (
  <button
    data-testid={testid}
    onClick={onClick}
    className={`h-7 rounded-full border px-3 text-[12.5px] font-medium transition-colors ${
      active
        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
    }`}
  >
    {children}
  </button>
);

// Map resources (ores/liquids on the sector) + anything sitting in core storage
export const sectorHasResource = (s, r) => (s.resources || []).includes(r) || (s.items?.[r] || 0) > 0;

export default function SectorsTab({ sectors, onOpen }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [resource, setResource] = useState("");

  const hasNumbered = sectors.some((s) => s.numbered);

  const resources = useMemo(() => {
    const counts = {};
    sectors.forEach((s) => {
      const set = new Set([...(s.resources || []), ...Object.keys(s.items || {}).filter((k) => s.items[k] > 0)]);
      set.forEach((r) => (counts[r] = (counts[r] || 0) + 1));
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sectors]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return sectors.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (type === "named" && s.numbered) return false;
      if (type === "numbered" && !s.numbered) return false;
      if (resource && !sectorHasResource(s, resource)) return false;
      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        String(s.sector_id) === term.replace("#", "") ||
        (s.export_text || "").toLowerCase().includes(term) ||
        (s.resources || []).some((k) => k.includes(term)) ||
        Object.keys(s.items || {}).some((k) => k.includes(term))
      );
    });
  }, [sectors, q, status, type, resource]);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              data-testid="sector-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sectors..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="relative w-full sm:w-[220px]">
            <Gem className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${resource ? "text-indigo-600" : "text-slate-400"}`} />
            <select
              data-testid="resource-filter"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className={`h-9 w-full appearance-none rounded-md border bg-white pl-9 pr-8 text-sm outline-none transition-shadow focus:ring-2 focus:ring-indigo-100 ${
                resource ? "border-indigo-300 text-indigo-700 font-medium" : "border-slate-200 text-slate-600"
              }`}
            >
              <option value="">Any resource</option>
              {resources.map(([r, n]) => (
                <option key={r} value={r}>
                  {r} ({n})
                </option>
              ))}
            </select>
            {resource ? (
              <button
                data-testid="resource-filter-clear"
                onClick={() => setResource("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
                aria-label="Clear resource filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasNumbered && (
            <div className="mr-1 flex items-center gap-1 rounded-full bg-slate-100 p-0.5" data-testid="type-filter">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.id}
                  data-testid={`type-filter-${t.id}`}
                  onClick={() => setType(t.id)}
                  className={`h-6 rounded-full px-2.5 text-[12px] font-medium transition-colors ${
                    type === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {STATUS_FILTERS.map((f) => (
            <Pill key={f.id} testid={`status-filter-${f.id}`} active={status === f.id} onClick={() => setStatus(f.id)}>
              {f.label}
            </Pill>
          ))}
        </div>
      </div>

      {resource && (
        <p className="mt-3 text-[12.5px] text-slate-500" data-testid="resource-filter-summary">
          <b className="font-semibold text-slate-800">{filtered.length}</b> sector{filtered.length === 1 ? "" : "s"} with{" "}
          <b className="font-semibold text-indigo-700">{resource}</b> (on the map or in core storage)
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-500">
          No sectors match your filters.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" data-testid="sector-grid">
          {filtered.map((s) => (
            <SectorCard key={s.id} sector={s} onClick={() => onOpen(s)} highlight={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
