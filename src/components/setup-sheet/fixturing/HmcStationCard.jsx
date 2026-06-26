import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import ChipGroup from "./ChipGroup";
import ViseFields from "./ViseFields";
import CustomFixtureFields from "./CustomFixtureFields";
import SoftJawPocketFields from "./SoftJawPocketFields";
import CommonStationFields from "./CommonStationFields";
import { HMC_TOMBSTONE_TYPES, HMC_WORKHOLDING, NUM_VISES_3, WORK_OFFSETS_FULL } from "@/lib/fixturingOptions";

export default function HmcStationCard({ station, index, onChange, onRemove }) {
  const [collapsed, setCollapsed] = useState(false);
  const update = (field, val) => onChange({ ...station, [field]: val });
  const summary = [station.pallet_id, station.face_label].filter(Boolean).join(" — ");

  return (
    <div className="border border-border/60 rounded-lg bg-muted/10">
      <div className="flex items-center justify-between p-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-left"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Station {index + 1}{summary ? ` — ${summary}` : ""}
          </span>
        </button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="h-7 w-7 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      {!collapsed && (
        <div className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FixturingField label="Pallet ID">
              <Input
                value={station.pallet_id || ""}
                onChange={(e) => update("pallet_id", e.target.value)}
                placeholder="01, A"
                className="h-9 text-sm bg-background border-border/60"
              />
            </FixturingField>
            <FixturingField label="Face / Station Label">
              <Input
                value={station.face_label || ""}
                onChange={(e) => update("face_label", e.target.value)}
                placeholder="Face 1, Station A"
                className="h-9 text-sm bg-background border-border/60"
              />
            </FixturingField>
            <FixturingField label="Tombstone / Fixture Structure">
              <FixturingSelect
                value={station.tombstone_structure || ""}
                onChange={(v) => update("tombstone_structure", v)}
                options={HMC_TOMBSTONE_TYPES}
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
            <ViseFields
              data={station}
              onChange={onChange}
              numVisesOptions={NUM_VISES_3}
              workOffsetOptions={WORK_OFFSETS_FULL}
            />
          )}
          {station.workholding_type === "Custom Fixture Block" && (
            <CustomFixtureFields data={station} onChange={onChange} />
          )}
          {station.workholding_type === "Soft Jaw Pocket" && (
            <SoftJawPocketFields data={station} onChange={onChange} />
          )}

          <CommonStationFields data={station} onChange={onChange} stickoutLabel="Part Stick-out / Orientation" />
        </div>
      )}
    </div>
  );
}