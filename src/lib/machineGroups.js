// Machine → fixturing layout group mapping.
// Values must match the label strings produced by the GeneralInfo MACHINES cascading dropdown.

const HMC_PALLET = [
  "Matsuura MX-520",
  "Matsuura MX-330",
  "Matsuura MAM72-35 V",
  "Matsuura H.Plus-405",
  "Mori Seiki NH 4000 DCG",
  "OKUMA",
  "HYD MECH H-10A",
];

const VMC = ["HAAS VF 4SS"];

const DRILL_TAP = ["HAAS DT1", "HAAS DM1"];

const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const HMC_NORM = new Set(HMC_PALLET.map(normalize));
const VMC_NORM = new Set(VMC.map(normalize));
const DT_NORM = new Set(DRILL_TAP.map(normalize));

/**
 * Returns "hmc" | "vmc" | "drill_tap" | null
 * null = no machine selected (or unrecognised) → show fallback message.
 */
export function getMachineGroup(machine) {
  if (!machine) return null;
  const n = normalize(machine);
  if (VMC_NORM.has(n)) return "vmc";
  if (DT_NORM.has(n)) return "drill_tap";
  if (HMC_NORM.has(n)) return "hmc";
  return null;
}