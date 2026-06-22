import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, X } from "lucide-react";

const POST_SIZES = ["Small", "Medium", "Large"];

export default function WorkPlacementSection({ items = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [size, setSize] = useState("");
  const [x, setX] = useState("");
  const [y, setY] = useState("");

  const canAdd = () => size !== "" && x.trim() !== "" && y.trim() !== "";

  const handleAdd = () => {
    if (!canAdd()) return;
    onChange([...items, { _id: Date.now(), size, x: x.trim(), y: y.trim() }]);
    setSize("");
    setX("");
    setY("");
    setAdding(false);
  };

  const updatePost = (idx, field, value) => {
    onChange(items.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removePost = (idx) => onChange(items.filter((_, i) => i !== idx));

  const reset = () => {
    setAdding(false);
    setSize("");
    setX("");
    setY("");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Work Placement
        </h2>
      </div>
      <div className="border-b border-border mb-4" />

      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground mb-4">No posts added yet.</p>
      )}

      {items.length > 0 && (
        <div className="space-y-2 mb-4">
          {items.map((post, idx) => (
            <div key={post._id || idx} className="flex items-center gap-3 bg-muted/40 border border-border/50 rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-6">#{idx + 1}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Post</span>
                <select
                  value={post.size || ""}
                  onChange={e => updatePost(idx, "size", e.target.value)}
                  className="h-8 px-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">—</option>
                  {POST_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">X</span>
                <Input value={post.x || ""} onChange={e => updatePost(idx, "x", e.target.value)} className="h-8 w-20 text-sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Y</span>
                <Input value={post.y || ""} onChange={e => updatePost(idx, "y", e.target.value)} className="h-8 w-20 text-sm" />
              </div>
              <button onClick={() => removePost(idx)} className="text-muted-foreground hover:text-destructive transition-colors ml-auto">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="bg-muted/30 border border-border/40 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Post Size</label>
            <select
              value={size}
              onChange={e => setSize(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— Select —</option>
              {POST_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">X</span>
              <Input value={x} onChange={e => setX(e.target.value)} className="h-9 w-24 text-sm" placeholder="0.000" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Y</span>
              <Input value={y} onChange={e => setY(e.target.value)} className="h-9 w-24 text-sm" placeholder="0.000" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!canAdd()} className="h-8 text-xs">Add Post</Button>
            <Button size="sm" variant="outline" onClick={reset} className="h-8 text-xs">Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="h-8 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Post
        </Button>
      )}
    </div>
  );
}