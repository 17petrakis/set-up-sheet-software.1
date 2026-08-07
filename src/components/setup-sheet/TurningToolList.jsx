import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, RefreshCw, ExternalLink } from "lucide-react";
import TurretBlock from "@/components/turning-tools/TurretBlock";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { isKnownMachine } from "@/lib/machines";

const MAX_TURRETS = 3;

const isToolEmpty = (t) =>
  !Object.entries(t || {}).some(([k, v]) =>
    k !== "_id" && k !== "tool_kind" && k !== "tool_number" && v && String(v).trim()
  );

const toolKey = (t) =>
  [t.tool_type, t.diameter, t.flutes, t.holder, t.name, t.angle]
    .map((v) => (v || "").toString().trim().toLowerCase())
    .join("|");

export default function TurningToolList({ tools, onChange, machine, showSync = true, sheetId }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  const handleViewMachineList = () => {
    if (machine && isKnownMachine(machine) && sheetId) {
      navigate(`/turning-tool-sync/${sheetId}`);
    }
  };

  // tools is now an object: { turrets: [...] }
  const turrets = tools?.turrets || [];

  const setTurrets = (updated) => onChange({ ...tools, turrets: updated });

  const addTurret = () => {
    if (turrets.length >= MAX_TURRETS) return;
    setTurrets([...turrets, { turret_type: "", turn: "", tools: [] }]);
  };

  const updateTurret = (i, updated) => {
    const t = [...turrets];
    t[i] = updated;
    setTurrets(t);
  };

  const removeTurret = (i) => {
    setTurrets(turrets.filter((_, idx) => idx !== i));
  };

  const handleSync = async () => {
    if (!machine) {
      toast({ title: "No machine selected", description: "Please select a machine before syncing.", variant: "destructive" });
      return;
    }
    setSyncing(true);
    try {
      // Load the MachineTool record for this machine
      const results = await base44.entities.MachineTool.filter({ machine_name: machine });
      const machineRec = results && results.length > 0 ? results[0] : null;

      // Deep-copy machine turrets so we can mutate safely
      const machineTurrets = machineRec && Array.isArray(machineRec.turrets)
        ? machineRec.turrets.map(t => ({ ...t, tools: [...(t.tools || [])] }))
        : [];

      let addedCount = 0;
      let createdTurrets = 0;

      for (const sheetTurret of turrets) {
        if (!sheetTurret.turret_type) continue;

        // Find matching machine turret by turret_type
        let machineTurret = machineTurrets.find(t => t.turret_type === sheetTurret.turret_type);
        if (!machineTurret) {
          machineTurret = { turret_type: sheetTurret.turret_type, tools: [] };
          machineTurrets.push(machineTurret);
          createdTurrets++;
        }

        const existingTools = machineTurret.tools || [];
        const existingKeys = new Set(existingTools.map(toolKey));
        const sheetTools = (sheetTurret.tools || []).filter(t => !isToolEmpty(t));

        for (const st of sheetTools) {
          const k = toolKey(st);
          if (!k || existingKeys.has(k)) continue;
          existingKeys.add(k);
          const { _id, ...clean } = st;
          existingTools.push(clean);
          addedCount++;
        }

        machineTurret.tools = existingTools;
      }

      // Save the updated MachineTool entity
      const data = {
        machine_name: machine,
        machine_type: "lathe",
        turrets: machineTurrets,
        tools: machineRec ? (machineRec.tools || []) : [],
      };

      if (machineRec) {
        await base44.entities.MachineTool.update(machineRec.id, data);
      } else {
        await base44.entities.MachineTool.create(data);
      }

      // Also push to the external procedure app (non-blocking — local entity already saved)
      const payload = { machineId: machine, turrets };
      try {
        await base44.functions.invoke('syncTurretListToMachine', payload);
      } catch (extErr) {
        console.warn("External sync failed (local entity already updated)", extErr);
      }

      const t = toast({
        title: "Machine turret list updated",
        description: `${addedCount} tool(s) added${createdTurrets ? `, ${createdTurrets} turret(s) created` : ""}.`,
      });
      setTimeout(() => t.dismiss(), 30000);
    } catch (err) {
      const t = toast({
        title: "Sync failed",
        description: err?.response?.data?.error || err?.message || "Could not sync turret list.",
        variant: "destructive",
      });
      setTimeout(() => t.dismiss(), 30000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Tool List (Turret)">
          <div className="flex items-center gap-2">
            {showSync && machine && isKnownMachine(machine) && sheetId && (
              <Button type="button" size="sm" variant="outline" onClick={handleViewMachineList} className="h-8 text-xs gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Machine Tool List
              </Button>
            )}
            {showSync && (
              <Button type="button" size="sm" variant="outline" onClick={handleSync} disabled={syncing} className="h-8 text-xs gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> Update Machine's Tool List (Beta)
              </Button>
            )}
            {turrets.length < MAX_TURRETS && (
              <Button type="button" size="sm" variant="outline" onClick={addTurret} className="h-8 text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Turret
              </Button>
            )}
          </div>
        </SectionHeader>

        {turrets.length === 0 && (
          <p className="text-sm text-muted-foreground mb-4">No turrets added yet. Add up to {MAX_TURRETS} turrets.</p>
        )}

        {turrets.map((turret, i) => (
          <TurretBlock
            key={i}
            index={i}
            turret={turret}
            onChange={(updated) => updateTurret(i, updated)}
            onRemove={() => removeTurret(i)}
          />
        ))}
      </CardContent>
    </Card>
  );
}