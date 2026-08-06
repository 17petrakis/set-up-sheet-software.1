export const MACHINES = [
  { name: "Matsuura MX-520", type: "mill", toolSlots: 40 },
  { name: "Matsuura MX-330", type: "mill", toolSlots: 90 },
  { name: "Matsuura MAM72-35 V", type: "mill", toolSlots: 320 },
  { name: "Matsuura H.Plus-405", type: "mill", toolSlots: 20 },
  { name: "MORI SIEKI NH 4000 DCG", type: "mill", toolSlots: 20 },
  { name: "MORI SIEKI NL 2000", type: "lathe", toolSlots: 20 },
  { name: "HAAS DT1", type: "mill", toolSlots: 20 },
  { name: "HAAS SL-10", type: "lathe", toolSlots: 20 },
  { name: "HAAS VF 4SS", type: "mill", toolSlots: 30 },
  { name: "HAAS DM1", type: "mill", toolSlots: 19 },
  { name: "OKUMA", type: "mill", toolSlots: 40 },
  { name: "Doosan Puma 2100Y II", type: "lathe", toolSlots: 20 },
  { name: "Doosan Puma MX2100ST", type: "lathe", toolSlots: 20 },
  { name: "Nakamura WT-150II", type: "lathe", toolSlots: 20 },
  { name: "Nakamura AS-200", type: "lathe", toolSlots: 20 },
  { name: "Mori Seiki NL-2000SY", type: "lathe", toolSlots: 20 },
  { name: "Manual", type: "mill", toolSlots: 20 },
];

export const DEFAULT_TOOL_SLOTS = 20;

export const MACHINE_NAMES = MACHINES.map((m) => m.name);

export const isKnownMachine = (name) =>
  MACHINE_NAMES.some((n) => n.toLowerCase() === (name || "").toLowerCase().trim());

export const getToolSlots = (machine) =>
  machine && Number.isFinite(machine.toolSlots) ? machine.toolSlots : DEFAULT_TOOL_SLOTS;