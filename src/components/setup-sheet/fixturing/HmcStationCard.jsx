import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import StationPhotos from "./StationPhotos";
import ViseFields from "./ViseFields";
import ColletChuckFields from "./ColletChuckFields";
import CustomFixtureFields from "./CustomFixtureFields";
import SoftJawPocketFields from "./SoftJawPocketFields";
import CommonStationFields from "./CommonStationFields";
import WorkholdingNoteField from "./WorkholdingNoteField";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { HMC_WORKHOLDING, NUM_VISES_3 } from "@/lib/fixturingOptions";

const NOTE_WORKHOLDING_TYPES = ["Mitee-Bite / Edge Clamp", "Direct Clamp", "Dovetail Fixture"];

export default function HmcStationCard({ station, index, machine, onChange, onRemove, isFirst }) {
  const update = (field, val) => onChange({ ...station, [field]: val });
  const summary = station.fixture_structure_note || "";

  return (
    <div className="border border-border/60 rounded-lg bg-muted/10">
      <div className="flex items-center justify-between p-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Station {index + 1}{summary ? ` — ${summary.slice(0, 40)}${summary.length > 40 ? "…" : ""}` : ""}
        </span>
        {!isFirst && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onRemove}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <div className="px-3 pb-3 space-y-3">
        <FixturingField label="Fixture Structure / Tombstone Note">
          <AutoResizeTextarea
            value={station.fixture_structure_note || ""}
            onChange={(e) => update("fixture_structure_note", e.target.value)}
            placeholder="Type or voice dictate description…"
            className="text-sm bg-background border-border/60 min-h-[60px]"
          />
        </FixturingField>

        <StationPhotos
          photos={station.fixture_photos || []}
          onChange={(photos) => update("fixture_photos", photos)}
          label="Fixture Photos"
        />

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
    </div>
  );
}