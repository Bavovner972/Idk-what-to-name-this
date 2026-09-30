import React, { useMemo, useRef, useState } from "react";
import { PLANET_TILES } from "../../lib/planetGeo";
import { STATUS_META, THREAT_COLOR, computeThreat, threatLabel } from "../../lib/presets";

const SIZE = 600;
const R = 272;
const C = SIZE / 2;

export const PLANET_STYLE = {
  serpulo: { sphere: "#141c2c", tile: "#2c3342", edge: "#1a2030", glow: "rgba(96,165,250,0.3)" },
  erekir: { sphere: "#241a16", tile: "#3f3733", edge: "#231c19", glow: "rgba(255,170,95,0.3)" },
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

// Threat label per tile: owned sectors use their stored difficulty, others the game's baseline formula
export const planetThreats = (planet, byId) => {
  const tiles = PLANET_TILES[planet] || [];
  return tiles.map((_, id) => byId[id]?.difficulty || threatLabel(computeThreat(planet, id)));
};

export default function PlanetGlobe({ planet, byId, view, onView, selected, onSelect, mode = "status", onGrab }) {
  const tiles = PLANET_TILES[planet];
  const style = PLANET_STYLE[planet] || PLANET_STYLE.serpulo;
  const [hover, setHover] = useState(null);
  const drag = useRef(null);

  const threats = useMemo(() => planetThreats(planet, byId), [planet, byId]);

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
    return <div className="flex h-72 items-center justify-center text-sm text-[#64748b]" data-testid="planet-no-geometry">No map geometry for this planet.</div>;
  }

  const onDown = (e) => {
    const id = e.target.dataset?.tile;
    drag.current = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch, moved: false, id: id != null ? Number(id) : null };
    e.currentTarget.setPointerCapture(e.pointerId);
    onGrab?.();
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

  const fillFor = (p, s) => {
    if (mode === "threat") return THREAT_COLOR[threats[p.id]] || style.tile;
    return s ? STATUS_META[s.status].color : style.tile;
  };

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full max-w-[560px] xl:max-w-[680px] touch-none select-none cursor-grab active:cursor-grabbing"
      data-testid="planet-globe"
      data-mode={mode}
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
        const coloured = mode === "threat" || !!s;
        const depth = Math.max(0, p.z);
        const active = hover === p.id || selected === p.id;
        const dim = mode === "threat" && !s;
        return (
          <polygon
            key={p.id}
            data-testid={`globe-tile-${p.id}`}
            data-tile={p.id}
            points={p.d}
            fill={fillFor(p, s)}
            fillOpacity={coloured ? (dim ? 0.28 + 0.32 * depth : 0.55 + 0.45 * depth) : 0.45 + 0.55 * depth}
            stroke={active ? "#ffd37f" : s ? "rgba(255,255,255,0.4)" : style.edge}
            strokeWidth={active ? 2.4 : s ? 1.1 : 0.9}
            strokeLinejoin="round"
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
            fontFamily="'JetBrains Mono', monospace"
            fill="#fff"
            className="pointer-events-none"
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.6)", strokeWidth: 2 }}
          >
            {label.length > 14 ? `${label.slice(0, 13)}…` : label}
          </text>
        );
      })}
    </svg>
  );
}
