import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { SETTING_KEYS, useDropdownOptions, saveDropdownOption, buildEquipmentOptions } from "@/lib/dropdownOptions";

const CONFIG = {
  milling: [
    { key: SETTING_KEYS.millingMachine, label: "Machine" },
    { key: SETTING_KEYS.millingCad, label: "CAD Software" },
    { key: SETTING_KEYS.millingVise, label: "Vise Model" },
    { key: SETTING_KEYS.millingJaw, label: "Jaw Type" },
  ],
  lathe: [
    { key: SETTING_KEYS.latheMachine, label: "Machine" },
    { key: SETTING_KEYS.latheCad, label: "CAD Software" },
    { key: SETTING_KEYS.latheVise, label: "Vise Model" },
    { key: SETTING_KEYS.latheJaw, label: "Jaw Type" },
  ],
  cmm: [
    { key: SETTING_KEYS.cmmPostSize, label: "Post Size" },
    { key: SETTING_KEYS.cmmEquipment, label: "Equipment Type", equipment: true },
    { key: SETTING_KEYS.cmmMachine, label: "Machine" },
  ],
};

function StringListEditor({ label, items, onChange }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v || items.includes(v)) { setDraft(""); return; }
    onChange([...items, v]);
    setDraft("");
  };

  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-3">{label}</p>
      <div className="space-y-2 mb-3">
        {items.length === 0 && <p className="text-xs text-muted-foreground italic">No options — add one below.</p>}
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={it}
              onChange={e => onChange(items.map((x, idx) => idx === i ? e.target.value : x))}
              className="h-8 text-sm flex-1"
            />
            <Button
              type="button" size="icon" variant="ghost"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add new option…"
          className="h-8 text-sm flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={!draft.trim()} className="h-8 gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}

function EquipmentListEditor({ label, items, onChange }) {
  const [draftLabel, setDraftLabel] = useState("");
  const [draftGroup, setDraftGroup] = useState("Other");

  const add = () => {
    const v = draftLabel.trim();
    if (!v) { setDraftLabel(""); return; }
    onChange([...items, { label: v, group: draftGroup.trim() || "Other" }]);
    setDraftLabel("");
  };

  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-3">{label}</p>
      <div className="space-y-2 mb-3">
        {items.length === 0 && <p className="text-xs text-muted-foreground italic">No equipment — add one below.</p>}
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={it.label}
              onChange={e => onChange(items.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
              placeholder="Equipment name"
              className="h-8 text-sm flex-1"
            />
            <Input
              value={it.group}
              onChange={e => onChange(items.map((x, idx) => idx === i ? { ...x, group: e.target.value } : x))}
              placeholder="Group"
              className="h-8 text-sm w-28"
            />
            <Button
              type="button" size="icon" variant="ghost"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={draftLabel}
          onChange={e => setDraftLabel(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="New equipment name…"
          className="h-8 text-sm flex-1"
        />
        <Input
          value={draftGroup}
          onChange={e => setDraftGroup(e.target.value)}
          placeholder="Group"
          className="h-8 text-sm w-28"
        />
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={!draftLabel.trim()} className="h-8 gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}

export default function DropdownOptionsEditor({ open, sheetType, onClose }) {
  const opts = useDropdownOptions();
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);

  const config = CONFIG[sheetType] || [];

  useEffect(() => {
    if (!open) return;
    const d = {};
    for (const c of config) {
      const stored = opts[c.key];
      d[c.key] = Array.isArray(stored) ? stored.map(it => (typeof it === "string" ? it : { ...it })) : [];
    }
    setDrafts(d);
  }, [open, sheetType]);

  const setList = (key, value) => setDrafts(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const c of config) {
        const value = drafts[c.key];
        const toSave = c.equipment ? value : value;
        await saveDropdownOption(c.key, toSave);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {sheetType === "cmm" ? "Quality Control" : sheetType === "lathe" ? "Lathe" : "Milling"} Dropdown Options</DialogTitle>
          <DialogDescription>
            Add or remove options for each dropdown. Saved changes immediately update the dropdowns on all connected setup sheets.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
          {config.map(c => {
            const items = drafts[c.key] || [];
            return c.equipment ? (
              <EquipmentListEditor
                key={c.key}
                label={c.label}
                items={items}
                onChange={v => setList(c.key, v)}
              />
            ) : (
              <StringListEditor
                key={c.key}
                label={c.label}
                items={items}
                onChange={v => setList(c.key, v)}
              />
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { buildEquipmentOptions };