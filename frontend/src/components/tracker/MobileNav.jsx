import React from "react";
import { LayoutGrid, Globe2, BarChart3, Table2 } from "lucide-react";

export const TABS = [
  { id: "sectors", label: "Sectors", icon: LayoutGrid },
  { id: "planet", label: "Planet", icon: Globe2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "data", label: "Data", icon: Table2 },
];

export default function MobileNav({ tab, onTab }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#343845] bg-[#121317]/95 backdrop-blur">
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              data-testid={`mobile-tab-${t.id}`}
              onClick={() => onTab(t.id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                active ? "text-[#ffd37f]" : "text-[#64748b]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
