export const MACHINES = [
  { name: "Matsuura MX-520", type: "mill", toolSlots: 40 },
  { name: "Matsuura MX-330", type: "mill", toolSlots: 90 },
  { name: "Matsuura MAM72-35 V", type: "mill", toolSlots: 320 },
  { name: "Matsuura H.Plus-405", type: "mill", toolSlots: 20 },
  { name: "MORI SEIKI NH 4000 DCG", type: "mill", toolSlots: 20 },
  { name: "MORI SEIKI NL 2000", type: "lathe", toolSlots: 20 },
  { name: "HAAS DT1", type: "mill", toolSlots: 20 },
  { name: "HAAS SL10", type: "lathe", toolSlots: 20 },
  { name: "HAAS VF 4SS", type: "mill", toolSlots: 30 },
  { name: "HASS DM1", type: "mill", toolSlots: 19 },
  { name: "OKUMA", type: "mill", toolSlots: 40 },
  { name: "DOOSAN PUMA 2100 II", type: "lathe", toolSlots: 20 },
  { name: "DOOSAN PUMA MX2100ST", type: "lathe", toolSlots: 20 },
  { name: "Cincom Citzen", type: "lathe", toolSlots: 20 },
  { name: "MIC 1", type: "mill", toolSlots: 40 },
  { name: "MIC 2", type: "mill", toolSlots: 40 },
  { name: "MIC 3", type: "mill", toolSlots: 40 },
  { name: "MIC 4", type: "mill", toolSlots: 40 },
  { name: "MIC 5", type: "mill", toolSlots: 40 },
  { name: "MIC 6", type: "mill", toolSlots: 40 },
];

export const DEFAULT_TOOL_SLOTS = 20;
export const MACHINE_NAMES = MACHINES.map((m) => m.name);

export const isKnownMachine = (name) =>
  MACHINE_NAMES.some((n) => n.toLowerCase() === (name || "").toLowerCase().trim());

export const getMachineByName = (name) =>
  MACHINES.find((m) => m.name.toLowerCase() === (name || "").toLowerCase().trim());

export const getToolSlots = (machine) =>
  machine && Number.isFinite(machine.toolSlots) ? machine.toolSlots : DEFAULT_TOOL_SLOTS;