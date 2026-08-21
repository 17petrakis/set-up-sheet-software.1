import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultRecordsForSection, notifyInventoryChanged } from "@/lib/inventory";
import InventoryItemForm from "./InventoryItemForm";

export default function InventorySection({ section, items }) {
  const sectionItems = items.filter(r =>
    r.category === section.category &&
    (!section.machine_type || r.machine_type === section.machine_type)
  );
  const active = sectionItems.filter(r => r.status !== "disposed");
  const disposed = sectionItems.filter(r => r.status === "disposed");
  const usingDefaults = active.length === 0;
  const [seeding, setSeeding] = useState(false);
  const [showDisposed, setShowDisposed] = useState(false);

  const handleAdd = async (item) => {
    await base44.entities.InventoryItem.create(item);
    notifyInventoryChanged();
  };

  const handleRemove = async (id) => {
    await base44.entities.InventoryItem.update(id, { status: "disposed" });
    notifyInventoryChanged();
  };

  const handleRestore = async (id) => {
    await base44.entities.InventoryItem.update(id, { status: "active" });
    notifyInventoryChanged();
  };

  const handleDelete = async (id) => {
    await base44.entities.InventoryItem.delete(id);
    notifyInventoryChanged();
  };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const records = defaultRecordsForSection(section);
      await base44.entities.InventoryItem.bulkCreate(records);
      notifyInventoryChanged();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">{section.label}</h2>
        <span className="text-xs text-muted-foreground">{active.length} active</span>
      </div>

      <div className="space-y-1.5 mb-3">
        {usingDefaults && (
          <p className="text-xs text-muted-foreground italic mb-2">
            No items managed yet — using built-in defaults.
          </p>
        )}
        {active.map(item => (
          <ItemRow key={item.id} item={item} section={section} onRemove={() => handleRemove(item.id)} />
        ))}
        {!usingDefaults && active.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No active items.</p>
        )}
      </div>

      <InventoryItemForm section={section} onAdd={handleAdd} />

      {usingDefaults && (
        <Button type="button" variant="outline" size="sm" onClick={seedDefaults} disabled={seeding} className="mt-3 w-full gap-1.5">
          {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
          Seed from defaults
        </Button>
      )}

      {disposed.length > 0 && (
        <div className="mt-3 border-t border-border/60 pt-2">
          <button onClick={() => setShowDisposed(s => !s)} className="text-xs text-muted-foreground hover:text-foreground">
            {showDisposed ? "Hide" : "Show"} disposed ({disposed.length})
          </button>
          {showDisposed && (
            <div className="space-y-1.5 mt-2">
              {disposed.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex-1 line-through">{item.name}</span>
                  <button onClick={() => handleRestore(item.id)} className="text-primary hover:underline">Restore</button>
                  <button onClick={() => handleDelete(item.id)} className="text-destructive hover:underline">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, section, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-sm font-medium text-foreground">{item.name}</span>
      {section.fields?.includes("tool_capacity") && item.tool_capacity != null && (
        <span className="text-xs text-muted-foreground">{item.tool_capacity} tools</span>
      )}
      {section.id === "cmm_equipment" && item.subgroup && (
        <span className="text-xs text-muted-foreground">{item.subgroup}</span>
      )}
      {section.id === "cutting_tool_mill" && item.subgroup && (
        <span className="text-xs text-muted-foreground">{item.subgroup}{item.subgroup2 ? ` › ${item.subgroup2}` : ""}</span>
      )}
      {section.id === "cutting_tool_lathe" && item.subgroup && (
        <span className="text-xs text-muted-foreground">{item.subgroup}</span>
      )}
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Dispose">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}