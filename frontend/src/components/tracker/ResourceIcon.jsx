import React from "react";

const SPRITES = new Set([
  "beryllium", "blast-compound", "carbide", "coal", "copper", "dormant-cyst", "fissile-matter", "graphite", "lead",
  "metaglass", "oxide", "phase-fabric", "plastanium", "pyratite", "sand", "scrap", "silicon", "spore-pod",
  "surge-alloy", "thorium", "titanium", "tungsten", "arkycite", "cryofluid", "cyanogen", "gallium", "hydrogen",
  "neoplasm", "nitrogen", "oil", "ozone", "slag", "water",
]);

export const hasSprite = (name) => SPRITES.has(name);

export default function ResourceIcon({ name, size = 14, className = "" }) {
  if (!SPRITES.has(name)) {
    return <i className={`inline-block shrink-0 rounded-full bg-slate-300 ${className}`} style={{ width: size, height: size }} />;
  }
  return (
    <img
      src={`${process.env.PUBLIC_URL}/sprites/${name}.png`}
      alt={name}
      width={size}
      height={size}
      draggable={false}
      data-testid={`resource-icon-${name}`}
      className={`inline-block shrink-0 ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
