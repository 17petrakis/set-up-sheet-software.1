import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import ToolTypeDropdown from "./ToolTypeDropdown";
import ToolFields from "./ToolFields";

// Add Tool dropdown: Turn or Mill
function AddToolButton({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(o => !o)} className="h-7 text-xs gap-1">
        + Add Tool
        <ChevronDown className="w-3 h-3" />
      </Button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-28 bg-popover border border-border rounded-md shadow-lg py-1">
          {["Turn", "Mill"].map(k => (
            <div key={k} onClick={() => { onAdd(k); setOpen(false); }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground rounded-sm mx-1">
              {k}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { AddToolButton };

export default function ToolRow({ tool, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(true);
  const set = (k) => (v) => onUpdate({ ...tool, [k]: v });

  // Build display label
  const kindLabel = tool.tool_kind ? `(${tool.tool_kind})` : "";
  const typeLabel = tool.tool_type || "";
  const displayType = [kindLabel, typeLabel].filter(Boolean).join(" ");

  return (
    <div className="border border-border/40 rounded-lg mb-2">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 hover:bg-muted/30 transition-colors">
        <button type="button" onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {/* T# */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground font-mono">T</span>
          <Input
            value={tool.tool_number || ""}
            onChange={(e) => set("tool_number")(e.target.value)}
            placeholder="#"
            className="h-7 w-12 text-xs bg-background border-border/60 px-1.5 text-center font-mono"
          />
        </div>
        {/* Kind badge */}
        {tool.tool_kind && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tool.tool_kind === "Mill" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
            {tool.tool_kind}
          </span>
        )}
        {/* Type dropdown */}
        <div className="flex-1 min-w-0">
          <ToolTypeDropdown toolKind={tool.tool_kind} value={tool.tool_type || ""} onChange={set("tool_type")} />
        </div>
        {/* Display label */}
        {displayType && (
          <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[160px]">{displayType}</span>
        )}
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}
          className="h-7 w-7 ml-auto text-destructive hover:text-destructive shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Expanded fields */}
      {expanded && tool.tool_type && (
        <div className="px-4 py-3 bg-background border-t border-border/30">
          <ToolFields
            toolKind={tool.tool_kind}
            typeValue={tool.tool_type}
            data={tool}
            onChange={onUpdate}
          />
        </div>
      )}
    </div>
  );
}