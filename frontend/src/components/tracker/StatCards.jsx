import React from "react";
import { ShieldCheck, Crosshair, BarChart3, Waves } from "lucide-react";

function Card({ label, value, sub, icon: Icon, iconClass, children, testid }) {
  return (
    <div
      data-testid={testid}
      className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-[0_6px_20px_-12px_rgba(15,23,42,0.18)] min-h-[140px]"
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-600">{label}</span>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>
      <div className="mt-1 text-[26px] font-bold leading-tight tracking-tightish text-slate-900">{value}</div>
      <div className="text-[12.5px] text-slate-500">{sub}</div>
      {children}
    </div>
  );
}

export default function StatCards({ stats }) {
  const { total, captured, attacked, lost, unclaimed, output, maxWave, numbered } = stats;
  const pct = total ? (captured / total) * 100 : 0;
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Card
        testid="stat-captured"
        label="Sectors Captured"
        value={captured}
        sub={`of ${total} tracked${numbered ? ` · ${numbered} numbered` : ""}`}
        icon={ShieldCheck}
        iconClass="text-emerald-500"
      >
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{captured}</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-amber-500" />{attacked || ""}</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-rose-500" />{lost}</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-slate-300" />{unclaimed}</span>
        </div>
      </Card>
      <Card
        testid="stat-attack"
        label="Under Attack"
        value={attacked}
        sub={`${lost} sectors lost`}
        icon={Crosshair}
        iconClass="text-amber-500"
      />
      <Card
        testid="stat-output"
        label="Total Output"
        value={output.toLocaleString("en-US", { useGrouping: false })}
        sub="items / min"
        icon={BarChart3}
        iconClass="text-indigo-600"
      />
      <Card
        testid="stat-waves"
        label="Max Waves Survived"
        value={maxWave}
        sub="across all sectors"
        icon={Waves}
        iconClass="text-indigo-600"
      />
    </div>
  );
}
