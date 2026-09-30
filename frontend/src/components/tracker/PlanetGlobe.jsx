import React, { useMemo, useRef, useState } from "react";
import { PLANET_TILES } from "../../lib/planetGeo";
import { STATUS_META } from "../../lib/presets";

const SIZE = 600;
const R = 272;
const C = SIZE / 2;

export const PLANET_STYLE = {
  serpulo: { sphere: "#16233a", tile: "#3b4657", edge: "#1e2a3d", glow: "rgba(56,189,248,0.35)" },
  erekir: { sphere: "#2a1d18", tile: "#4a4341", edge: "#2b221e", glow: "rgba(251,146,60,0.35)" },
};

const rot = ([x, y, z], cy, sy, cp, sp) => {
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
};

// yaw/pitch that bring vector v to face the viewer
export const faceVector = ([x, y, z]) => {
  const yaw = Math.atan2(-x, z);
  return { yaw, pitch: Math.atan2(y, Math.hypot(x, z)) };
};

export const tileCenter = (planet, id) => {
  const c = PLANET_TILES[planet]?.[id];
  if (!c) return null;
  const s = c.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]);
  const n = Math.hypot(...s);
  return s.map((v) => v / n);
};

export default function PlanetGlobe({ planet, byId, view, onView, selected, onSelect }) {
  const tiles = PLANET_TILES[planet];
  const style = PLANET_STYLE[planet] || PLANET_STYLE.serpulo;
  const [hover, setHover] = useState(null);
  const drag = useRef(null);

  const polys = useMemo(() => {
    if (!tiles) return [];
    const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    const out = [];
    tiles.forEach((corners, id) => {
      const pts = corners.map((p) => rot(p, cy, sy, cp, sp));
      const z = pts.reduce((a, p) => a + p[2], 0) / pts.length;
      if (z < -0.05) return;
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
      const cyy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      out.push({ id, z, cx: C + cx * R, cy: C - cyy * R, d: pts.map((p) => `${(C + p[0] * R).toFixed(1)},${(C - p[1] * R).toFixed(1)}`).join(" ") });
    });
    return out.sort((a, b) => a.z - b.z);
  }, [tiles, view]);

  if (!tiles) {
    return <div className="flex h-72 items-center justify-center text-sm text-slate-400" data-testid="planet-no-geometry">No map geometry for this planet.</div>;
  }

  const onDown = (e) => {
    const id = e.target.dataset?.tile;
    drag.current = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch, moved: false, id: id != null ? Number(id) : null };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    const k = 0.008 * (SIZE / e.currentTarget.clientWidth);
    onView({ yaw: d.yaw + dx * k, pitch: Math.max(-1.45, Math.min(1.45, d.pitch + dy * k)) });
  };
  // pointer capture routes the click to the svg, so tile selection happens on release
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved && d.id != null) onSelect(d.id);
  };

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full max-w-[560px] xl:max-w-[680px] touch-none select-none cursor-grab active:cursor-grabbing"
      data-testid="planet-globe"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="82%" stopColor={style.glow} stopOpacity="0" />
          <stop offset="100%" stopColor={style.glow} />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R + 14} fill="url(#glow)" />
      <circle cx={C} cy={C} r={R} fill={style.sphere} />
      {polys.map((p) => {
        const s = byId[p.id];
        const meta = s ? STATUS_META[s.status] : null;
        const shade = 0.45 + 0.55 * Math.max(0, p.z);
        const active = hover === p.id || selected === p.id;
        return (
          <polygon
            key={p.id}
            data-testid={`globe-tile-${p.id}`}
            data-tile={p.id}
            points={p.d}
            fill={meta ? meta.color : style.tile}
            fillOpacity={meta ? 0.55 + 0.45 * Math.max(0, p.z) : shade}
            stroke={active ? "#ffffff" : meta ? "rgba(255,255,255,0.35)" : style.edge}
            strokeWidth={active ? 2.2 : 0.9}
            strokeLinejoin="round"
            className="transition-[fill-opacity] duration-150"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
          />
        );
      })}
      {polys.map((p) => {
        const s = byId[p.id];
        if (!s || p.z < 0.5) return null;
        const label = s.numbered ? `#${s.sector_id}` : s.name;
        return (
          <text
            key={`t${p.id}`}
            x={p.cx}
            y={p.cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={s.numbered ? 9 : 8.5}
            fontWeight="600"
            fill="#fff"
            className="pointer-events-none"
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.55)", strokeWidth: 2 }}
          >
            {label.length > 14 ? `${label.slice(0, 13)}…` : label}
          </text>
        );
      })}
    </svg>
  );
}
