import React, { useMemo } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { STATUS_META, STATUSES, DIFF_RANK } from "../../lib/presets";

const Panel = ({ title, children, className = "", testid, right }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`} data-testid={testid}>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[14.5px] font-semibold tracking-tightish text-slate-900">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const tip = {
  contentStyle: { borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 6px 20px -10px rgba(15,23,42,.2)" },
  cursor: { fill: "rgba(99,102,241,0.06)" },
};

export default function AnalyticsTab({ sectors }) {
  const statusData = useMemo(
    () =>
      STATUSES.map((s) => ({
        key: s,
        name: STATUS_META[s].label.toLowerCase(),
        value: sectors.filter((x) => x.status === s).length,
        color: STATUS_META[s].color,
      })),
    [sectors]
  );

  const diffData = useMemo(() => {
    const order = ["Low", "Medium", "High", "Extreme", "Eradication"];
    const hasUnknown = sectors.some((s) => s.difficulty === "Unknown");
    if (hasUnknown) order.push("Unknown");
    return order.map((d) => ({ name: d, count: sectors.filter((s) => s.difficulty === d).length }));
  }, [sectors]);

  const waveData = useMemo(
    () =>
      [...sectors]
        .filter((s) => s.wave > 0)
        .sort((a, b) => b.wave - a.wave || DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty])
        .slice(0, 10)
        .map((s) => ({ name: s.name, wave: s.wave })),
    [sectors]
  );

  const resourceData = useMemo(() => {
    const acc = {};
    sectors.forEach((s) => (s.production || []).forEach((p) => (acc[p.item] = (acc[p.item] || 0) + p.rate)));
    return Object.entries(acc)
      .map(([item, rate]) => ({ item, rate: Math.round(rate) }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 12);
  }, [sectors]);

  const namedVsNumbered = useMemo(() => {
    const named = sectors.filter((s) => !s.numbered);
    const numbered = sectors.filter((s) => s.numbered);
    const cap = (l) => l.filter((s) => s.status === "captured").length;
    return { named: named.length, numbered: numbered.length, namedCap: cap(named), numCap: cap(numbered) };
  }, [sectors]);

  const pieData = statusData.some((d) => d.value > 0) ? statusData : [{ name: "none", value: 1, color: "#e2e8f0" }];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Sector Status" testid="chart-status">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={1} stroke="#fff" strokeWidth={2}>
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip {...tip} />
                <Legend
                  payload={statusData.map((d) => ({ value: d.name, type: "square", color: d.color, id: d.key }))}
                  wrapperStyle={{ fontSize: 15 }}
                  formatter={(v, entry) => <span style={{ color: entry.color }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Difficulty Distribution" testid="chart-difficulty">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diffData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip {...tip} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Top Sectors by Wave Survived" testid="chart-waves">
        {waveData.length ? (
          <div style={{ height: Math.max(160, waveData.length * 30 + 30) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waveData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11, fill: "#334155" }} />
                <Tooltip {...tip} />
                <Bar dataKey="wave" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No wave data yet</p>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Output by Resource" className="lg:col-span-2" testid="chart-resources" right={<span className="text-[11px] text-slate-400">items / min</span>}>
          {resourceData.length ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="item" tick={{ fontSize: 10.5, fill: "#475569" }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No production logged yet</p>
          )}
        </Panel>
        <Panel title="Named vs Numbered" testid="chart-named-numbered">
          <div className="space-y-4 pt-1">
            {[
              { label: "Named sectors", total: namedVsNumbered.named, cap: namedVsNumbered.namedCap, bar: "bg-indigo-600" },
              { label: "Numbered sectors", total: namedVsNumbered.numbered, cap: namedVsNumbered.numCap, bar: "bg-slate-700" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-semibold text-slate-900">
                    {r.cap}<span className="font-normal text-slate-400"> / {r.total} captured</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${r.bar} transition-[width] duration-700`} style={{ width: `${r.total ? (r.cap / r.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
