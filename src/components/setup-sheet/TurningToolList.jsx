import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, ExternalLink, Upload } from "lucide-react";
import TurretBlock from "@/components/turning-tools/TurretBlock";
import { getTurretToolSlots } from "@/lib/machines";
import { parseTurningToolExcel } from "@/lib/turningToolImport";
import { useToast } from "@/components/ui/use-toast";
import {
  getProgramMode, getProgramKeys, getTurretTypeForProgram,
  getPreferredTurretOrder, getTurretOptionsForTurret,
} from "@/lib/turningMachineConfig";

const MAX_TURRETS = 3;

export default function TurningToolList({ tools, onChange, machine, showSync = true, sheetId, programNumbers, narrowTurretOptions = true }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedTools = await parseTurningToolExcel(file);
      if (importedTools.length === 0) {
        toast({ title: "No tools found", description: "No tools were found in the Excel file.", variant: "destructive" });
        return;
      }
      let updatedTurrets = [...turrets];
      if (updatedTurrets.length === 0) {
        updatedTurrets = [{ turret_type: "", turn: "", tools: [] }];
      }
      updatedTurrets[0] = {
        ...updatedTurrets[0],
        tools: [...(updatedTurrets[0].tools || []), ...importedTools],
      };
      onChange({ ...tools, turrets: updatedTurrets });
      toast({ title: "Import successful", description: `${importedTools.length} tool${importedTools.length !== 1 ? "s" : ""} imported.` });
    } catch (err) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleMoveTool = (toTurretIdx, fromTurretIdx, toolIdx) => {
    const newTurrets = turrets.map(t => ({ ...t, tools: [...(t.tools || [])] }));
    const tool = newTurrets[fromTurretIdx].tools[toolIdx];
    if (!tool) return;
    newTurrets[fromTurretIdx].tools.splice(toolIdx, 1);
    newTurrets[toTurretIdx].tools.push(tool);
    setTurrets(newTurrets);
  };

  const handleViewMachineList = () => {
    if (machine && sheetId) {
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
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <Button type="button" size="sm" variant="outline" onClick={handleImportClick} className="h-8 text-xs gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Import
            </Button>
            {showSync && machine && sheetId && (
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
            otherTurrets={turrets.map((t, idx) => ({
              index: idx,
              name: t.turret_type || `Turret ${idx + 1}`,
            })).filter(t => t.index !== i)}
            onMoveTool={handleMoveTool}
          />
        ))}
      </CardContent>
    </Card>
  );
}