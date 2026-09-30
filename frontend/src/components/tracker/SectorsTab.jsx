import React, { useMemo, useState } from "react";
import { Search, Gem, X, ChevronDown } from "lucide-react";
import SectorCard from "./SectorCard";
import ResourceIcon from "./ResourceIcon";

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
  <button data-testid={testid} onClick={onClick} className={`pill h-7 px-3 ${active ? "pill-active" : ""}`}>
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
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            <input
              data-testid="sector-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sectors..."
              className="input-dark h-9 w-full pl-9 pr-3 text-sm"
            />
          </div>
          <div className="relative w-full sm:w-[230px]">
            <span className="pointer-events-none absolute left-2.5 top-1/2 flex -translate-y-1/2 items-center">
              {resource ? <ResourceIcon name={resource} size={18} /> : <Gem className="h-4 w-4 text-[#64748b]" />}
            </span>
            <select
              data-testid="resource-filter"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className={`input-dark h-9 w-full appearance-none pl-9 pr-8 text-sm ${resource ? "!border-[#ffd37f]/70 font-medium !text-[#ffd37f]" : "text-[#94a3b8]"}`}
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
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#94a3b8] hover:text-[#ffd37f]"
                aria-label="Clear resource filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasNumbered && (
            <div className="mr-1 flex items-center gap-0.5 rounded-[3px] border border-[#343845] bg-[#15161a] p-0.5" data-testid="type-filter">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.id}
                  data-testid={`type-filter-${t.id}`}
                  onClick={() => setType(t.id)}
                  className={`h-6 rounded-[2px] px-2.5 font-mono-ui text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    type === t.id ? "bg-[#343845] text-[#e2e8f0]" : "text-[#64748b] hover:text-[#e2e8f0]"
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
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-[#94a3b8]" data-testid="resource-filter-summary">
          <b className="font-mono-ui font-semibold text-[#e2e8f0]">{filtered.length}</b> sector{filtered.length === 1 ? "" : "s"} with
          <ResourceIcon name={resource} size={14} />
          <b className="font-semibold text-[#ffd37f]">{resource}</b> (on the map or in core storage)
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="mt-10 border border-dashed border-[#343845] bg-[#15161a] py-16 text-center font-mono-ui text-sm uppercase tracking-wider text-[#64748b]">
          No sectors match your filters
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
