import VmcStationCard from "./VmcStationCard";

export default function VmcSection({ data, onChange }) {
  const stations = data.stations || [];

  const updateStation = (i, updated) => {
    const next = [...stations];
    next[i] = updated;
    onChange({ ...data, stations: next });
  };

  return (
    <div className="space-y-3">
      {stations.map((s, i) => (
        <VmcStationCard
          key={i}
          station={s}
          index={i}
          onChange={(updated) => updateStation(i, updated)}
        />
      ))}

    </div>
  );
}