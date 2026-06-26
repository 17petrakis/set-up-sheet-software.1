import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import StationPhotos from "./StationPhotos";
import ViseFields from "./ViseFields";
import FixturePlateFields from "./FixturePlateFields";
import VacuumPlateFields from "./VacuumPlateFields";
import CommonStationFields from "./CommonStationFields";
import { VMC_FIXTURE_TYPES } from "@/lib/fixturingOptions";

export default function VmcStationCard({ station, index, onChange, onRemove }) {
  const update = (field, val) => onChange({ ...station, [field]: val });

  return (
    <div className="border border-border/60 rounded-lg p-3 space-y-3 bg-muted/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {station.station_label || `Station ${index + 1}`}
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

      <div className="sm:max-w-xs">
        <FixturingField label="Station Label">
          <Input
            value={station.station_label || ""}
            onChange={(e) => update("station_label", e.target.value)}
            placeholder="Vise 1, Fixture"
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      </div>

      <FixturingField label="Fixture Type">
        <FixturingSelect
          value={station.fixture_type || ""}
          onChange={(v) => update("fixture_type", v)}
          options={VMC_FIXTURE_TYPES}
        />
      </FixturingField>

      {station.fixture_type === "Vise" && (
        <ViseFields data={station} onChange={onChange} numVisesOptions={null} />
      )}
      {station.fixture_type === "Fixture Plate" && (
        <FixturePlateFields data={station} onChange={onChange} />
      )}
      {station.fixture_type === "Vacuum Plate" && (
        <VacuumPlateFields data={station} onChange={onChange} />
      )}

      <CommonStationFields data={station} onChange={onChange} stickoutLabel="Part Stick-out" showStickout={false} />
      <StationPhotos photos={station.photos || []} onChange={(photos) => onChange({ ...station, photos })} />
    </div>
  );
}