// Shared option lists and defaults for the fixturing section.

export const TOMBSTONE_TYPES = [
  "4-Face Tombstone",
  "2-Face Tombstone",
  "Angle Plate",
  "Pallet Fixture",
  "Custom Fixture",
  "None",
];

export const HMC_WORKHOLDING = [
  "Vise",
  "Direct Clamp",
  "Soft Jaws",
  "Step Jaws",
  "Custom Fixture",
  "None",
];

export const VISE_MODELS = ['Kurt 5"', 'Kurt 6"', "Lang Makro", "Chick", "Custom"];

export const JAW_TYPES = ["Hard Jaws", "Soft Jaws", "Step Jaws", "Tallon Grip", "Versa-Grip"];

export const VMC_FIXTURE_TYPES = ["Vise", "Fixture Plate", "Direct Clamp", "Vacuum Plate", "Custom"];

export const VMC_WORK_OFFSETS = ["G54", "G55", "G56", "G57", "G58", "G59"];

export const DT_FIXTURE_TYPES = ["Collet Chuck", "Vise", "Tallon Grip", "Vacuum Plate", "Fixture Plate", "Custom"];

export const DT_WORK_OFFSETS = ["G54", "G55", "G56", "G57"];

export const emptyStation = {
  pallet_id: "",
  tombstone_type: "",
  bolt_pattern: "",
  workholding_type: "",
  vise_model: "",
  jaw_type: "",
  parallels: false,
  parallel_height: "",
  part_stickout: "",
  notes: "",
};