import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import StationPhotos from "./StationPhotos";
import ViseFields from "./ViseFields";
import ColletChuckFields from "./ColletChuckFields";
import CustomFixtureFields from "./CustomFixtureFields";
import SoftJawPocketFields from "./SoftJawPocketFields";
import CommonStationFields from "./CommonStationFields";
import WorkholdingNoteField from "./WorkholdingNoteField";
import { HMC_TOMBSTONE_TYPES, HMC_FIXTURE_TYPES, HMC_WORKHOLDING, NUM_VISES_3 } from "@/lib/fixturingOptions";

const NOTE_WORKHOLDING_TYPES = ["Mitee-Bite / Edge Clamp", "Direct Clamp", "Dovetail Fixture"];

const NO_TOMBSTONE_MACHINES = ["matsuuramx330", "matsuuramx520"];
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export default function HmcStationCard({ station, index, machine, onChange, onRemove }) {
  const [collapsed, setCollapsed] = useState(false);
  const update = (field, val) => onChange({ ...station, [field]: val });
  const summary = station.pallet_note || "";
  const noTombstone = NO_TOMBSTONE_MACHINES.includes(norm(machine));
  const structureOptions = noTombstone ? HMC_FIXTURE_TYPES : HMC_TOMBSTONE_TYPES;

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FixturingField label="Pallet Note">
              <Input
                value={station.pallet_note || ""}
                onChange={(e) => update("pallet_note", e.target.value)}
                placeholder="Pallet / face info"
                className="h-9 text-sm bg-background border-border/60"
              />
            </FixturingField>
            <FixturingField label={noTombstone ? "Fixture Structure" : "Tombstone / Fixture Structure"}>
              <FixturingSelect
                value={station.tombstone_structure || ""}
                onChange={(v) => update("tombstone_structure", v)}
                options={structureOptions}
              />
            </FixturingField>
          </div>

          <FixturingField label="Workholding Type">
            <FixturingSelect
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
            />
          )}
          {station.workholding_type === "Custom Fixture Block" && (
            <CustomFixtureFields data={station} onChange={onChange} />
          )}
          {station.workholding_type === "Collet Chuck" && (
            <ColletChuckFields data={station} onChange={onChange} />
          )}
          {station.workholding_type === "Soft Jaw Pocket" && (
            <SoftJawPocketFields data={station} onChange={onChange} />
          )}
          {NOTE_WORKHOLDING_TYPES.includes(station.workholding_type) && (
            <WorkholdingNoteField data={station} onChange={onChange} />
          )}

          <CommonStationFields data={station} onChange={onChange} stickoutLabel="Part Stick-out / Orientation" showStickout={false} />
          <StationPhotos photos={station.photos || []} onChange={(photos) => onChange({ ...station, photos })} />
        </div>
      )}
    </div>
  );
}