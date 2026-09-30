import React from "react";
import { ShieldCheck, Crosshair, BarChart3, Waves, Send } from "lucide-react";
import ResourceIcon from "./ResourceIcon";

function Card({ label, value, sub, icon: Icon, iconClass, children, testid }) {
  return (
    <div data-testid={testid} className="panel panel-ticks min-h-[132px] p-4 transition-colors hover:bg-[#1d1f26]">
      <div className="flex items-start justify-between">
        <span className="label-ui">{label}</span>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>
      <div className="mt-1.5 font-heading text-[28px] font-bold leading-none tracking-tight text-[#e2e8f0]">{value}</div>
      <div className="mt-1 text-[12.5px] text-[#94a3b8]">{sub}</div>
      {children}
    </div>
  );
}

export default function StatCards({ stats }) {
  const { total, captured, attacked, lost, output, maxWave, numbered, exportTotal = 0, exportsByItem = [] } = stats;
  const pct = total ? (captured / total) * 100 : 0;
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Card
        testid="stat-captured"
        label="Sectors Captured"
        value={captured}
        sub={`of ${total} tracked${numbered ? ` · ${numbered} numbered` : ""}`}
        icon={ShieldCheck}
        iconClass="text-[#38d39f]"
      >
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-[#262932]">
          <div className="h-full bg-[#38d39f] transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center gap-3 font-mono-ui text-[11px] text-[#94a3b8]">
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#38d39f]" />{captured}</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#ffaa5f]" />{attacked}</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#e55858]" />{lost}</span>
        </div>
      </Card>
      <Card testid="stat-attack" label="Under Attack" value={attacked} sub={`${lost} sectors lost`} icon={Crosshair} iconClass="text-[#ffaa5f]" />
      <Card
        testid="stat-output"
        label="Total Output"
        value={output.toLocaleString("en-US", { useGrouping: false })}
        sub="items / min"
        icon={BarChart3}
        iconClass="text-[#ffd37f]"
      />
      <Card testid="stat-waves" label="Max Waves Survived" value={maxWave} sub="across all sectors" icon={Waves} iconClass="text-[#60a5fa]" />
      <div data-testid="stat-exports" className="panel col-span-2 p-4 lg:col-span-4">
        <div className="flex items-center justify-between">
          <span className="label-ui">Total Exports by Resource</span>
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] text-[#94a3b8]">
              <b className="font-heading text-[15px] font-bold text-[#ffd37f]" data-testid="stat-exports-total">{exportTotal}</b> items / min
            </span>
            <Send className="h-4 w-4 text-[#60a5fa]" />
          </div>
        </div>
        {exportsByItem.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {exportsByItem.map((e) => (
              <span
                key={e.item}
                data-testid={`export-chip-${e.item}`}
                className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2a2d37] bg-[#15161a] px-2 py-1 text-[12px] text-[#cbd5e1]"
              >
                <ResourceIcon name={e.item} size={16} />
                {e.item}
                <b className="font-mono-ui font-semibold text-[#e2e8f0]">{e.rate.toLocaleString()}/min</b>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[12.5px] text-[#64748b]">No exports logged — sectors only record exports while launch pads are active.</p>
        )}
      </div>
    </div>
  );
}
