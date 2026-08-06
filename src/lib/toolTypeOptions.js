// ── Grouped tool type options for the cascading dropdown ──────────────────────
export const TOOL_TYPE_OPTIONS = [
  {
    label: "Endmill", children: [
      { label: "Square", value: "Square" },
      { label: "Corner Radius", value: "Corner Radius" },
      { label: "Ball", value: "Ball" },
      { label: "BEM", value: "BEM" },
      { label: "Lollipop", value: "Lollipop" },
      { label: "T-Slot", value: "T-Slot" },
      { label: "Chamfer Mill", value: "Chamfer Mill" },
      { label: "Thread Mill", value: "Thread Mill" },
      { label: "Engraving", value: "Engraving" },
      { label: "Woodruff/Keyseat", value: "Woodruff/Keyseat" },
      { label: "Roughing/Corncob", value: "Roughing/Corncob" },
      { label: "FEM", value: "FEM" },
      { label: "REM", value: "REM" },
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
      { label: "Rigid Tap", value: "Rigid Tap" },
    ]
  },
  {
    label: "Specialty", children: [
      { label: "Dovetail Cutter", value: "Dovetail Cutter" },
      { label: "Slitting Saw", value: "Slitting Saw" },
      { label: "Form Tool", value: "Form Tool" },
      { label: "Key Cutter", value: "Key Cutter" },
    ]
  },
];

// ── Toggleable field definitions (tool_number & tool_type are always visible) ─
export const TOOL_FIELDS = [
  { key: "tool_type", label: "Tool Type" },
  { key: "diameter", label: "Diameter" },
  { key: "flutes", label: "Flutes" },
  { key: "flute_length", label: "Flute Length" },
  { key: "stickout_length", label: "Stickout Length" },
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
  { key: "angle", label: "Tip Angle" },
  { key: "name", label: "Tool Comment" },
];

// Short labels for compact row display
export const TOOL_FIELD_SHORT = {
  tool_type: "Type",
  name: "Comment",
  diameter: "Dia",
  flutes: "Flutes",
  flute_length: "Flute Len",
  stickout_length: "Stickout",
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
  angle: "Tip Ang",
};

// ── Type groupings for visibility logic ────────────────────────────────────────
const ENDMILL_TYPES = [
  "Square", "Corner Radius", "Ball", "BEM", "Lollipop", "T-Slot",
  "Chamfer Mill", "Thread Mill", "Engraving", "Woodruff/Keyseat", "Roughing/Corncob",
  "FEM", "REM",
];
const HOLE_MAKING_TYPES = [
  "Center Drill", "Spot Drill", "Drill", "Countersink", "Counterbore",
  "Reamer", "Boring Bar", "Back Boring Bar", "Rigid Tap",
];
const DRILL_REAMER_TYPES = [
  "Center Drill", "Spot Drill", "Drill", "Countersink", "Counterbore", "Reamer",
];
const FACE_MILL_TYPES = ["Face Mill", "Shell Mill"];

// ── Default visible fields based on tool_type ─────────────────────────────────
export function getDefaultVisibleFields(toolType) {
  const v = {};
  for (const f of TOOL_FIELDS) v[f.key] = false;

  // All tools show type + diameter + holder + name
  v.tool_type = true;
  v.diameter = true;
  v.holder = true;
  v.name = true;

  if (ENDMILL_TYPES.includes(toolType)) {
    v.flutes = true;
    v.stickout_length = true;
  }
  if (HOLE_MAKING_TYPES.includes(toolType)) {
    v.stickout_length = true;
    if (DRILL_REAMER_TYPES.includes(toolType)) v.flutes = true;
  }
  if (toolType === "Rigid Tap") {
    v.thread_pitch = true;
    v.thread_form = true;
  }
  if (toolType === "Chamfer Mill" || toolType === "Countersink") {
    v.angle = true;
  }
  if (toolType === "Boring Bar") {
    v.min_bore_diameter = true;
    v.max_bore_diameter = true;
  }
  if (FACE_MILL_TYPES.includes(toolType)) {
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

// ── Field-specific dropdown options (returns null when no chips apply) ──────────
export function getFieldOptions(fieldKey, toolType) {
  if (fieldKey === "holder") {
    return ["ER16", "ER20", "ER25", "ER32", "ER40", "Shrink Fit", "Hydraulic", "Weldon", "Milling Chuck"];
  }
  if (fieldKey === "flutes" && ENDMILL_TYPES.includes(toolType)) {
    return ["2", "3", "4", "5", "6"];
  }
  if (fieldKey === "diameter" && (ENDMILL_TYPES.includes(toolType) || FACE_MILL_TYPES.includes(toolType))) {
    return [
      "1/8", "3/16", "1/4", "5/16", "3/8", "1/2", "5/8", "3/4", "1\"",
      "3mm", "4mm", "6mm", "8mm", "10mm", "12mm", "16mm", "20mm"
    ];
  }
  if (fieldKey === "angle" && (toolType === "Chamfer Mill" || toolType === "Countersink")) {
    return ["60°", "82°", "90°", "100°", "120°"];
  }
  if (fieldKey === "thread_pitch" && toolType === "Rigid Tap") {
    return [
      "#4-40", "#6-32", "#8-32", "#10-24", "#10-32", "1/4-20", "1/4-28", "5/16-18", "3/8-16", "1/2-13",
      "M3x0.5", "M4x0.7", "M5x0.8", "M6x1.0", "M8x1.25", "M10x1.5", "M12x1.75"
    ];
  }
  return null;
}