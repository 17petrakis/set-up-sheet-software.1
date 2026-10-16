/**
 * Shape validation for the tool / turret payloads the sync functions forward to
 * the external procedure app. That app trusts whatever it is sent, so each
 * payload is rebuilt here from the fields this app actually stores: unknown keys
 * and nested structures are dropped, every value is coerced to a bounded scalar,
 * and the finished payload is size-capped.
 */

const MAX_VALUE_CHARS = 200;
const MAX_FIELDS_PER_TOOL = 40;
const MAX_LIST_ITEMS = 40;
const MAX_TOOLS = 200;
const MAX_TURRETS = 20;
const MAX_PAYLOAD_CHARS = 100000;

// Scalar fields a tool slot can carry (milling and turning tools).
const TOOL_FIELDS = new Set([
  "tool_number", "tool_type", "tool_kind", "name", "diameter", "dia",
  "flutes", "num_flutes", "flute_length", "stickout", "stickout_length",
  "exposed_length", "cut_length", "oal", "holder", "angle", "rad", "deg",
  "width", "pitch", "thread_pitch", "thread_form", "reach", "insert",
  "insert_type", "insert_count", "direction", "shank_dia", "neck_dia",
  "tip_dia", "extension", "part_number_desc", "note", "comment", "coolant",
  "od_id", "min_bore_diameter", "max_bore_diameter", "blade_thickness",
  "arbor_size", "locked",
]);

const LIST_FIELDS = ["_added_fields", "_removed_fields"];

function scalar(value) {
  if (typeof value === "string") return value.slice(0, MAX_VALUE_CHARS);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  // Objects, arrays, null and undefined are never forwarded.
  return null;
}

function fieldList(value) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((entry) => typeof entry === "string" && TOOL_FIELDS.has(entry))
    .slice(0, MAX_LIST_ITEMS);
}

function visibilityMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const map = {};
  for (const key of Object.keys(value)) {
    if (Object.keys(map).length >= MAX_LIST_ITEMS) break;
    if (TOOL_FIELDS.has(key) && typeof value[key] === "boolean") map[key] = value[key];
  }
  return Object.keys(map).length ? map : null;
}

function sanitizeTool(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const clean = {};
  for (const key of Object.keys(raw)) {
    if (Object.keys(clean).length >= MAX_FIELDS_PER_TOOL) break;
    if (LIST_FIELDS.includes(key)) {
      const list = fieldList(raw[key]);
      if (list) clean[key] = list;
    } else if (key === "visible_fields") {
      const map = visibilityMap(raw[key]);
      if (map) clean[key] = map;
    } else if (TOOL_FIELDS.has(key)) {
      const value = scalar(raw[key]);
      if (value !== null) clean[key] = value;
    }
  }
  return clean;
}

function sanitizeTools(rawTools, max) {
  if (!Array.isArray(rawTools) || rawTools.length > max) {
    return { error: `tools must be an array of at most ${max} tools` };
  }
  const tools = [];
  for (const raw of rawTools) {
    const tool = sanitizeTool(raw);
    if (!tool) return { error: "every tool must be an object" };
    tools.push(tool);
  }
  if (JSON.stringify(tools).length > MAX_PAYLOAD_CHARS) return { error: "tool list is too large" };
  return { tools };
}

export function sanitizeToolList(rawTools) {
  return sanitizeTools(rawTools, MAX_TOOLS);
}

export function sanitizeTurretList(rawTurrets) {
  if (!Array.isArray(rawTurrets) || rawTurrets.length > MAX_TURRETS) {
    return { error: `turrets must be an array of at most ${MAX_TURRETS} turrets` };
  }
  const turrets = [];
  for (const raw of rawTurrets) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { error: "every turret must be an object" };
    }
    const turretType = scalar(raw.turret_type);
    if (typeof turretType !== "string" || !turretType.trim()) {
      return { error: "every turret needs a turret_type" };
    }
    const inner = sanitizeTools(raw.tools || [], MAX_TOOLS);
    if (inner.error) return inner;
    turrets.push({ turret_type: turretType.trim(), tools: inner.tools });
  }
  if (JSON.stringify(turrets).length > MAX_PAYLOAD_CHARS) return { error: "turret list is too large" };
  return { turrets };
}