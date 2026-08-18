import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, ExternalLink } from "lucide-react";
import TurretBlock from "@/components/turning-tools/TurretBlock";
import { isKnownMachine, getTurretToolSlots } from "@/lib/machines";
import {
  getProgramMode, getProgramKeys, getTurretTypeForProgram,
  getPreferredTurretOrder, getTurretOptionsForTurret,
} from "@/lib/turningMachineConfig";

const MAX_TURRETS = 3;

export default function TurningToolList({ tools, onChange, machine, showSync = true, sheetId, programNumbers, narrowTurretOptions = true }) {
  const navigate = useNavigate();

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

  const programMode = getProgramMode(machine);

  // Auto-sync turrets based on active program checkboxes
  useEffect(() => {
    if (programMode === "single") return;
    const keys = getProgramKeys(programMode);
    const neededTypes = keys
      .filter(k => programNumbers?.[k]?.active)
      .map(k => getTurretTypeForProgram(k));
    const preferredOrder = getPreferredTurretOrder(programMode);
    const sortedNeeded = [...neededTypes].sort((a, b) =>
      preferredOrder.indexOf(a) - preferredOrder.indexOf(b)
    );

    let updated = [];
    // Add turrets in preferred order for active programs
    for (const type of sortedNeeded) {
      const existing = turrets.find(t => t.turret_type === type);
      updated.push(existing || { turret_type: type, turn: "", tools: [] });
    }
    // Keep turrets with tools whose type isn't in the active set
    for (const turret of turrets) {
      if (!sortedNeeded.includes(turret.turret_type) && (turret.tools || []).length > 0) {
        updated.push(turret);
      }
    }

    const currentSig = turrets.map(t => `${t.turret_type}:${(t.tools || []).length}`).join("|");
    const updatedSig = updated.map(t => `${t.turret_type}:${(t.tools || []).length}`).join("|");
    if (currentSig !== updatedSig) {
      onChange({ ...tools, turrets: updated });
    }
  }, [programNumbers, programMode]);

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
            turretOptions={narrowTurretOptions ? getTurretOptionsForTurret(programMode, turret.turret_type) : undefined}
            maxTools={getTurretToolSlots(machine, turret.turret_type)}
          />
        ))}
      </CardContent>
    </Card>
  );
}