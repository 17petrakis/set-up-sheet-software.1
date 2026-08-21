import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// ── Inventory sections (the admin Inventory page groups items by these) ──
// `id` is the key consumers use (matches SETTING_KEYS values in dropdownOptions.js).
export const INVENTORY_SECTIONS = [
  { id: "machine_mill", label: "Milling Machines", category: "machine", machine_type: "mill", fields: ["tool_capacity"] },
  { id: "machine_lathe", label: "Lathe Machines", category: "machine", machine_type: "lathe", fields: ["tool_capacity"] },
  { id: "machine_cmm", label: "CMM Machines", category: "machine", machine_type: "cmm", fields: [] },
  { id: "cad", label: "CAD Software", category: "cad_software", fields: [] },
  { id: "vise", label: "Vises", category: "vise", fields: [] },
  { id: "jaw_mill", label: "Milling Jaws", category: "jaw", machine_type: "mill", fields: [] },
  { id: "jaw_lathe", label: "Lathe Jaws", category: "jaw", machine_type: "lathe", fields: [] },
  { id: "cmm_equipment", label: "CMM Fixturing & Gauges", category: "cmm_equipment", fields: ["subgroup", "variants", "has_size", "default_sizes"] },
  { id: "cmm_post_size", label: "CMM Post Sizes", category: "cmm_post_size", fields: [] },
  { id: "cutting_tool_mill", label: "Milling Cutting Tools", category: "cutting_tool", machine_type: "mill", fields: ["subgroup", "subgroup2"] },
  { id: "cutting_tool_lathe", label: "Lathe Cutting Tools", category: "cutting_tool", machine_type: "lathe", fields: ["subgroup"] },
  { id: "holder_mill", label: "Milling Holders", category: "holder", machine_type: "mill", fields: [] },
  { id: "holder_lathe", label: "Lathe Holders", category: "holder", machine_type: "lathe", fields: [] },
];

export function getSectionById(id) {
  return INVENTORY_SECTIONS.find(s => s.id === id);
}

// ── Default items (used until the admin seeds/manages a section) ──
export const DEFAULT_INVENTORY = {
  machine_mill: [
    "Matsuura MX-520", "Matsuura MX-330", "Matsuura MAM72-35 V", "Matsuura H.Plus-405",
    "MORI SIEKI NH 4000 DCG", "HAAS DT1", "HAAS VF 4SS", "HAAS DM1", "OKUMA",
    "DMG Mori NH4000DCG", "DMG Mori RPS-NHX-4000", "Manual",
  ],
  machine_lathe: [
    "MORI SIEKI NL 2000", "HAAS SL-10",
    "Doosan Puma 2100Y II", "Doosan Puma MX2100ST", "Doosan SMX2100",
    "DMG Mori RPS-NHX-4000", "Citizen L20",
    "Nakamura NTY3-150", "Nakamura WY-150", "Manual",
  ],
  machine_cmm: ["Zeiss", "Hexagon"],
  cad: ["Mastercam", "Gibbscam", "Feature Cam", "G-Code", "Finger-Code", "N/A"],
  vise: ["Kurt Vise", "5th Axis Vise", "Lang Vise", "Other"],
  jaw_mill: ["Hard Jaws", "Soft Jaws", "Step Jaws", "Tallon Grip", "Versa-Grip"],
  jaw_lathe: ["Hard Jaw", "Soft Jaw", "Mounted Fixture"],
  cmm_post_size: ["1.5 in.", "1.75 in.", "2.75 in.", "3.5 in."],
  cmm_equipment: [
    { label: "Black Tower", group: "Fixturing", variants: [] },
    { label: "Base Block", group: "Fixturing", variants: ["Large", "Small"] },
    { label: "V-Block", group: "Fixturing", variants: ["X-Large", "Large", "Small"] },
    { label: "Angle Block", group: "Fixturing", variants: ["Regular", "V-Angle"] },
    { label: "Vice", group: "Fixturing", variants: ["Regular", "Finger", "Mini", "Max's"] },
    { label: "Parallel Bars", group: "Gauges", has_size: true, default_sizes: ["⅞"] },
    { label: "Gauge Block", group: "Gauges", has_size: true, default_sizes: ["0.900", "0.700", "0.950"] },
    { label: "Gauge Pin", group: "Gauges", has_size: true, default_sizes: [".1"] },
    { label: "Weight", group: "Other", variants: ["Round Bar"] },
    { label: "Flat Piece", group: "Other", variants: [] },
    { label: "Double Sided Tape", group: "Other", variants: [] },
  ],
  cutting_tool_mill: [
    { label: "Square", group: "Endmill" },
    { label: "Corner Radius", group: "Endmill" },
    { label: "Ball", group: "Endmill" },
    { label: "BEM", group: "Endmill" },
    { label: "Tapered Endmill", group: "Endmill" },
    { label: "Lollipop", group: "Endmill" },
    { label: "T-Slot", group: "Endmill" },
    { label: "Chamfer Mill", group: "Endmill" },
    { label: "Thread Mill", group: "Endmill" },
    { label: "Engraving", group: "Endmill" },
    { label: "Woodruff/Keyseat", group: "Endmill" },
    { label: "Roughing/Corncob", group: "Endmill" },
    { label: "FEM", group: "Endmill" },
    { label: "REM", group: "Endmill" },
    { label: "Face Mill", group: "Face Mill" },
    { label: "Shell Mill", group: "Face Mill" },
    { label: "High-Feed Mill", group: "Face Mill" },
    { label: "Shoulder Mill", group: "Face Mill" },
    { label: "Center Drill", group: "Hole Making", group2: "Drill" },
    { label: "Spot Drill", group: "Hole Making", group2: "Drill" },
    { label: "HSS", group: "Hole Making", group2: "Drill" },
    { label: "Solid Carbide", group: "Hole Making", group2: "Drill" },
    { label: "Indexable", group: "Hole Making", group2: "Drill" },
    { label: "Spade", group: "Hole Making", group2: "Drill" },
    { label: "Countersink", group: "Hole Making" },
    { label: "Counterbore", group: "Hole Making" },
    { label: "Reamer", group: "Hole Making" },
    { label: "Boring Bar", group: "Hole Making" },
    { label: "Back Boring Bar", group: "Hole Making" },
    { label: "Rigid Tap", group: "Hole Making" },
    { label: "Dovetail Cutter", group: "Specialty" },
    { label: "Slitting Saw", group: "Specialty" },
    { label: "Form Tool", group: "Specialty" },
    { label: "Key Cutter", group: "Specialty" },
    { label: "Corner Rounding", group: "Specialty" },
  ],
  cutting_tool_lathe: [
    { label: "Turning", kind: "Turn" },
    { label: "Groove/Cutoff", kind: "Turn" },
    { label: "Drill", kind: "Turn" },
    { label: "Taps", kind: "Turn" },
    { label: "Thread", kind: "Turn" },
    { label: "Profile", kind: "Turn" },
    { label: "Boring", kind: "Turn" },
    { label: "Reaming", kind: "Turn" },
    { label: "Engraving", kind: "Turn" },
    { label: "Manual", kind: "Turn" },
    { label: "Mill", kind: "Mill" },
    { label: "Drill", kind: "Mill" },
    { label: "Taps", kind: "Mill" },
    { label: "Engraving", kind: "Mill" },
  ],
  holder_mill: ["ER11", "ER16", "ER20", "ER25", "ER32", "ER40", "Shrink Fit", "Hydraulic", "Weldon", "Milling Chuck", "Face Mill Arbour", "Slitting Saw Arbour", "Integral"],
  holder_lathe: ['ER25X1"', 'ER32X1"', 'ER16X3/4"', 'ER11X5/8"', "DA"],
};

// Build default records for a section (used by the "Seed from defaults" action).
export function defaultRecordsForSection(section) {
  const def = DEFAULT_INVENTORY[section.id] || [];
  return def.map(item => {
    const isObj = typeof item !== "string";
    const rec = {
      name: isObj ? item.label : item,
      category: section.category,
      status: "active",
    };
    if (section.machine_type) rec.machine_type = section.machine_type;
    if (section.id === "cmm_equipment") {
      rec.subgroup = (isObj && item.group) || "Other";
      rec.variants = (isObj && item.variants) || [];
      rec.has_size = !!(isObj && item.has_size);
      rec.default_sizes = (isObj && item.default_sizes) || [];
    }
    if (section.id === "cutting_tool_mill") {
      rec.subgroup = (isObj && item.group) || "Other";
      rec.subgroup2 = (isObj && item.group2) || "";
    }
    if (section.id === "cutting_tool_lathe") {
      rec.subgroup = (isObj && item.kind) || "Turn";
    }
    return rec;
  });
}

// ── Load all inventory records (cached, shared with dropdown hook) ──
let cache = null;
let loadPromise = null;

export async function loadInventory(force = false) {
  if (cache && !force) return cache;
  if (loadPromise && !force) return loadPromise;
  loadPromise = (async () => {
    try {
      const rows = await base44.entities.InventoryItem.list("-updated_date", 500);
      cache = rows || [];
      return cache;
    } catch (e) {
      cache = [];
      return cache;
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

export function useInventoryItems() {
  const [items, setItems] = useState(cache || []);
  useEffect(() => {
    let mounted = true;
    const apply = (rows) => { if (mounted) setItems(rows || []); };
    loadInventory().then(apply);
    const handler = () => loadInventory(true).then(apply);
    window.addEventListener("inventory-changed", handler);
    return () => {
      mounted = false;
      window.removeEventListener("inventory-changed", handler);
    };
  }, []);
  return items;
}

export function notifyInventoryChanged() {
  cache = null;
  window.dispatchEvent(new CustomEvent("inventory-changed"));
  window.dispatchEvent(new CustomEvent("dropdown-options-changed"));
}

// Resolve the option list for a section from loaded records (active only).
// Returns null when the section has no active records yet (signal to use defaults).
export function resolveSectionOptions(section, records) {
  const active = (records || []).filter(r =>
    r.category === section.category &&
    (!section.machine_type || r.machine_type === section.machine_type) &&
    r.status !== "disposed"
  );
  if (active.length === 0) return null;
  if (section.id === "cmm_equipment") {
    return active.map(r => ({
      label: r.name,
      group: r.subgroup || "Other",
      variants: r.variants || [],
      sizes: r.default_sizes || [],
      sizeField: !!r.has_size,
    }));
  }
  if (section.id === "cutting_tool_mill") {
    return active.map(r => ({ label: r.name, group: r.subgroup || "Other", group2: r.subgroup2 || "" }));
  }
  if (section.id === "cutting_tool_lathe") {
    return active.map(r => ({ label: r.name, subgroup: r.subgroup || "Turn" }));
  }
  return active.map(r => r.name);
}

// Default option list for a section (when no records are managed yet).
export function defaultOptionsForSection(section) {
  const def = DEFAULT_INVENTORY[section.id] || [];
  if (section.id === "cmm_equipment") {
    return def.map(item => ({
      label: item.label,
      group: item.group,
      variants: item.variants || [],
      sizes: item.default_sizes || [],
      sizeField: !!item.has_size,
    }));
  }
  return def;
}