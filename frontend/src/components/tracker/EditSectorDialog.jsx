import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { STATUSES, DIFFICULTIES } from "../../lib/presets";

const STATUS_LABEL = { captured: "captured", under_attack: "under attack", lost: "lost", unclaimed: "unclaimed" };

export default function EditSectorDialog({ sector, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (sector) {
      setForm({
        name: sector.name,
        status: sector.status,
        difficulty: sector.difficulty,
        power: sector.power ?? 0,
        wave: sector.wave ?? 0,
        output: sector.output ?? 0,
        production_text: sector.production_text || "",
        export_text: sector.export_text || "",
      });
      setConfirmDel(false);
    }
  }, [sector]);

  if (!sector || !form) return null;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave(sector.id, {
      name: form.name.trim() || sector.name,
      status: form.status,
      difficulty: form.difficulty,
      wave: parseInt(form.wave, 10) || 0,
      output: Number(form.output) || 0,
      production_text: form.production_text,
      export_text: form.export_text,
    });
  };

  return (
    <Dialog open={!!sector} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-[4px] border-[#343845] bg-[#1a1b20] text-[#e2e8f0]" data-testid="edit-sector-dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tightish">{sector.name}</DialogTitle>
          <DialogDescription className="font-mono-ui text-[11px] uppercase tracking-wider text-slate-400">
            {sector.planet} · sector #{sector.sector_id}
            {sector.numbered ? " · numbered" : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {sector.numbered && (
            <div className="space-y-1.5">
              <Label className="text-[13px]">Name</Label>
              <Input data-testid="edit-name" value={form.name} onChange={(e) => set("name")(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[13px]">Status</Label>
            <Select value={form.status} onValueChange={set("status")}>
              <SelectTrigger data-testid="edit-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Difficulty</Label>
            <Select value={form.difficulty} onValueChange={set("difficulty")}>
              <SelectTrigger data-testid="edit-difficulty"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Wave</Label>
            <Input data-testid="edit-wave" type="number" value={form.wave} onChange={(e) => set("wave")(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Output (items/min)</Label>
            <Input data-testid="edit-output" type="number" value={form.output} onChange={(e) => set("output")(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Exports</Label>
            <Input data-testid="edit-exports" value={form.export_text} onChange={(e) => set("export_text")(e.target.value)} placeholder="e.g. silicon 600.0/min" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Production</Label>
            <Input data-testid="edit-production" value={form.production_text} onChange={(e) => set("production_text")(e.target.value)} placeholder="e.g. silicon 1800.0/min" />
          </div>

          {sector.items && Object.keys(sector.items).length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[13px]">Core storage</Label>
              <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                {Object.entries(sector.items).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <span key={k} className="border border-[#343845] bg-[#15161a] px-2 py-0.5 font-mono-ui text-[11px] text-[#94a3b8]">
                    {k} <b className="text-[#e2e8f0]">{Math.round(v).toLocaleString()}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={onClose} data-testid="edit-cancel" className="btn-ghost h-9 px-3 text-[11px]">
              Cancel
            </button>
            <button type="submit" data-testid="edit-save" className="btn-primary h-9 px-3 text-[11px]">
              Save
            </button>
          </div>
          <button
            type="button"
            data-testid="edit-delete"
            onClick={() => (confirmDel ? onDelete(sector) : setConfirmDel(true))}
            className={`flex w-full items-center justify-center gap-1.5 text-[12.5px] font-medium transition-colors ${
              confirmDel ? "text-rose-600" : "text-slate-400 hover:text-rose-600"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmDel ? "Click again to remove this sector" : "Remove sector"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
