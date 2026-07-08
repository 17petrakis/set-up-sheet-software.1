// Shared option lists and empty-station defaults for the fixturing section.

// ── HMC ──
export const HMC_TOMBSTONE_TYPES = [
  "4-Face Tombstone",
  "2-Face Tombstone",
  "Angle Plate",
  "Pallet Fixture Plate",
  "Custom Fixture Block",
  "None",
];

// HMC machines without tombstones (e.g. MX-330, MX-520)
export const HMC_FIXTURE_TYPES = [
  "Angle Plate",
  "Pallet Fixture Plate",
  "Custom Fixture Block",
  "None",
];

export const HMC_WORKHOLDING = [
  "Vise",
  "Custom Fixture Block",
  "Mitee-Bite / Edge Clamp",
  "Soft Jaw Pocket",
  "Direct Clamp",
  "Dovetail Fixture",
  "Collet / Chuck",
  "None",
];

// ── VMC ──
export const VMC_FIXTURE_TYPES = ["Vise", "Fixture Plate", "Direct Clamp", "Vacuum Plate", "Soft Jaw Pocket", "Custom"];

// ── Drill-Tap ──
export const DT_FIXTURE_TYPES = ["Vise", "Collet Chuck", "Tallon Grip", "Vacuum Plate", "Fixture Plate", "Custom"];

// ── Shared ──
export const VISE_MODELS = ["Kurt Vise", "5th Axis Vise", "Lang Vise", "Other"];
export const JAW_TYPES = ["Hard Jaws", "Soft Jaws", "Step Jaws", "Tallon Grip", "Versa-Grip"];
export const NUM_VISES_3 = ["1", "2", "3"];
export const NUM_VISES_2 = ["1", "2"];
export const WORK_OFFSETS_FULL = ["G54", "G55", "G56", "G57", "G58", "G59"];
export const WORK_OFFSETS_4 = ["G54", "G55", "G56", "G57"];
export const WORK_OFFSETS_2 = ["G54", "G55"];

// ── HMC Custom Fixture Block ──
export const CLAMP_TYPES_HMC = ["Mitee-Bite", "Edge Clamp", "Strap Clamp", "Socket Head Cap Screw", "Custom"];

// ── HMC / VMC Soft Jaw Pocket ──
export const JAW_MATERIALS = ["Aluminum", "Steel", "Delrin"];

// ── VMC Fixture Plate ──
export const CLAMP_TYPES_VMC = ["Mitee-Bite", "Strap Clamp", "SHCS", "Custom"];

// ── Bandsaw ──
export const BANDSAW_STOCK_TYPES = ["Bar Round", "Bar Square", "Bar Rectangular", "Plate", "Tube", "Structural"];
export const BANDSAW_BLADE_TPI = ["3/4", "6/10", "8/12", "10/14", "14"];

// ── Empty station defaults ──
export const emptyHmcStation = {
  pallet_id: "",
  face_label: "",
  tombstone_structure: "",
  workholding_type: "",
  vise_model: "Kurt Vise",
  jaw_type: "",
  num_vises: "",
  parallels: false,
  parallel_height: "",
  work_offset: "",
  fixture_block_id: "",
  clamp_type: "",
  parts_per_face: "",
  jaw_material: "",
  pocket_depth: "",
  parts_per_jaw_set: "",
  part_stickout: "",
  work_coordinate_system: "",
  work_stop: false,
  workholding_note: "",
  notes: "",
  photos: [],
};

export const emptyVmcStation = {
  station_label: "",
  fixture_type: "",
  vise_model: "Kurt Vise",
  jaw_type: "",
  parallels: false,
  parallel_height: "",
  work_offset: "",
  fixture_plate_id: "",
  clamp_type: "",
  plate_id: "",
  jaw_material: "",
  pocket_depth: "",
  parts_per_jaw_set: "",
  part_stickout: "",
  work_coordinate_system: "",
  work_stop: false,
  notes: "",
  photos: [],
};

export const emptyDrillTapStation = {
  station_label: "",
  fixture_type: "",
  vise_model: "Kurt Vise",
  jaw_type: "",
  parallels: false,
  parallel_height: "",
  num_vises: "",
  work_offset: "",
  collet_size: "",
  grip_size: "",
  part_stickout: "",
  work_coordinate_system: "",
  work_stop: false,
  notes: "",
  photos: [],
};