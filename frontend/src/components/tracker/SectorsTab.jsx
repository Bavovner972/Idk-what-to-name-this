import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import SectorCard from "./SectorCard";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "captured", label: "Captured" },
  { id: "under_attack", label: "Attacked" },
  { id: "lost", label: "Lost" },
  { id: "unclaimed", label: "Unclaimed" },
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

export default function SectorsTab({ sectors, onOpen }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const hasNumbered = sectors.some((s) => s.numbered);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return sectors.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (type === "named" && s.numbered) return false;
      if (type === "numbered" && !s.numbered) return false;
      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        String(s.sector_id) === term.replace("#", "") ||
        (s.production_text || "").toLowerCase().includes(term)
      );
    });
  }, [sectors, q, status, type]);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            data-testid="sector-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sectors..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
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

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-500">
          No sectors match your filters.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="sector-grid">
          {filtered.map((s) => (
            <SectorCard key={s.id} sector={s} onClick={() => onOpen(s)} />
          ))}
        </div>
      )}
    </div>
  );
}
