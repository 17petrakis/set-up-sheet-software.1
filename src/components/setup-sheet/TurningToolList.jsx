import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus } from "lucide-react";
import TurretBlock from "@/components/turning-tools/TurretBlock";

const MAX_TURRETS = 3;

export default function TurningToolList({ tools, onChange }) {
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

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Tool List (Turret)">
          {turrets.length < MAX_TURRETS && (
            <Button type="button" size="sm" variant="outline" onClick={addTurret} className="h-8 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Turret
            </Button>
          )}
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