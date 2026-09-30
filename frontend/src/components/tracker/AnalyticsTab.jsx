import React, { useMemo } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { STATUS_META, STATUSES, DIFF_RANK, THREAT_COLOR } from "../../lib/presets";

const Panel = ({ title, children, className = "", testid, right }) => (
  <div className={`panel panel-ticks p-5 ${className}`} data-testid={testid}>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="label-ui !text-[#e2e8f0]">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const AXIS = { fontSize: 11, fill: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" };
const tip = {
  contentStyle: { borderRadius: 3, border: "1px solid #ffd37f", background: "#121317", color: "#e2e8f0", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#ffd37f" },
  cursor: { fill: "rgba(255,211,127,0.06)" },
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
    return order.map((d) => ({ name: d, count: sectors.filter((s) => s.difficulty === d).length, color: THREAT_COLOR[d] }));
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

  const pieData = statusData.some((d) => d.value > 0) ? statusData : [{ name: "none", value: 1, color: "#343845" }];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Sector Status" testid="chart-status">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="#1a1b20" strokeWidth={2}>
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip {...tip} />
                <Legend
                  payload={statusData.map((d) => ({ value: d.name, type: "square", color: d.color, id: d.key }))}
                  wrapperStyle={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}
                  formatter={(v, entry) => <span style={{ color: entry.color }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Threat Distribution" testid="chart-difficulty">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diffData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#282a36" />
                <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={{ stroke: "#343845" }} />
                <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip {...tip} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {diffData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
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
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#282a36" />
                <XAxis type="number" tick={AXIS} axisLine={{ stroke: "#343845" }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={170} tick={{ ...AXIS, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
                <Tooltip {...tip} />
                <Bar dataKey="wave" fill="#ffd37f" radius={[0, 2, 2, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center font-mono-ui text-sm uppercase tracking-wider text-[#64748b]">No wave data yet</p>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Output by Resource" className="lg:col-span-2" testid="chart-resources" right={<span className="font-mono-ui text-[11px] text-[#64748b]">items / min</span>}>
          {resourceData.length ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#282a36" />
                  <XAxis dataKey="item" tick={{ ...AXIS, fontSize: 10.5 }} interval={0} angle={-25} textAnchor="end" axisLine={{ stroke: "#343845" }} tickLine={false} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                  <Tooltip {...tip} />
                  <Bar dataKey="rate" fill="#38d39f" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center font-mono-ui text-sm uppercase tracking-wider text-[#64748b]">No production logged yet</p>
          )}
        </Panel>
        <Panel title="Named vs Numbered" testid="chart-named-numbered">
          <div className="space-y-4 pt-1">
            {[
              { label: "Named sectors", total: namedVsNumbered.named, cap: namedVsNumbered.namedCap, bar: "bg-[#ffd37f]" },
              { label: "Numbered sectors", total: namedVsNumbered.numbered, cap: namedVsNumbered.numCap, bar: "bg-[#60a5fa]" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="text-[#94a3b8]">{r.label}</span>
                  <span className="font-mono-ui font-semibold text-[#e2e8f0]">
                    {r.cap}<span className="font-normal text-[#64748b]"> / {r.total} captured</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-sm bg-[#262932]">
                  <div className={`h-full ${r.bar} transition-[width] duration-700`} style={{ width: `${r.total ? (r.cap / r.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
