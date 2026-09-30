import React from "react";
import { Zap, Upload, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";

export default function Header({ planet, planets, onPlanet, onImport, importing }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <Zap className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <h1 className="text-[17px] font-bold tracking-tightish text-slate-900" data-testid="app-title">
              Serpulo Command
            </h1>
            <p className="hidden text-[12.5px] text-slate-500 sm:block">Mindustry Campaign Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={planet} onValueChange={onPlanet}>
            <SelectTrigger
              data-testid="planet-select"
              className="hidden sm:flex h-7 w-auto gap-1.5 rounded-full border-slate-200 bg-white px-2.5 font-mono-ui text-[11px] font-semibold uppercase tracking-wider text-slate-500 focus:ring-indigo-200"
            >
              <span>{planet} · V8</span>
            </SelectTrigger>
            <SelectContent>
              {planets.map((p) => (
                <SelectItem key={p} value={p} className="font-mono-ui text-xs uppercase" data-testid={`planet-option-${p}`}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={onImport}
            disabled={importing}
            data-testid="import-save-btn"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 text-[14.5px] font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-70"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="sm:hidden">Import</span>
            <span className="hidden sm:inline">Import Save</span>
          </button>
        </div>
      </div>
    </header>
  );
}
