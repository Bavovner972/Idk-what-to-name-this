import React from "react";
import { Send, Package, Hash } from "lucide-react";
import { DIFF_COLOR, STATUS_META } from "../../lib/presets";
import ResourceIcon from "./ResourceIcon";

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
      className="card-lift panel group relative flex w-full flex-col overflow-hidden p-3 pl-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd37f]/50"
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: meta.color }} />
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-[13px] font-semibold tracking-tightish text-[#e2e8f0]">{s.name}</h3>
            {s.numbered && (
              <span className="inline-flex shrink-0 items-center rounded-[2px] border border-[#343845] bg-[#15161a] px-1 py-px font-mono-ui text-[9.5px] font-semibold text-[#94a3b8]">
                <Hash className="mr-px h-2 w-2" />
                {s.sector_id}
              </span>
            )}
          </div>
          <div className={`font-mono-ui text-[10.5px] font-semibold uppercase tracking-wide ${DIFF_COLOR[s.difficulty] || DIFF_COLOR.Unknown}`}>
            {s.difficulty === "Unknown" ? "Unknown threat" : s.difficulty}
            {s.wave > 0 && <span className="font-normal normal-case tracking-normal text-[#64748b]"> · wave {s.wave}</span>}
          </div>
        </div>
        <span className={`shrink-0 rounded-[2px] border px-1.5 py-px font-mono-ui text-[9.5px] font-semibold uppercase tracking-wide ${meta.badge}`}>{meta.label}</span>
      </div>

      <div className="mt-2 space-y-1 text-[11px] leading-snug text-[#94a3b8]">
        <div className="flex items-start gap-1.5" data-testid={`card-exports-${s.sector_id}`}>
          <Send className="mt-0.5 h-3 w-3 shrink-0 text-[#60a5fa]" />
          <span className="line-clamp-1">{s.export_text || "No exports"}</span>
        </div>
        <div className="flex items-start gap-1.5" data-testid={`card-storage-${s.sector_id}`}>
          <Package className="mt-0.5 h-3 w-3 shrink-0 text-[#64748b]" />
          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {storage.length ? (
              <>
                {storage.slice(0, 3).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1 whitespace-nowrap">
                    <ResourceIcon name={k} size={13} />
                    <b className="font-mono-ui font-semibold text-[#cbd5e1]">{fmtQty(v)}</b>
                  </span>
                ))}
                {storage.length > 3 && <span className="text-[#64748b]">+{storage.length - 3}</span>}
                {s.storage_capacity > 0 && <span className="text-[#64748b]">/ {fmtQty(s.storage_capacity)}</span>}
              </>
            ) : (
              "No storage"
            )}
          </span>
        </div>
        {highlight && (
          <div className="flex items-center gap-1.5 text-[#ffd37f]" data-testid={`card-resource-${s.sector_id}`}>
            <ResourceIcon name={highlight} size={13} />
            <span className="truncate">
              {highlight}: {onMap ? "on map" : ""}
              {onMap && stored > 0 ? " · " : ""}
              {stored > 0 ? `${fmtQty(stored)} stored` : ""}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-2 font-mono-ui text-[9.5px] uppercase tracking-wider text-[#64748b]">Updated {fmtDate(s.updated_at)}</div>
    </button>
  );
}
