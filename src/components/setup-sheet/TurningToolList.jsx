import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, RefreshCw } from "lucide-react";
import TurretBlock from "@/components/turning-tools/TurretBlock";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

const MAX_TURRETS = 3;

export default function TurningToolList({ tools, onChange, machine }) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

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
      const payload = {
        machineId: machine,
        turrets: turrets,
      };
      const res = await base44.functions.invoke('syncTurretListToMachine', payload);
      const data = res.data || res;
      const t = toast({
        title: "Machine turret list updated",
        description: data.message || data.summary || "Sync complete.",
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
            <Button type="button" size="sm" variant="outline" onClick={handleSync} disabled={syncing} className="h-8 text-xs gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> Update Machine's Tool List
            </Button>
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