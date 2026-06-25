import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import ComboBox from "@/components/ui/ComboBox";
import FixturingField from "./FixturingField";
import ChipGroup from "./ChipGroup";
import ViseFields from "./ViseFields";
import { TOMBSTONE_TYPES, HMC_WORKHOLDING } from "@/lib/fixturingOptions";

export default function HmcStationCard({ station, index, onChange, onRemove }) {
  const update = (field, val) => onChange({ ...station, [field]: val });

  return (
    <div className="border border-border/60 rounded-lg p-3 space-y-3 bg-muted/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Station {index + 1}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="h-7 w-7 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <FixturingField label="Pallet ID">
          <Input
            value={station.pallet_id || ""}
            onChange={(e) => update("pallet_id", e.target.value)}
            placeholder="A, B, 1, 2"
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
        <FixturingField label="Tombstone / Fixture Type">
          <ComboBox
            value={station.tombstone_type || ""}
            onChange={(v) => update("tombstone_type", v)}
            options={TOMBSTONE_TYPES}
            placeholder="Select…"
            allowFreeText={false}
            className="h-9 text-sm px-3 w-full"
          />
        </FixturingField>
        <FixturingField label="Bolt Pattern Ref">
          <Input
            value={station.bolt_pattern || ""}
            onChange={(e) => update("bolt_pattern", e.target.value)}
            placeholder="e.g. E9, E13"
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
        <FixturingField label="Part Stick-out / Orientation">
          <Input
            value={station.part_stickout || ""}
            onChange={(e) => update("part_stickout", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      </div>

      <FixturingField label="Workholding Type">
        <ChipGroup
          value={station.workholding_type || ""}
          onChange={(v) => update("workholding_type", v)}
          options={HMC_WORKHOLDING}
        />
      </FixturingField>

      {station.workholding_type === "Vise" && (
        <ViseFields data={station} onChange={onChange} showViseModel />
      )}

      <FixturingField label="Station Notes">
        <AutoResizeTextarea
          value={station.notes || ""}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Station-specific notes…"
          className="min-h-[60px] text-sm bg-background border-border/60"
        />
      </FixturingField>
    </div>
  );
}