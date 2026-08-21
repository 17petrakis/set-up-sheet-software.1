import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

export default function InventoryItemForm({ section, onAdd }) {
  const fields = section.fields || [];
  const isCmm = section.id === "cmm_equipment";
  const [name, setName] = useState("");
  const [toolCapacity, setToolCapacity] = useState("");
  const [subgroup, setSubgroup] = useState(isCmm ? "Other" : "");
  const [variants, setVariants] = useState("");
  const [defaultSizes, setDefaultSizes] = useState("");
  const [hasSize, setHasSize] = useState(false);

  const reset = () => {
    setName("");
    setToolCapacity("");
    setVariants("");
    setDefaultSizes("");
    setHasSize(false);
    setSubgroup(isCmm ? "Other" : "");
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const item = { name: trimmed, category: section.category, status: "active" };
    if (section.machine_type) item.machine_type = section.machine_type;
    if (fields.includes("tool_capacity") && toolCapacity.trim()) item.tool_capacity = Number(toolCapacity);
    if (fields.includes("subgroup")) item.subgroup = subgroup.trim() || "Other";
    if (fields.includes("variants")) item.variants = variants.split(",").map(s => s.trim()).filter(Boolean);
    if (fields.includes("has_size")) item.has_size = hasSize;
    if (fields.includes("default_sizes")) item.default_sizes = defaultSizes.split(",").map(s => s.trim()).filter(Boolean);
    onAdd(item);
    reset();
  };

  return (
    <div className="border-t border-border/60 pt-3 space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Add item</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            placeholder="Name…"
            className="h-8 text-sm"
          />
        </div>
        {fields.includes("tool_capacity") && (
          <div className="w-24">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Tool cap.</Label>
            <Input
              type="number"
              min="0"
              value={toolCapacity}
              onChange={e => setToolCapacity(e.target.value)}
              placeholder="#"
              className="h-8 text-sm"
            />
          </div>
        )}
        <Button type="button" size="sm" onClick={submit} disabled={!name.trim()} className="h-8 gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {isCmm && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Group</Label>
            <Input value={subgroup} onChange={e => setSubgroup(e.target.value)} placeholder="Fixturing / Gauges / Other" className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Variants (comma-sep)</Label>
            <Input value={variants} onChange={e => setVariants(e.target.value)} placeholder="Large, Small" className="h-8 text-sm" />
          </div>
          <div className="col-span-2 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={hasSize} onCheckedChange={setHasSize} />
              <span className="text-xs font-medium">Uses size field</span>
            </label>
            {hasSize && (
              <Input value={defaultSizes} onChange={e => setDefaultSizes(e.target.value)} placeholder="Default sizes (comma-sep)" className="h-8 text-sm flex-1" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}