// Type options for the dropdown
export const TURN_TYPE_OPTIONS = [
  { label: "Turning", value: "Turning" },
  { label: "Groove/Cutoff", value: "Groove/Cutoff" },
  { label: "Drill", value: "Drill" },
  { label: "Taps", value: "Taps" },
  { label: "Thread", value: "Thread" },
  { label: "Profile", value: "Profile" },
];

export const MILL_TYPE_OPTIONS = [
  { label: "Mill", value: "Mill" },
  { label: "Drill", value: "Drill" },
  { label: "Taps", value: "Taps" },
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
        { key: "dia", label: "Tool Dia.", type: "input" },
        { key: "rad", label: "Corner Rad", type: "select", options: RAD_OPTIONS },
      ];
      case "Drill": return [
        { key: "dia", label: "Tool Dia.", type: "input" },
        { key: "angle", label: "Tip Angle", type: "select", options: ANGLE_DRILL_OPTIONS },
      ];
      case "Taps": return [
        { key: "dia", label: "Tool Dia.", type: "input" },
        { key: "pitch", label: "Thread Lead", type: "input" },
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
      { key: "dia", label: "Tool Dia.", type: "input" },
      { key: "angle", label: "Tip Angle", type: "select", options: ANGLE_DRILL_OPTIONS },
    ];
    case "Taps": return [
      { key: "dia", label: "Tool Dia.", type: "input" },
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
  "Mill – Engraving": "Mill",
  "Mill Hole Making – Drill": "Drill",
  "Mill Hole Making – Spot Drill": "Drill",
  "Mill Hole Making – Countersink": "Drill",
  "Mill Hole Making – Tap": "Taps",
  "Mill Hole Making – Bore": "Mill",
};

const NEW_TYPES = ["Turning", "Groove/Cutoff", "Drill", "Taps", "Thread", "Profile", "Mill"];

export function migrateToolType(toolKind, oldType) {
  if (!oldType) return "";
  if (NEW_TYPES.includes(oldType)) return oldType;
  return OLD_TO_NEW[oldType] || (toolKind === "Mill" ? "Mill" : "Turning");
}

// View mode formatting
const FIELD_ABBREV = {
  dia: { abbrev: "DIA.", sep: " " },
  rad: { abbrev: "RAD.", sep: " " },
  width: { abbrev: "WIDTH.", sep: " " },
  deg: { abbrev: "DEG.", sep: "-" },
  angle: { abbrev: "DEG.", sep: "-" },
  pitch: { abbrev: "LEAD.", sep: " " },
  reach: { abbrev: "REACH.", sep: " " },
};

export function formatToolLine(tool) {
  const typeValue = migrateToolType(tool.tool_kind, tool.tool_type);
  const fields = getTypeFields(tool.tool_kind, typeValue);
  const kindLabel = tool.tool_kind === "Mill" ? "mill" : "turn";

  const tNum = tool.tool_number ? `T${String(tool.tool_number).padStart(2, "0")}` : "T--";
  const parts = [];

  fields.forEach(f => {
    const val = tool[f.key];
    if (val) {
      const abbrev = FIELD_ABBREV[f.key];
      if (abbrev) {
        parts.push(`${val}${abbrev.sep}${abbrev.abbrev}`);
      } else {
        parts.push(val);
      }
    }
  });

  const name = tool.name || tool.insert || "";
  if (name) parts.push(name);
  parts.push(`[${kindLabel}]`);

  return `${tNum}: ${parts.join(" ")}`;
}

export function formatToolExtraLine(tool) {
  const parts = [];
  if (tool.holder) parts.push(`Holder: ${tool.holder}`);
  if (tool.insert) parts.push(`Insert: ${tool.insert}`);
  if (tool.stickout) parts.push(`Stickout: ${tool.stickout}`);
  return parts.join(" | ");
}

export function toolHasData(tool) {
  return !!(tool.tool_number || tool.tool_type || tool.name || tool.insert || tool.holder || tool.stickout ||
    tool.dia || tool.rad || tool.width || tool.deg || tool.angle || tool.pitch || tool.reach);
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