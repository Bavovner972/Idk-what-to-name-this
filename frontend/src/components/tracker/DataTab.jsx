import React, { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { STATUS_META, DIFF_RANK, DIFF_COLOR } from "../../lib/presets";
import { fmtDate } from "./SectorCard";

const COLS = [
  { key: "name", label: "Sector" },
  { key: "sector_id", label: "ID" },
  { key: "difficulty", label: "Threat" },
  { key: "status", label: "Status" },
  { key: "wave", label: "Wave" },
  { key: "export_total", label: "Exports" },
  { key: "updated_at", label: "Updated" },
];

export default function DataTab({ sectors, onOpen }) {
  const [sort, setSort] = useState({ key: null, dir: 1 });

  const rows = useMemo(() => {
    if (!sort.key) return sectors;
    const k = sort.key;
    return [...sectors].sort((a, b) => {
      let va = a[k], vb = b[k];
      if (k === "difficulty") { va = DIFF_RANK[va]; vb = DIFF_RANK[vb]; }
      if (typeof va === "string") return va.localeCompare(vb) * sort.dir;
      return ((va ?? 0) - (vb ?? 0)) * sort.dir;
    });
  }, [sectors, sort]);

  const toggle = (key) =>
    setSort((s) => (s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : { key: null, dir: 1 }));

  return (
    <div className="panel panel-ticks overflow-hidden" data-testid="data-table">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#17181f]">
            <TableRow className="border-[#343845] hover:bg-transparent">
              {COLS.map((c) => (
                <TableHead key={c.key} className="h-10 whitespace-nowrap">
                  <button onClick={() => toggle(c.key)} className="label-ui inline-flex items-center gap-1 transition-colors hover:!text-[#ffd37f]" data-testid={`sort-${c.key}`}>
                    {c.label}
                    {sort.key === c.key ? (
                      sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => {
              const meta = STATUS_META[s.status] || STATUS_META.unclaimed;
              return (
                <TableRow key={s.id} onClick={() => onOpen(s)} className="cursor-pointer border-[#262932] text-[13px] transition-colors hover:bg-[#22242c]" data-testid={`data-row-${s.sector_id}`}>
                  <TableCell className="py-2 font-medium text-[#e2e8f0] whitespace-nowrap">{s.name}</TableCell>
                  <TableCell className="py-2 font-mono-ui text-[12px] text-[#64748b]">#{s.sector_id}</TableCell>
                  <TableCell className={`py-2 font-mono-ui text-[11px] font-semibold uppercase tracking-wide ${DIFF_COLOR[s.difficulty] || DIFF_COLOR.Unknown}`}>{s.difficulty}</TableCell>
                  <TableCell className="py-2">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[#cbd5e1]">
                      <i className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 font-mono-ui text-[#cbd5e1]">{s.wave}</TableCell>
                  <TableCell className="py-2 font-mono-ui text-[#94a3b8] whitespace-nowrap">{Math.round(s.export_total || 0)}/min</TableCell>
                  <TableCell className="py-2 font-mono-ui text-[11.5px] text-[#64748b]">{fmtDate(s.updated_at)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
