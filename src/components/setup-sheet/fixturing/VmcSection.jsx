import { Plus } from "lucide-react";
import VmcStationCard from "./VmcStationCard";
import { emptyVmcStation } from "@/lib/fixturingOptions";

export default function VmcSection({ data, onChange }) {
  const stations = data.stations || [];

  const updateStation = (i, updated) => {
    const next = [...stations];
    next[i] = updated;
    onChange({ ...data, stations: next });
  };
  const addStation = () => onChange({ ...data, stations: [...stations, { ...emptyVmcStation }] });
  const removeStation = (i) =>
    onChange({ ...data, stations: stations.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      {stations.map((s, i) => (
        <VmcStationCard
          key={i}
          station={s}
          index={i}
          onChange={(updated) => updateStation(i, updated)}
          onRemove={() => removeStation(i)}
        />
      ))}
      <button
        type="button"
        onClick={addStation}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-border transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4" /> Add Station
      </button>
    </div>
  );
}