import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Setting keys (stored as JSON in the Setting entity)
export const SETTING_KEYS = {
  millingMachine: "dropdown_milling_machine",
  millingCad: "dropdown_milling_cad",
  millingVise: "dropdown_milling_vise",
  millingJaw: "dropdown_milling_jaw",
  latheMachine: "dropdown_lathe_machine",
  latheCad: "dropdown_lathe_cad",
  latheVise: "dropdown_lathe_vise",
  latheJaw: "dropdown_lathe_jaw",
  cmmPostSize: "dropdown_cmm_post_size",
  cmmEquipment: "dropdown_cmm_equipment",
  cmmMachine: "dropdown_cmm_machine",
};

// ── Defaults (extracted from the previously hardcoded option lists) ──
const DEFAULT_MILLING_MACHINES = [
  "Matsuura MX-520", "Matsuura MX-330", "Matsuura MAM72-35 V", "Matsuura H.Plus-405",
  "MORI SIEKI NH 4000 DCG", "HAAS DT1", "HAAS VF 4SS", "HAAS DM1", "OKUMA",
  "DMG Mori NH4000DCG", "DMG Mori RPS-NHX-4000", "Manual",
];

const DEFAULT_LATHE_MACHINES = [
  "MORI SIEKI NL 2000", "HAAS SL-10",
  "Doosan Puma 2100Y II", "Doosan Puma MX2100ST", "Doosan SMX2100",
  "DMG Mori RPS-NHX-4000", "Citizen L20",
  "Nakamura NTY3-150", "Nakamura WY-150", "Manual",
];

const DEFAULT_CAD = ["Mastercam", "Gibbscam", "Feature Cam", "G-Code", "Finger-Code", "N/A"];
const DEFAULT_VISE = ["Kurt Vise", "5th Axis Vise", "Lang Vise", "Other"];
const DEFAULT_MILLING_JAW = ["Hard Jaws", "Soft Jaws", "Step Jaws", "Tallon Grip", "Versa-Grip"];
const DEFAULT_LATHE_JAW = ["Hard Jaw", "Soft Jaw", "Mounted Fixture"];
const DEFAULT_CMM_POST_SIZE = ["1.5 in.", "1.75 in.", "2.75 in.", "3.5 in."];
const DEFAULT_CMM_MACHINE = ["Zeiss", "Hexagon"];

// CMM equipment: ordered list of { label, group }. Variant/size details are
// looked up from DEFAULT_EQUIPMENT_DETAILS so existing rich behavior is preserved.
const DEFAULT_CMM_EQUIPMENT = [
  { label: "Black Tower", group: "Fixturing" },
  { label: "Base Block", group: "Fixturing" },
  { label: "V-Block", group: "Fixturing" },
  { label: "Angle Block", group: "Fixturing" },
  { label: "Vice", group: "Fixturing" },
  { label: "Parallel Bars", group: "Gauges" },
  { label: "Gauge Block", group: "Gauges" },
  { label: "Gauge Pin", group: "Gauges" },
  { label: "Weight", group: "Other" },
  { label: "Flat Piece", group: "Other" },
  { label: "Double Sided Tape", group: "Other" },
];

export const DEFAULT_EQUIPMENT_DETAILS = {
  "Black Tower": { variants: [] },
  "Base Block": { variants: ["Large", "Small"] },
  "V-Block": { variants: ["X-Large", "Large", "Small"] },
  "Angle Block": { variants: ["Regular", "V-Angle"] },
  "Vice": { variants: ["Regular", "Finger", "Mini", "Max's"] },
  "Parallel Bars": { sizes: ["⅞"], sizeField: true },
  "Gauge Block": { sizes: ["0.900", "0.700", "0.950"], sizeField: true },
  "Gauge Pin": { sizes: [".1"], sizeField: true },
  "Weight": { variants: ["Round Bar"] },
  "Flat Piece": { variants: [] },
  "Double Sided Tape": { variants: [] },
};

const DEFAULTS = {
  [SETTING_KEYS.millingMachine]: DEFAULT_MILLING_MACHINES,
  [SETTING_KEYS.millingCad]: DEFAULT_CAD,
  [SETTING_KEYS.millingVise]: DEFAULT_VISE,
  [SETTING_KEYS.millingJaw]: DEFAULT_MILLING_JAW,
  [SETTING_KEYS.latheMachine]: DEFAULT_LATHE_MACHINES,
  [SETTING_KEYS.latheCad]: DEFAULT_CAD,
  [SETTING_KEYS.latheVise]: DEFAULT_VISE,
  [SETTING_KEYS.latheJaw]: DEFAULT_LATHE_JAW,
  [SETTING_KEYS.cmmPostSize]: DEFAULT_CMM_POST_SIZE,
  [SETTING_KEYS.cmmEquipment]: DEFAULT_CMM_EQUIPMENT,
  [SETTING_KEYS.cmmMachine]: DEFAULT_CMM_MACHINE,
};

// Module-level cache + in-flight promise
let cache = null;
let loadPromise = null;

export async function loadDropdownOptions(force = false) {
  if (cache && !force) return cache;
  if (loadPromise && !force) return loadPromise;
  loadPromise = (async () => {
    try {
      const rows = await base44.entities.Setting.list();
      const map = {};
      for (const row of rows || []) {
        if (row.key && row.key.startsWith("dropdown_")) {
          try { map[row.key] = JSON.parse(row.value); } catch { /* ignore */ }
        }
      }
      cache = { ...DEFAULTS, ...map };
      return cache;
    } catch (e) {
      cache = { ...DEFAULTS };
      return cache;
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

export async function saveDropdownOption(key, value) {
  const json = JSON.stringify(value);
  const existing = await base44.entities.Setting.filter({ key });
  if (existing && existing.length > 0) {
    await base44.entities.Setting.update(existing[0].id, { value: json });
  } else {
    await base44.entities.Setting.create({ key, value: json });
  }
  if (cache) cache = { ...cache, [key]: value };
  window.dispatchEvent(new CustomEvent("dropdown-options-changed", { detail: { key } }));
}

export function useDropdownOptions() {
  const [opts, setOpts] = useState(cache || DEFAULTS);
  useEffect(() => {
    let mounted = true;
    loadDropdownOptions().then(o => { if (mounted) setOpts(o); });
    const handler = () => loadDropdownOptions(true).then(o => { if (mounted) setOpts(o); });
    window.addEventListener("dropdown-options-changed", handler);
    return () => {
      mounted = false;
      window.removeEventListener("dropdown-options-changed", handler);
    };
  }, []);
  return opts;
}

// Build the full FIXTURING_OPTIONS-style structure from stored labels + default details.
export function buildEquipmentOptions(labels) {
  return (labels || []).map(item => {
    const label = typeof item === "string" ? item : item.label;
    const group = typeof item === "string" ? "Other" : (item.group || "Other");
    const details = DEFAULT_EQUIPMENT_DETAILS[label] || {};
    return { label, group, variants: details.variants || [], sizes: details.sizes || [], sizeField: !!details.sizeField };
  });
}