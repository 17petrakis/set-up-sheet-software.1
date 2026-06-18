import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wrench, Plus, X, ExternalLink } from "lucide-react";

const FIXTURING_OPTIONS = [
  { label: "V Block", variants: ["X-Large", "Large", "Small"] },
  { label: "Black Tower", variants: [] },
  { label: "Base Block", variants: ["Large", "Small"] },
  { label: "Vice", variants: ["Mini", "Regular", "Finger", "Max's"] },
  { label: "Parallel Bars", variants: ["⅞"] },
  { label: "Gauge Block", variants: [".950", ".900", ".700", ".1"] },
  { label: "Gauge Pin", variants: [".1"] },
  { label: "Dove Tail Fixture", variants: [] },
  { label: "Weight", variants: ["Round Bar"] },
  { label: "Angle Block", variants: ["Regular", "V-block"] },
  { label: "Flat Piece", variants: [] },
  { label: "Double Sided Tape", variants: [] },
];

function getItemLabel(item) {
  if (item.custom_name) return item.custom_name;
  if (item.variant) return `${item.type} – ${item.variant}`;
  return item.type;
}

export default function FixturingSection({ items = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [customVariant, setCustomVariant] = useState("");
  const [customType, setCustomType] = useState("");

  const selectedOption = FIXTURING_OPTIONS.find(o => o.label === selectedType);

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
      newItem = { _id: Date.now(), type: "Other", variant: "", custom_name: customType.trim() };
    } else {
      const variantValue = selectedVariant === "Other" ? customVariant.trim() : selectedVariant;
      newItem = { _id: Date.now(), type: selectedType, variant: variantValue, custom_name: "" };
    }
    onChange([...items, newItem]);
    setSelectedType("");
    setSelectedVariant("");
    setCustomVariant("");
    setCustomType("");
    setAdding(false);
  };

  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));

  const reset = () => {
    setAdding(false);
    setSelectedType("");
    setSelectedVariant("");
    setCustomVariant("");
    setCustomType("");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          Fixturing Equipment
        </h2>
        <a
          href="https://docs.google.com/document/d/16oZitq4cgSlJ81-Ab_S-EE4HQ_JxXEiyj3-M4Bm3l_o/edit?usp=sharing"
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
              {FIXTURING_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
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