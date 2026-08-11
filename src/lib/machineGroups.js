// Machine → fixturing layout group mapping.
// Machine labels come from the GeneralInfo MACHINES cascading dropdown.
// getMachineGroup returns: "hmc" | "vmc" | "drill_tap" | "bandsaw" | null

const HMC_PALLET = [
  "Matsuura MX-520",
  "Matsuura MX-330",
  "Matsuura MAM72-35 V",
  "Matsuura H.Plus-405",
  "Mori Seiki NH 4000 DCG",
  "DMG Mori NH4000DCG",
];

const VMC = ["HAAS VF 4SS", "OKUMA", "Manual"];

const DRILL_TAP = ["HAAS DT1", "HAAS DM1"];

const BANDSAW = ["HYD MECH H-10A"];

const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const HMC_NORM = new Set(HMC_PALLET.map(normalize));
const VMC_NORM = new Set(VMC.map(normalize));
const DT_NORM = new Set(DRILL_TAP.map(normalize));
const BANDSAW_NORM = new Set(BANDSAW.map(normalize));

export function getMachineGroup(machine) {
  if (!machine) return null;
  const n = normalize(machine);
  if (BANDSAW_NORM.has(n)) return "bandsaw";
  if (VMC_NORM.has(n)) return "vmc";
  if (DT_NORM.has(n)) return "drill_tap";
  if (HMC_NORM.has(n)) return "hmc";
  return null;
}

// Citizen swiss-type lathes use a dedicated workholding/part-eject format.
export function isCitizenMachine(machine) {
  if (!machine) return false;
  return normalize(machine).startsWith("citizen");
}