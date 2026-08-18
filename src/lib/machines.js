export const MACHINES = [
  { name: "Matsuura MX-520", type: "mill", toolSlots: 40 },
  { name: "Matsuura MX-330", type: "mill", toolSlots: 90 },
  { name: "Matsuura MAM72-35 V", type: "mill", toolSlots: 320 },
  { name: "Matsuura H.Plus-405", type: "mill", toolSlots: 320 },
  { name: "MORI SIEKI NH 4000 DCG", type: "mill", toolSlots: 60 },
  { name: "MORI SIEKI NL 2000", type: "lathe", toolSlots: 20 },
  { name: "HAAS DT1", type: "mill", toolSlots: 24 },
  { name: "HAAS SL-10", type: "lathe", toolSlots: 20 },
  { name: "HAAS VF 4SS", type: "mill", toolSlots: 31 },
  { name: "HAAS DM1", type: "mill", toolSlots: 24 },
  { name: "OKUMA", type: "mill", toolSlots: 40 },
  { name: "Doosan Puma 2100Y II", type: "lathe", toolSlots: 20 },
  { name: "Doosan Puma MX2100ST", type: "lathe", toolSlots: 20, turretToolSlots: { "Upper – Mill (B-axis)": 40 } },
  { name: "DMG Mori NH4000DCG", type: "mill", toolSlots: 20 },
  { name: "DMG Mori RPS-NHX-4000", type: "mill", toolSlots: 280 },
  { name: "Citizen L20", type: "lathe", toolSlots: 20 },
  { name: "Doosan SMX2100", type: "lathe", toolSlots: 20, turretToolSlots: { "Upper – Mill (B-axis)": 80 } },
  { name: "Nakamura NTY3-150", type: "lathe", toolSlots: 20, turretToolSlots: 24 },
  { name: "Nakamura WY-150", type: "lathe", toolSlots: 20, turretToolSlots: 24 },
  { name: "Manual", type: "mill", toolSlots: 20 },
];

export const DEFAULT_TOOL_SLOTS = 20;

export const MACHINE_NAMES = MACHINES.map((m) => m.name);

export const isKnownMachine = (name) =>
  MACHINE_NAMES.some((n) => n.toLowerCase() === (name || "").toLowerCase().trim());

export const getToolSlots = (machine) =>
  machine && Number.isFinite(machine.toolSlots) ? machine.toolSlots : DEFAULT_TOOL_SLOTS;

// Returns max tools per turret for a lathe machine + turret type, or null = unlimited
export const getTurretToolSlots = (machineName, turretType) => {
  const machine = MACHINES.find(
    (m) => m.name.toLowerCase() === (machineName || "").toLowerCase().trim()
  );
  if (!machine || !machine.turretToolSlots) return null;
  const slots = machine.turretToolSlots;
  if (typeof slots === "number") return slots;
  if (turretType && slots[turretType] != null) return slots[turretType];
  return null;
};