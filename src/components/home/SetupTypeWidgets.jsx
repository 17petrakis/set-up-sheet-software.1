import React from "react";
import { Layers, RotateCw, ClipboardList, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WIDGETS = [
  {
    key: "milling",
    label: "Milling",
    icon: Layers,
    tile: "bg-blue-50",
    iconColor: "text-blue-600",
    hover: "hover:border-blue-400/50",
  },
  {
    key: "turning",
    label: "Turning",
    icon: RotateCw,
    tile: "bg-amber-50",
    iconColor: "text-amber-600",
    hover: "hover:border-amber-400/50",
  },
  {
    key: "cmm",
    label: "CMM",
    icon: ClipboardList,
    tile: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hover: "hover:border-emerald-400/50",
  },
];

export default function SetupTypeWidgets({ counts = {}, onOpen }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-widest mb-3">By Machine Type</h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {WIDGETS.map((w) => {
          const Icon = w.icon;
          const count = counts[w.key] ?? 0;
          return (
            <button
              key={w.key}
              onClick={() => onOpen(w.key)}
              className={cn(
                "flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 bg-card border border-border rounded-2xl px-3 py-3 sm:px-5 sm:py-4 text-left hover:shadow-md transition-all",
                w.hover
              )}
            >
              <div className={cn("w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0", w.tile)}>
                <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", w.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs sm:text-sm text-foreground truncate">{w.label}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {count} {count === 1 ? "sheet" : "sheets"}
                </p>
              </div>
              <ChevronRight className="hidden sm:block w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </section>
  );
}