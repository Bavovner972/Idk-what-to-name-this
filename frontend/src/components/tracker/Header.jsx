import React from "react";
import { Hexagon, Upload, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";

export default function Header({ planet, planets, onPlanet, onImport, importing }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#343845] bg-[#121317]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-4 sm:px-6 xl:px-10 2xl:px-14">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center border border-[#ffd37f]/60 bg-[#ffd37f]/10 text-[#ffd37f]">
            <Hexagon className="h-5 w-5" strokeWidth={2.2} />
            <span className="absolute -bottom-px -right-px h-2 w-2 border-b-2 border-r-2 border-[#ffd37f]" />
          </div>
          <div className="leading-tight">
            <h1 className="font-heading text-[16px] font-bold uppercase tracking-wider text-[#e2e8f0]" data-testid="app-title">
              Serpulo <span className="text-[#ffd37f]">Command</span>
            </h1>
            <p className="label-ui hidden sm:block !text-[#64748b]">Mindustry Campaign Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={planet} onValueChange={onPlanet}>
            <SelectTrigger
              data-testid="planet-select"
              className="hidden sm:flex h-8 w-auto gap-1.5 rounded-[3px] border-[#343845] bg-[#15161a] px-2.5 font-mono-ui text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8] hover:text-[#e2e8f0] focus:ring-[#ffd37f]/40"
            >
              <span>{planet} · V8</span>
            </SelectTrigger>
            <SelectContent className="border-[#343845] bg-[#1a1b20]">
              {planets.map((p) => (
                <SelectItem key={p} value={p} className="font-mono-ui text-xs uppercase focus:bg-[#22242c] focus:text-[#ffd37f]" data-testid={`planet-option-${p}`}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={onImport}
            disabled={importing}
            data-testid="import-save-btn"
            className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[12px] disabled:opacity-70"
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
