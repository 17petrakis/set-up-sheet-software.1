import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ChevronDown, ChevronRight, Plus, RotateCcw } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import ToolTypeDropdown from "./ToolTypeDropdown";
import AutoSizeInput from "./AutoSizeInput";
import TurningToolEditModal from "./TurningToolEditModal";
import { Settings2 } from "lucide-react";
import { getTypeFields, migrateToolType, EXTRA_FIELD_DEFS, DEFAULT_VISIBLE_EXTRA } from "@/lib/turningToolConfig";

// ── Small field helpers ────────────────────────────────────────────────────────
function Label({ children }) {
  return <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5 block">{children}</span>;
}

function SmallInput({ value, onChange, placeholder = "", className = "w-16" }) {
  if (className.includes("flex-1")) {
    return (
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`h-9 text-sm bg-card border-input px-2 ${className}`} />
    );
  }
  return (
    <AutoSizeInput value={value} onChange={onChange} placeholder={placeholder}
      inputClass="h-9 text-sm bg-card border-input px-2" minWidth="3rem" />
  );
}

function SmallSelect({ value, onChange, options, placeholder = "—", className = "w-20", allowOther = true }) {
  const [forcedOther, setForcedOther] = useState(false);
  const normalizedOptions = options.map(opt => (typeof opt === "string" ? { value: opt, label: opt } : opt));
  const isInOptions = normalizedOptions.some(o => o.value === value);
  const showCustom = allowOther && (forcedOther || (!!value && !isInOptions));

  if (showCustom) {
    return (
      <div className={`flex items-center gap-1 ${className}`} style={{ width: "fit-content", minWidth: "6rem" }}>
        <AutoSizeInput
          value={value || ""}
          onChange={onChange}
          placeholder="Custom…"
          inputClass="h-9 text-sm bg-card border-input px-2"
          minWidth="4rem"
        />
        <button
          type="button"
          onClick={() => { setForcedOther(false); onChange(""); }}
          className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
          title="Back to list"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={(v) => {
      if (v === "__other__") { setForcedOther(true); onChange(""); } else { onChange(v); }
    }}>
      <SelectTrigger className={`h-9 text-sm px-2 [&>span]:line-clamp-none ${className}`} style={{ width: "fit-content", minWidth: "3rem" }}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {normalizedOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-sm">{opt.label}</SelectItem>)}
        {allowOther && <SelectItem value="__other__" className="text-sm italic text-muted-foreground">Other…</SelectItem>}
      </SelectContent>
    </Select>
  );
}

// ── Add Tool buttons ───────────────────────────────────────────────────────────
function AddToolButton({ onAdd }) {
  return (
    <div className="flex items-center gap-1.5">
      <Button type="button" size="sm" variant="outline" onClick={() => onAdd("Turn")} className="h-7 text-xs gap-1">
        + Turning Tool
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => onAdd("Mill")} className="h-7 text-xs gap-1">
        + Milling Tool
      </Button>
    </div>
  );
}

export { AddToolButton };

// ── Main ToolRow ──────────────────────────────────────────────────────────────
export default function ToolRow({ tool, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const set = (k) => (v) => onUpdate({ ...tool, [k]: v });

  const typeValue = migrateToolType(tool.tool_kind, tool.tool_type);
  const isMill = tool.tool_kind === "Mill";
  const fields = getTypeFields(tool.tool_kind, typeValue);
  const odIdOptions = isMill ? ["Axial", "Radial"] : ["OD", "ID"];

  const removed = tool._removed_fields || [];
  const added = tool._added_fields || [];
  const visibleExtraFields = EXTRA_FIELD_DEFS.filter(f => {
    if (removed.includes(f.key)) return false;
    if (added.includes(f.key)) return true;
    return DEFAULT_VISIBLE_EXTRA.includes(f.key);
  });

  return (
    <div className="border border-border/40 rounded-lg mb-2">
      {/* ── Header row ── */}
      <div className="flex items-start gap-2 px-3 py-2 bg-muted/20 hover:bg-muted/30 transition-colors flex-wrap">
        <button type="button" onClick={() => setExpanded(e => !e)} className="mt-5 text-muted-foreground hover:text-foreground shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* T# */}
        <div className="flex flex-col shrink-0">
          <Label>T#</Label>
          <Input value={tool.tool_number || ""} onChange={(e) => set("tool_number")(e.target.value)}
            placeholder="#" className="h-9 w-14 text-sm bg-card border-input px-2 text-center font-mono" />
        </div>

        {/* Kind badge */}
        {tool.tool_kind && (
          <span className={`mt-5 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${isMill ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
            {tool.tool_kind}
          </span>
        )}

        {/* Type dropdown */}
        <div className="flex flex-col shrink-0">
          <Label>Type</Label>
          <ToolTypeDropdown toolKind={tool.tool_kind} value={typeValue} onChange={(v) => set("tool_type")(v)} />
        </div>

        {/* Type-specific fields */}
        {fields.map(f => (
          <div key={f.key} className="flex flex-col shrink-0">
            <Label>{f.label}</Label>
            {f.type === "select" ? (
              <SmallSelect value={tool[f.key]} onChange={set(f.key)} options={f.options} />
            ) : (
              <SmallInput value={tool[f.key]} onChange={set(f.key)} placeholder="" />
            )}
          </div>
        ))}

        {/* Tool Name */}
        <div className="flex flex-col flex-1 min-w-[200px]">
          <Label>Tool Name</Label>
          <Input value={tool.name || ""} onChange={(e) => set("name")(e.target.value)}
            placeholder="Tool name…" className="h-9 text-sm bg-card border-input px-2 w-full" />
        </div>

        <Button type="button" size="icon" variant="ghost" onClick={() => setConfirmDelete(true)}
          className="mt-5 h-7 w-7 text-destructive hover:text-destructive shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {showEditModal && (
        <TurningToolEditModal
          tool={tool}
          onUpdate={onUpdate}
          onClose={() => setShowEditModal(false)}
          typeValue={typeValue}
        />
      )}

      {/* ── Expanded: Extra Information ── */}
      {expanded && typeValue && (
        <div className="px-4 py-3 bg-background border-t border-border/30">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
            {visibleExtraFields.map(f => (
              <div key={f.key} className="flex flex-col">
                <Label>{f.label}</Label>
                {f.type === "select" ? (
                  <SmallSelect value={tool[f.key]} onChange={set(f.key)} options={f.options} />
                ) : (
                  <SmallInput value={tool[f.key]} onChange={set(f.key)} className="w-28" />
                )}
              </div>
            ))}
            <div className="flex flex-col">
              <Label>{isMill ? "Axial/Radial" : "OD/ID"}</Label>
              <SmallSelect value={tool.od_id} onChange={set("od_id")} options={odIdOptions} allowOther={false} />
            </div>
            <Button type="button" size="icon" variant="ghost" onClick={() => setShowEditModal(true)}
              className="mt-5 h-7 w-7 text-muted-foreground hover:text-foreground shrink-0" title="Edit fields">
              <Settings2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tool? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmDelete(false); onRemove(); }} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}