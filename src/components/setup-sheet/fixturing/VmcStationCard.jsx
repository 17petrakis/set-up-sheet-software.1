import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import StationPhotos from "./StationPhotos";
import ViseFields from "./ViseFields";
import FixturePlateFields from "./FixturePlateFields";
import VacuumPlateFields from "./VacuumPlateFields";
import CustomFixtureFields from "./CustomFixtureFields";
import SoftJawPocketFields from "./SoftJawPocketFields";
import CommonStationFields from "./CommonStationFields";
import { VMC_FIXTURE_TYPES } from "@/lib/fixturingOptions";

export default function VmcStationCard({ station, onChange }) {
  const update = (field, val) => onChange({ ...station, [field]: val });

  return (
    <div className="border border-border/60 rounded-lg p-3 space-y-3 bg-muted/10">
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
      {station.fixture_type === "Soft Jaw Pocket" && (
        <SoftJawPocketFields data={station} onChange={onChange} />
      )}
      {station.fixture_type === "Custom" && (
        <CustomFixtureFields data={station} onChange={onChange} />
      )}

      <CommonStationFields data={station} onChange={onChange} stickoutLabel="Part Stick-out" showStickout={false} />
      <StationPhotos photos={station.photos || []} onChange={(photos) => onChange({ ...station, photos })} />
    </div>
  );
}