import React from "react";
import { Zap, Activity, CalendarDays, Hash } from "lucide-react";
import { DIFF_COLOR, STATUS_META } from "../../lib/presets";

export const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

export default function SectorCard({ sector: s, onClick }) {
  const meta = STATUS_META[s.status] || STATUS_META.unclaimed;
  return (
    <button
      onClick={onClick}
      data-testid={`sector-card-${s.sector_id}`}
      className="card-lift group flex w-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[15px] font-semibold tracking-tightish text-slate-900">{s.name}</h3>
            {s.numbered && (
              <span className="inline-flex shrink-0 items-center rounded bg-slate-100 px-1.5 py-0.5 font-mono-ui text-[10.5px] font-semibold text-slate-500">
                <Hash className="mr-0.5 h-2.5 w-2.5" />
                {s.sector_id}
              </span>
            )}
          </div>
          <div className={`mt-0.5 text-[12.5px] font-medium ${DIFF_COLOR[s.difficulty] || DIFF_COLOR.Unknown}`}>
            {s.difficulty === "Unknown" ? "Unknown threat" : s.difficulty}
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-[12.5px] text-slate-500">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-semibold text-slate-800">
            {s.power >= 0 ? "+" : ""}
            {s.power || 0}
          </span>
          <span>power</span>
        </div>
        <div className="flex items-start gap-2">
          <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2">{s.production_text || "No production logged"}</span>
        </div>
        {s.wave > 0 && <div className="text-slate-500">Wave {s.wave}</div>}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11.5px] text-slate-400">
          <CalendarDays className="h-3 w-3" />
          Updated {fmtDate(s.updated_at)}
        </div>
      </div>
    </button>
  );
}
