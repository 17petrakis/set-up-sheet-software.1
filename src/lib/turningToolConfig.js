// Type options for the dropdown
export const TURN_TYPE_OPTIONS = [
  { label: "Turning", value: "Turning" },
  { label: "Groove/Cutoff", value: "Groove/Cutoff" },
  { label: "Drill", value: "Drill" },
  { label: "Taps", value: "Taps" },
  { label: "Thread", value: "Thread" },
  { label: "Profile", value: "Profile" },
  { label: "Boring", value: "Boring" },
  { label: "Reaming", value: "Reaming" },
  { label: "Engraving", value: "Engraving" },
  { label: "Manual", value: "Manual" },
];

export const MILL_TYPE_OPTIONS = [
  { label: "Mill", value: "Mill" },
  { label: "Drill", value: "Drill" },
  { label: "Taps", value: "Taps" },
  { label: "Engraving", value: "Engraving" },
];

const RAD_OPTIONS = [".031", ".016", ".008", ".006", "0"];
const DEG_TURN_OPTIONS = ["100", "80", "55", "35"];
const WIDTH_OPTIONS = [".158 (4mm)", ".156 (5/32)", ".125 (1/8)", ".088", ".094 (3/32)", ".118 (3mm)", ".079 (2mm)", ".0625 (1/16)", ".059 (1.5mm)", ".047 (3/64)", ".031 (1/32)"];
const ANGLE_DRILL_OPTIONS = ["118", "135", "180"];

// Field definitions per type
export function getTypeFields(toolKind, typeValue) {
  const isMill = toolKind === "Mill";
  if (isMill) {
    switch (typeValue) {
      case "Mill": return [
        { key: "dia", label: "Dia.", type: "input" },
        { key: "rad", label: "Corner Rad", type: "select", options: RAD_OPTIONS },
      ];
      case "Drill": return [
        { key: "dia", label: "Dia.", type: "input" },
        { key: "angle", label: "Tip Angle", type: "select", options: ANGLE_DRILL_OPTIONS },
      ];
      case "Taps": return [
        { key: "dia", label: "Dia.", type: "input" },
        { key: "pitch", label: "Thread Lead", type: "input" },
      ];
      case "Engraving": return [
        { key: "dia", label: "Dia.", type: "input" },
        { key: "angle", label: "Tip Angle", type: "select", options: ANGLE_DRILL_OPTIONS },
      ];
      default: return [];
    }
  }
  switch (typeValue) {
    case "Turning": return [
      { key: "rad", label: "Corner Rad", type: "select", options: RAD_OPTIONS },
      { key: "deg", label: "Tip Angle", type: "select", options: DEG_TURN_OPTIONS },
    ];
    case "Groove/Cutoff": return [
      { key: "rad", label: "Corner Rad", type: "select", options: RAD_OPTIONS },
      { key: "width", label: "Tool Width", type: "select", options: WIDTH_OPTIONS },
    ];
    case "Drill": return [
      { key: "dia", label: "Dia.", type: "input" },
      { key: "angle", label: "Tip Angle", type: "select", options: ANGLE_DRILL_OPTIONS },
    ];
    case "Taps": return [
      { key: "dia", label: "Dia.", type: "input" },
      { key: "pitch", label: "Thread Lead", type: "input" },
    ];
    case "Thread": return [
      { key: "rad", label: "Rad", type: "select", options: RAD_OPTIONS },
      { key: "pitch", label: "Lead", type: "input" },
    ];
    case "Profile": return [
      { key: "rad", label: "Rad", type: "select", options: RAD_OPTIONS },
      { key: "reach", label: "Reach", type: "input" },
    ];
    case "Boring": return [
      { key: "dia", label: "Dia.", type: "input" },
      { key: "rad", label: "Corner Rad", type: "select", options: RAD_OPTIONS },
    ];
    case "Reaming": return [
      { key: "dia", label: "Dia.", type: "input" },
      { key: "angle", label: "Tip Angle", type: "select", options: ANGLE_DRILL_OPTIONS },
    ];
    case "Engraving": return [
      { key: "rad", label: "Corner Rad", type: "select", options: RAD_OPTIONS },
      { key: "deg", label: "Tip Angle", type: "select", options: DEG_TURN_OPTIONS },
    ];
    case "Manual": return [];
    default: return [];
  }
}

// Migrate old type values to new ones
const OLD_TO_NEW = {
  "Groove/Part": "Groove/Cutoff",
  "Drill – Carbide": "Drill",
  "Drill – HSS": "Drill",
  "Drill – Insert": "Drill",
  "Drill – Ex Tip": "Drill",
  "Drill – Center": "Drill",
  "Hole Making – Tap": "Taps",
  "Hole Making – Spot Drill": "Drill",
  "Hole Making – Countersink": "Drill",
  "Mill Endmill – SQ.": "Mill",
  "Mill Endmill – Radius": "Mill",
  "Mill Endmill – Ball": "Mill",
  "Mill Endmill – Chamfer": "Mill",
  "Mill – Chamfer Mills": "Mill",
  "Mill – Thread Mills": "Mill",
  "Mill – Lollipop": "Mill",
  "Mill – T-Slot": "Mill",
  "Mill – Engraving": "Engraving",
  "Mill Hole Making – Drill": "Drill",
  "Mill Hole Making – Spot Drill": "Drill",
  "Mill Hole Making – Countersink": "Drill",
  "Mill Hole Making – Tap": "Taps",
  "Mill Hole Making – Bore": "Mill",
};

const NEW_TYPES = ["Turning", "Groove/Cutoff", "Drill", "Taps", "Thread", "Profile", "Mill", "Boring", "Reaming", "Engraving", "Manual"];

export function migrateToolType(toolKind, oldType) {
  if (!oldType) return "";
  if (NEW_TYPES.includes(oldType)) return oldType;
  return OLD_TO_NEW[oldType] || (toolKind === "Mill" ? "Mill" : "Turning");
}

// Extra toggleable fields for the edit modal (matches screenshot)
export const EXTRA_FIELD_DEFS = [
  { key: "holder", label: "Holder", type: "select", options: ['ER25X1"', 'ER32X1"', 'ER16X3/4"', 'ER11X5/8"', "DA"] },
  { key: "direction", label: "Direction" },
  { key: "stickout", label: "Stickout (from holder)" },
  { key: "num_flutes", label: "#-Flt" },
  { key: "flute_length", label: "Flute length" },
  { key: "oal", label: "OAL" },
  { key: "reach", label: "Reach" },
  { key: "shank_dia", label: "Shank Dia." },
  { key: "neck_dia", label: "Neck Dia." },
  { key: "tip_dia", label: "Tip" },
  { key: "extension", label: "Extension", type: "select", options: ["ER11-ER25", "ER11-5/8x4", "ER25 + ER11-5/8x4", "ER25 + ER11-ER25", "Arbor", "5/8 Weldon"] },
  { key: "part_number_desc", label: "Part #/Desc." },
  { key: "insert", label: "Insert" },
  { key: "note", label: "Note" },
  { key: "coolant", label: "Coolant", type: "select", options: ["No Coolant", "From outside", "Thru collet", "Thru tool"] },
];

// Fields visible by default in the expanded section
export const DEFAULT_VISIBLE_EXTRA = ["holder", "insert", "stickout", "extension"];

// View mode formatting
export const FIELD_ABBREV = {
  dia: { abbrev: "DIA.", sep: " " },
  rad: { abbrev: "RAD.", sep: " " },
  width: { abbrev: "WIDTH.", sep: " " },
  deg: { abbrev: "DEG.", sep: "-" },
  angle: { abbrev: "DEG.", sep: "-" },
  pitch: { abbrev: "LEAD.", sep: " " },
  reach: { abbrev: "REACH.", sep: " " },
};

// Extra field labels for view mode
const EXTRA_LABELS = {
  holder: "Holder",
  direction: "Direction",
  stickout: "Stickout",
  num_flutes: "#-Flt",
  flute_length: "Flute length",
  oal: "OAL",
  reach: "Reach",
  shank_dia: "Shank Dia.",
  neck_dia: "Neck Dia.",
  tip_dia: "Tip",
  extension: "Extension",
  part_number_desc: "Part #/Desc.",
  insert: "Insert",
  note: "Note",
  coolant: "Coolant",
};

export function formatToolLine(tool) {
  const { tNum, shape, name } = formatToolParts(tool);
  return `${tNum}  ${shape}${name ? "  " + name : ""}`;
}

export function formatToolParts(tool) {
  const typeValue = migrateToolType(tool.tool_kind, tool.tool_type);
  const fields = getTypeFields(tool.tool_kind, typeValue);

  const tNum = tool.tool_number ? `T${String(tool.tool_number).padStart(2, "0")}` : "T--";
  const fieldValues = fields.map(f => ({
    key: f.key,
    label: f.label,
    value: tool[f.key] || "",
  }));

  const name = tool.name || tool.insert || "";

  return { tNum, fieldValues, name };
}

export function isExtraFieldVisible(tool, key) {
  const removed = tool._removed_fields || [];
  const added = tool._added_fields || [];
  if (removed.includes(key)) return false;
  if (added.includes(key)) return true;
  return DEFAULT_VISIBLE_EXTRA.includes(key);
}

export function formatToolExtraLine(tool) {
  const parts = [];
  EXTRA_FIELD_DEFS.forEach(f => {
    if (f.key === "direction") return;
    if (!isExtraFieldVisible(tool, f.key)) return;
    const val = tool[f.key];
    if (!val) return;
    if (f.key === "holder" || f.key === "insert") {
      parts.push(`${val} ${EXTRA_LABELS[f.key]}`);
    } else {
      parts.push(`${EXTRA_LABELS[f.key]}: ${val}`);
    }
  });
  return parts.join("   ");
}

export function toolHasData(tool) {
  return !!(tool.tool_number || tool.tool_type || tool.name || tool.insert || tool.holder || tool.stickout ||
    tool.dia || tool.rad || tool.width || tool.deg || tool.angle || tool.pitch || tool.reach ||
    tool.direction || tool.num_flutes || tool.flute_length || tool.oal || tool.shank_dia ||
    tool.neck_dia || tool.tip_dia || tool.extension || tool.part_number_desc || tool.note);
}

// Sort turning tools (within each turret) by T#
export function sortTurningToolsByTNumber(turningTools) {
  if (!turningTools?.turrets) return turningTools;
  return {
    ...turningTools,
    turrets: turningTools.turrets.map(t => ({
      ...t,
      tools: [...(t.tools || [])].sort((a, b) => {
        const aNum = parseInt(a.tool_number, 10);
        const bNum = parseInt(b.tool_number, 10);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return 1;
        if (isNaN(bNum)) return -1;
        return aNum - bNum;
      }),
    })),
  };
}