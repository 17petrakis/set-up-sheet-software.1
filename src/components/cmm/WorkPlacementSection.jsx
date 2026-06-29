import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, X, LayoutGrid } from "lucide-react";

const POST_SIZES = ["1.5 in.", "1.75 in.", "2.75 in.", "3.5 in."];
const DEFAULT_STACKED_SIZE = "1.5 in.";

const STANDARD_POSTS = [
  { size: "1.5 in.", x: "18", y: "4" },
  { size: "1.5 in.", x: "14", y: "6" },
  { size: "1.5 in.", x: "14", y: "12" },
];

function isStandardConfig(items) {
  if (items.length !== 3) return false;
  const matches = STANDARD_POSTS.every(sp =>
    items.some(p => p.size === sp.size && String(p.x) === sp.x && String(p.y) === sp.y)
  );
  return matches;
}

export default function WorkPlacementSection({ items = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [size, setSize] = useState("");
  const [x, setX] = useState("");
  const [y, setY] = useState("");

  const isStandard = isStandardConfig(items);

  const isValidInt = (v) => /^-?\d+$/.test(v.trim());
  const canAdd = () => size !== "" && isValidInt(x) && isValidInt(y);

  const handleAdd = () => {
    if (!canAdd()) return;
    onChange([...items, { _id: Date.now(), size, x: x.trim(), y: y.trim() }]);
    setSize("");
    setX("");
    setY("");
    setAdding(false);
  };

  const handleAddStandard = () => {
    const base = Date.now();
    onChange([
      ...items,
      ...STANDARD_POSTS.map((p, i) => ({ _id: base + i, ...p })),
    ]);
  };

  const updatePost = (idx, field, value) => {
    onChange(items.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removePost = (idx) => onChange(items.filter((_, i) => i !== idx));

  const getStacked = (post) => post.stacked || [];
  const toggleStacked = (idx, slotIdx) => {
    onChange(items.map((p, i) => {
      if (i !== idx) return p;
      const stacked = [...getStacked(p)];
      if (slotIdx < stacked.length) {
        stacked.splice(slotIdx, 1);
      } else if (slotIdx === stacked.length && stacked.length < 3) {
        stacked.push(DEFAULT_STACKED_SIZE);
      }
      return { ...p, stacked };
    }));
  };
  const updateStacked = (idx, slotIdx, size) => {
    onChange(items.map((p, i) => {
      if (i !== idx) return p;
      const stacked = [...getStacked(p)];
      stacked[slotIdx] = size;
      return { ...p, stacked };
    }));
  };

  const reset = () => {
    setAdding(false);
    setSize("");
    setX("");
    setY("");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Work Placement
          {isStandard && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full normal-case tracking-normal">
              Standard
            </span>
          )}
        </h2>
      </div>
      <div className="border-b border-border mb-4" />

      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground mb-4">No posts added yet.</p>
      )}

      {items.length > 0 && (
        <>
          {/* Desktop: table-like layout */}
          <div className="hidden sm:block mb-4">
            <div className="grid grid-cols-[2rem_1fr_5rem_5rem_2rem] gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/40">
              <span>#</span>
              <span>Stacked Posts</span>
              <span>X</span>
              <span>Y</span>
              <span></span>
            </div>
            <div className="space-y-1">
              {items.map((post, idx) => {
                const stacked = getStacked(post);
                return (
                <div
                  key={post._id || idx}
                  className="grid grid-cols-[2rem_1fr_5rem_5rem_2rem] gap-2 items-center bg-muted/30 border border-border/40 rounded-lg px-3 py-1.5"
                >
                  <span className="text-xs text-muted-foreground">{idx + 1}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <select
                      value={post.size || ""}
                      onChange={e => updatePost(idx, "size", e.target.value)}
                      className="h-8 px-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
                    >
                      <option value="">—</option>
                      {POST_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {stacked.map((sz, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-0.5 shrink-0">
                        <select
                          value={sz}
                          onChange={e => updateStacked(idx, sIdx, e.target.value)}
                          className="h-8 px-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {POST_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => toggleStacked(idx, sIdx)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                          title="Remove stacked post"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {stacked.length < 3 && (
                      <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => toggleStacked(idx, stacked.length)}
                          className="w-3.5 h-3.5 rounded border-input accent-primary"
                        />
                        <span className="text-muted-foreground">add</span>
                      </label>
                    )}
                  </div>
                  <Input value={post.x || ""} onChange={e => { if (/^-?\d*$/.test(e.target.value)) updatePost(idx, "x", e.target.value); }} className="h-8 text-sm" />
                  <Input value={post.y || ""} onChange={e => { if (/^-?\d*$/.test(e.target.value)) updatePost(idx, "y", e.target.value); }} className="h-8 text-sm" />
                  <button onClick={() => removePost(idx)} className="text-muted-foreground hover:text-destructive transition-colors justify-self-start">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: card layout */}
          <div className="sm:hidden space-y-2 mb-4">
            {items.map((post, idx) => {
              const stacked = getStacked(post);
              return (
              <div key={post._id || idx} className="bg-muted/30 border border-border/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Post #{idx + 1}</span>
                  <button onClick={() => removePost(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-2">
                  <label className="text-xs text-muted-foreground block mb-1">Stacked Posts</label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={post.size || ""}
                      onChange={e => updatePost(idx, "size", e.target.value)}
                      className="h-9 px-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
                    >
                      <option value="">— Select —</option>
                      {POST_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {stacked.map((sz, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-0.5 shrink-0">
                        <select
                          value={sz}
                          onChange={e => updateStacked(idx, sIdx, e.target.value)}
                          className="h-9 px-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {POST_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => toggleStacked(idx, sIdx)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                          title="Remove stacked post"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {stacked.length < 3 && (
                      <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => toggleStacked(idx, stacked.length)}
                          className="w-4 h-4 rounded border-input accent-primary"
                        />
                        <span className="text-muted-foreground">add</span>
                      </label>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">X</label>
                    <Input value={post.x || ""} onChange={e => { if (/^-?\d*$/.test(e.target.value)) updatePost(idx, "x", e.target.value); }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Y</label>
                    <Input value={post.y || ""} onChange={e => { if (/^-?\d*$/.test(e.target.value)) updatePost(idx, "y", e.target.value); }} className="h-9 text-sm" />
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">X</label>
              <Input value={x} onChange={e => { if (/^-?\d*$/.test(e.target.value)) setX(e.target.value); }} className="h-9 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Y</label>
              <Input value={y} onChange={e => { if (/^-?\d*$/.test(e.target.value)) setY(e.target.value); }} className="h-9 text-sm" placeholder="0" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!canAdd()} className="h-8 text-xs">Add Post</Button>
            <Button size="sm" variant="outline" onClick={reset} className="h-8 text-xs">Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.length === 0 && (
            <Button size="sm" variant="outline" onClick={handleAddStandard} className="h-8 text-xs gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Add Standard
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="h-8 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Post
          </Button>
        </div>
      )}
    </div>
  );
}