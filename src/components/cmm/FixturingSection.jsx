import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wrench, Plus, X, ExternalLink } from "lucide-react";

const FIXTURING_OPTIONS = [
  { group: "Fixturing" },
  { label: "Black Tower", variants: [] },
  { label: "Base Block", variants: ["Large", "Small"] },
  { label: "V-Block", variants: ["X-Large", "Large", "Small"] },
  { label: "Angle Block", variants: ["Regular", "V-Angle"] },
  { label: "Vice", variants: ["Regular", "Finger", "Mini", "Max's"] },
  { group: "Gauges" },
  { label: "Parallel Bars", variants: ["⅞"] },
  { label: "Gauge Block .700", variants: [] },
  { label: "Gauge Block .900", variants: [] },
  { label: "Gauge Block .950", variants: [] },
  { label: "Gauge Pin", variants: [".1"] },
  { group: "Other" },
  { label: "Weight", variants: ["Round Bar"] },
  { label: "Flat Piece", variants: [] },
  { label: "Double Sided Tape", variants: [] },
];

function getItemLabel(item) {
  if (item.custom_name) return item.note ? `${item.custom_name} – ${item.note}` : item.custom_name;
  const base = item.variant ? `${item.type} – ${item.variant}` : item.type;
  return item.note ? `${base} – ${item.note}` : base;
}

export default function FixturingSection({ items = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [customVariant, setCustomVariant] = useState("");
  const [customType, setCustomType] = useState("");
  const [note, setNote] = useState("");

  const selectedOption = FIXTURING_OPTIONS.find(o => o.label && o.label === selectedType);

  const canAdd = () => {
    if (!selectedType) return false;
    if (selectedType === "__other__") return customType.trim() !== "";
    if (selectedOption?.variants.length > 0 && !selectedVariant) return false;
    if (selectedVariant === "Other" && !customVariant.trim()) return false;
    return true;
  };

  const handleAdd = () => {
    if (!canAdd()) return;
    let newItem;
    if (selectedType === "__other__") {
      newItem = { _id: Date.now(), type: "Other", variant: "", custom_name: customType.trim(), note: note.trim() };
    } else {
      const variantValue = selectedVariant === "Other" ? customVariant.trim() : selectedVariant;
      newItem = { _id: Date.now(), type: selectedType, variant: variantValue, custom_name: "", note: note.trim() };
    }
    onChange([...items, newItem]);
    setSelectedType("");
    setSelectedVariant("");
    setCustomVariant("");
    setCustomType("");
    setNote("");
    setAdding(false);
  };

  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));

  const reset = () => {
    setAdding(false);
    setSelectedType("");
    setSelectedVariant("");
    setCustomVariant("");
    setCustomType("");
    setNote("");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          Fixturing Equipment
        </h2>
        <a
          href="https://1drv.ms/w/c/35cb3214252603ac/IQCfB0YMGSoYSY7c0m81SyuoAeZMS8tVdD7kK0epLnvTJx0?e=fGrkKU"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Fixturing Notation Reference
        </a>
      </div>
      <div className="border-b border-border mb-4" />

      {/* Added items */}
      <div className="flex flex-wrap gap-2 mb-4">
        {items.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">No fixturing equipment added yet.</p>
        )}
        {items.map((item, idx) => (
          <div key={item._id || idx} className="flex items-center gap-1.5 bg-muted/60 border border-border/50 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium text-foreground">{getItemLabel(item)}</span>
            <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      {adding ? (
        <div className="bg-muted/30 border border-border/40 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Equipment Type</label>
            <select
              value={selectedType}
              onChange={e => { setSelectedType(e.target.value); setSelectedVariant(""); setCustomVariant(""); setCustomType(""); }}
              className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— Select —</option>
              {FIXTURING_OPTIONS.map((o, i) =>
                o.group
                  ? <optgroup key={`group-${i}`} label={o.group} />
                  : <option key={o.label} value={o.label}>{o.label}</option>
              )}
              <option value="__other__">Other (enter name)</option>
            </select>
          </div>

          {selectedType === "__other__" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Equipment Name</label>
              <Input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Enter equipment name" className="h-9 text-sm" />
            </div>
          )}

          {selectedOption && selectedOption.variants.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Variant</label>
              <select
                value={selectedVariant}
                onChange={e => { setSelectedVariant(e.target.value); setCustomVariant(""); }}
                className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">— Select —</option>
                {selectedOption.variants.map(v => <option key={v} value={v}>{v}</option>)}
                <option value="Other">Other (enter name)</option>
              </select>
            </div>
          )}

          {selectedVariant === "Other" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Custom Variant</label>
              <Input value={customVariant} onChange={e => setCustomVariant(e.target.value)} placeholder="Enter variant name" className="h-9 text-sm" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Note <span className="normal-case font-normal">(optional)</span></label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. qty 2, upside down..." className="h-9 text-sm" />
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!canAdd()} className="h-8 text-xs">Add</Button>
            <Button size="sm" variant="outline" onClick={reset} className="h-8 text-xs">Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="h-8 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Equipment
        </Button>
      )}
    </div>
  );
}