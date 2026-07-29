import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import StationPhotos from "./StationPhotos";
import ViseFields from "./ViseFields";
import ColletChuckFields from "./ColletChuckFields";
import TallonGripFields from "./TallonGripFields";
import FixturePlateFields from "./FixturePlateFields";
import VacuumPlateFields from "./VacuumPlateFields";
import CustomFixtureFields from "./CustomFixtureFields";
import CommonStationFields from "./CommonStationFields";
import { DT_FIXTURE_TYPES, NUM_VISES_3 } from "@/lib/fixturingOptions";

export default function DrillTapStationCard({ station, index, onChange, onRemove }) {
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

      <FixturingField label="Fixture Type">
        <FixturingSelect
          value={station.fixture_type || ""}
          onChange={(v) => update("fixture_type", v)}
          options={DT_FIXTURE_TYPES}
        />
      </FixturingField>

      {station.fixture_type === "Vise" && (
        <ViseFields data={station} onChange={onChange} numVisesOptions={NUM_VISES_3} />
      )}
      {station.fixture_type === "Collet Chuck" && (
        <ColletChuckFields data={station} onChange={onChange} />
      )}
      {station.fixture_type === "Tallon Grip" && (
        <TallonGripFields data={station} onChange={onChange} />
      )}
      {station.fixture_type === "Fixture Plate" && (
        <FixturePlateFields data={station} onChange={onChange} />
      )}
      {station.fixture_type === "Vacuum Plate" && (
        <VacuumPlateFields data={station} onChange={onChange} />
      )}
      {station.fixture_type === "Custom" && (
        <CustomFixtureFields data={station} onChange={onChange} />
      )}

      <CommonStationFields data={station} onChange={onChange} showStickout={false} />
      <StationPhotos photos={station.photos || []} onChange={(photos) => onChange({ ...station, photos })} />
    </div>
  );
}