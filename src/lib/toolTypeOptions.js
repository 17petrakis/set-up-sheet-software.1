// ── Grouped tool type options for the cascading dropdown ──────────────────────
export const TOOL_TYPE_OPTIONS = [
  {
    label: "Endmill", children: [
      { label: "Square", value: "Square" },
      { label: "Corner Radius", value: "Corner Radius" },
      { label: "Ball", value: "Ball" },
      { label: "Lollipop", value: "Lollipop" },
      { label: "T-Slot", value: "T-Slot" },
      { label: "Chamfer Mill", value: "Chamfer Mill" },
      { label: "Thread Mill", value: "Thread Mill" },
      { label: "Engraving", value: "Engraving" },
      { label: "Woodruff/Keyseat", value: "Woodruff/Keyseat" },
      { label: "Roughing/Corncob", value: "Roughing/Corncob" },
    ]
  },
  {
    label: "Face Mill", children: [
      { label: "Face Mill", value: "Face Mill" },
      { label: "Shell Mill", value: "Shell Mill" },
      { label: "High-Feed Mill", value: "High-Feed Mill" },
      { label: "Shoulder Mill", value: "Shoulder Mill" },
    ]
  },
  {
    label: "Hole Making", children: [
      { label: "Center Drill", value: "Center Drill" },
      { label: "Spot Drill", value: "Spot Drill" },
      { label: "Drill", value: "Drill" },
      { label: "Countersink", value: "Countersink" },
      { label: "Counterbore", value: "Counterbore" },
      { label: "Reamer", value: "Reamer" },
      { label: "Boring Bar", value: "Boring Bar" },
      { label: "Back Boring Bar", value: "Back Boring Bar" },
      { label: "Tap", value: "Tap" },
    ]
  },
  {
    label: "Specialty", children: [
      { label: "Dovetail Cutter", value: "Dovetail Cutter" },
      { label: "Slitting Saw", value: "Slitting Saw" },
      { label: "Form Tool", value: "Form Tool" },
    ]
  },
];

// ── Toggleable field definitions (tool_number & tool_type are always visible) ─
export const TOOL_FIELDS = [
  { key: "diameter", label: "Diameter" },
  { key: "flutes", label: "Flutes" },
  { key: "flute_length", label: "Flute Length" },
  { key: "stickout_length", label: "Stickout Length" },
  { key: "exposed_length", label: "Exposed Length" },
  { key: "cut_length", label: "Cut Length" },
  { key: "holder", label: "Holder" },
  { key: "thread_pitch", label: "Thread Pitch" },
  { key: "thread_form", label: "Thread Form" },
  { key: "min_bore_diameter", label: "Min Bore Dia." },
  { key: "max_bore_diameter", label: "Max Bore Dia." },
  { key: "insert_count", label: "Insert Count" },
  { key: "insert_type", label: "Insert Type" },
  { key: "blade_thickness", label: "Blade Thickness" },
  { key: "arbor_size", label: "Arbor Size" },
];

// Short labels for compact row display
export const TOOL_FIELD_SHORT = {
  diameter: "Dia",
  flutes: "Flutes",
  flute_length: "Flute Len",
  stickout_length: "Stickout",
  exposed_length: "Exposed",
  cut_length: "Cut Len",
  holder: "Holder",
  thread_pitch: "Pitch",
  thread_form: "Form",
  min_bore_diameter: "Min Bore",
  max_bore_diameter: "Max Bore",
  insert_count: "# Ins",
  insert_type: "Insert",
  blade_thickness: "Blade",
  arbor_size: "Arbor",
};

// ── Type groupings for visibility logic ────────────────────────────────────────
const ENDMILL_TYPES = [
  "Square", "Corner Radius", "Ball", "Lollipop", "T-Slot",
  "Chamfer Mill", "Thread Mill", "Engraving", "Woodruff/Keyseat", "Roughing/Corncob",
];
const HOLE_MAKING_TYPES = [
  "Center Drill", "Spot Drill", "Drill", "Countersink", "Counterbore",
  "Reamer", "Boring Bar", "Back Boring Bar", "Tap",
];
const DRILL_REAMER_TYPES = [
  "Center Drill", "Spot Drill", "Drill", "Countersink", "Counterbore", "Reamer",
];
const FACE_MILL_TYPES = ["Face Mill", "Shell Mill"];

// ── Default visible fields based on tool_type ─────────────────────────────────
export function getDefaultVisibleFields(toolType) {
  const v = {};
  for (const f of TOOL_FIELDS) v[f.key] = false;

  // All tools show diameter + holder
  v.diameter = true;
  v.holder = true;

  if (ENDMILL_TYPES.includes(toolType)) {
    v.flutes = true;
    v.flute_length = true;
    v.stickout_length = true;
    v.exposed_length = true;
    v.cut_length = true;
  }
  if (HOLE_MAKING_TYPES.includes(toolType)) {
    v.stickout_length = true;
    v.exposed_length = true;
    if (DRILL_REAMER_TYPES.includes(toolType)) v.flutes = true;
  }
  if (toolType === "Tap") {
    v.thread_pitch = true;
    v.thread_form = true;
  }
  if (toolType === "Boring Bar") {
    v.min_bore_diameter = true;
    v.max_bore_diameter = true;
  }
  if (FACE_MILL_TYPES.includes(toolType)) {
    v.insert_count = true;
    v.insert_type = true;
  }
  if (toolType === "Slitting Saw") {
    v.blade_thickness = true;
    v.arbor_size = true;
  }

  return v;
}

// ── Effective visibility: defaults + per-tool overrides ─────────────────────────
export function getEffectiveVisibleFields(tool) {
  const defaults = getDefaultVisibleFields(tool.tool_type);
  const overrides = tool.visible_fields || {};
  return { ...defaults, ...overrides };
}