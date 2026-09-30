import React from "react";
import { Send, Package, CalendarDays, Hash } from "lucide-react";
import { DIFF_COLOR, STATUS_META } from "../../lib/presets";

const fmtQty = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`);

export const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

export default function SectorCard({ sector: s, onClick }) {
  const meta = STATUS_META[s.status] || STATUS_META.unclaimed;
  const storage = Object.entries(s.items || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
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
        <div className="flex items-start gap-2" data-testid={`card-exports-${s.sector_id}`}>
          <Send className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
          <span className="line-clamp-2">{s.export_text || "No exports logged"}</span>
        </div>
        <div className="flex items-start gap-2" data-testid={`card-storage-${s.sector_id}`}>
          <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2">
            {storage.length ? (
              <>
                {storage.slice(0, 3).map(([k, v], i) => (
                  <span key={k}>
                    {i > 0 && ", "}
                    {k} <b className="font-semibold text-slate-700">{fmtQty(v)}</b>
                  </span>
                ))}
                {storage.length > 3 && <span className="text-slate-400"> +{storage.length - 3} more</span>}
                {s.storage_capacity > 0 && <span className="text-slate-400"> / {fmtQty(s.storage_capacity)} cap</span>}
              </>
            ) : (
              "No storage logged"
            )}
          </span>
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
