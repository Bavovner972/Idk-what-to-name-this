import React from "react";
import { Send, Package, Hash, Gem } from "lucide-react";
import { DIFF_COLOR, STATUS_META } from "../../lib/presets";

const fmtQty = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`);

export const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

export default function SectorCard({ sector: s, onClick, highlight }) {
  const meta = STATUS_META[s.status] || STATUS_META.unclaimed;
  const storage = Object.entries(s.items || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const onMap = highlight && (s.resources || []).includes(highlight);
  const stored = highlight ? s.items?.[highlight] || 0 : 0;
  return (
    <button
      onClick={onClick}
      data-testid={`sector-card-${s.sector_id}`}
      className="card-lift group flex w-full flex-col rounded-lg border border-slate-200 bg-white p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-[13px] font-semibold tracking-tightish text-slate-900">{s.name}</h3>
            {s.numbered && (
              <span className="inline-flex shrink-0 items-center rounded bg-slate-100 px-1 py-px font-mono-ui text-[9.5px] font-semibold text-slate-500">
                <Hash className="mr-px h-2 w-2" />
                {s.sector_id}
              </span>
            )}
          </div>
          <div className={`text-[11px] font-medium ${DIFF_COLOR[s.difficulty] || DIFF_COLOR.Unknown}`}>
            {s.difficulty === "Unknown" ? "Unknown threat" : s.difficulty}
            {s.wave > 0 && <span className="text-slate-400"> · wave {s.wave}</span>}
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium ${meta.badge}`}>{meta.label}</span>
      </div>

      <div className="mt-1.5 space-y-0.5 text-[11px] leading-snug text-slate-500">
        <div className="flex items-start gap-1.5" data-testid={`card-exports-${s.sector_id}`}>
          <Send className="mt-0.5 h-3 w-3 shrink-0 text-sky-500" />
          <span className="line-clamp-1">{s.export_text || "No exports"}</span>
        </div>
        <div className="flex items-start gap-1.5" data-testid={`card-storage-${s.sector_id}`}>
          <Package className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
          <span className="line-clamp-1">
            {storage.length ? (
              <>
                {storage.slice(0, 2).map(([k, v], i) => (
                  <span key={k}>
                    {i > 0 && ", "}
                    {k} <b className="font-semibold text-slate-700">{fmtQty(v)}</b>
                  </span>
                ))}
                {storage.length > 2 && <span className="text-slate-400"> +{storage.length - 2}</span>}
                {s.storage_capacity > 0 && <span className="text-slate-400"> / {fmtQty(s.storage_capacity)}</span>}
              </>
            ) : (
              "No storage"
            )}
          </span>
        </div>
        {highlight && (
          <div className="flex items-center gap-1.5 text-indigo-700" data-testid={`card-resource-${s.sector_id}`}>
            <Gem className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {highlight}: {onMap ? "on map" : ""}
              {onMap && stored > 0 ? " · " : ""}
              {stored > 0 ? `${fmtQty(stored)} stored` : ""}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-2 text-[10px] text-slate-400">Updated {fmtDate(s.updated_at)}</div>
    </button>
  );
}
