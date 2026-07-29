import DrillTapStationCard from "./DrillTapStationCard";
import { emptyDrillTapStation } from "@/lib/fixturingOptions";

export default function DrillTapSection({ data, onChange }) {
  const stations = data.stations?.length ? data.stations : [{ ...emptyDrillTapStation }];

  const updateStation = (i, updated) => {
    const next = [...stations];
    next[i] = updated;
    onChange({ ...data, stations: next });
  };

  return (
    <div className="space-y-3">
      {stations.map((s, i) => (
        <DrillTapStationCard
          key={i}
          station={s}
          index={i}
          onChange={(updated) => updateStation(i, updated)}
        />
      ))}

    </div>
  );
}