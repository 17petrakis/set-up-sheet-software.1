import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const TYPE_LABEL = { mill: "Mill", lathe: "Lathe", saw: "Saw" };

export default function AddMachineDialog({ onClose, onAdd, existingNames = [] }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("mill");
  const [toolSlots, setToolSlots] = useState("20");
  const [turretSlots, setTurretSlots] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Machine name is required"); return; }
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError("A machine with this name already exists");
      return;
    }
    const slots = parseInt(toolSlots, 10);
    if (isNaN(slots) || slots < 1) { setError("Tool slots must be a positive number"); return; }

    const machine = { name: trimmed, type, toolSlots: slots };
    if (type === "lathe" && turretSlots.trim()) {
      const ts = parseInt(turretSlots, 10);
      if (!isNaN(ts) && ts > 0) machine.turretToolSlots = ts;
    }
    onAdd(machine);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Add Machine</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider mb-1.5">Machine Name</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="e.g. Doosan Puma 2600" />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider mb-1.5">Machine Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider mb-1.5">Tool Slots</Label>
            <Input type="number" min="1" value={toolSlots} onChange={(e) => setToolSlots(e.target.value)} />
          </div>
          {type === "lathe" && (
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider mb-1.5">Turret Tool Slots (optional)</Label>
              <Input type="number" min="1" value={turretSlots} onChange={(e) => setTurretSlots(e.target.value)} placeholder="e.g. 24" />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Machine</Button>
        </div>
      </div>
    </div>
  );
}