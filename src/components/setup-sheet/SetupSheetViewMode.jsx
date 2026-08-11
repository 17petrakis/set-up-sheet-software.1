import React from "react";
import { TOOL_FIELDS, TOOL_FIELD_SHORT, getEffectiveVisibleFields } from "@/lib/toolTypeOptions";
import { getMachineGroup } from "@/lib/machineGroups";
import { emptyGeneral, emptyPartZero } from "@/lib/setupSheetDefaults";
import TurningChuckView, { hasTurningChuckData } from "./TurningChuckView";
import TurningToolsView, { hasTurningToolsData } from "./TurningToolsView";
import { getProgramMode, getProgramLabel } from "@/lib/turningMachineConfig";
import ViewPhoto from "./ViewPhoto";

const DEFAULT_PHOTO_SLOTS = [
  { key: "work_holding", label: "Work Holding" },
  { key: "drawing", label: "Drawing" },
  { key: "iso", label: "ISO View" },
  { key: "material_stock", label: "Material Stock" },
  { key: "final_part", label: "Final Part 1" },
  { key: "final_part_2", label: "Final Part 2" },
];

const OP_COLS = ["OP #", "Operation Name", "Comment", "Tool #", "Min Z", "Type", "Feed", "Max RPM", "Cut Time", "Cycle Time"];
const OP_KEYS = ["op_number", "operation_name", "comment", "tool_number", "min_z", "type", "feed", "max_rpm", "cut_time", "cycle_time"];

function filterOpColumns(cols, keys, ops) {
  return keys.map((k, i) => ({ col: cols[i], key: k })).filter(({ key }) => ops.some(op => op[key] !== "" && op[key] !== null && op[key] !== undefined));
}

const TURNING_OP_COLS = ["N-Block", "OP #", "Operation Name", "Comment", "Tool #", "CS #", "Min Z", "Max Z"];
const TURNING_OP_KEYS = ["n_block", "op_number", "operation_name", "comment", "tool_number", "cs_number", "min_z", "max_z"];

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="text-xs min-w-0">
      <span className="font-semibold text-gray-500 uppercase tracking-wide">{label}:</span>{" "}
      <span className="text-gray-900 break-words">{value}</span>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="view-section-title">{children}</h2>;
}

export default function SetupSheetViewMode({ general, tools, turningTools, partZero: pz, operations, photos, fixturingNotes, turningChuck }) {
  const isTurning = general.machine_type === "turning";
  const millTools = tools?.length ? tools : [];
  const millToolColumns = millTools.length > 0 ? (() => {
    const alwaysCols = [{ key: "tool_number", label: "Tool #" }, { key: "tool_type", label: "Tool Type" }];
    const visibleKeys = new Set();
    millTools.forEach(t => {
      const vis = getEffectiveVisibleFields(t);
      TOOL_FIELDS.forEach(f => { if (vis[f.key] && t[f.key]) visibleKeys.add(f.key); });
    });
    const dynamicCols = TOOL_FIELDS.filter(f => visibleKeys.has(f.key)).map(f => ({ key: f.key, label: TOOL_FIELD_SHORT[f.key] }));
    const filteredAlways = alwaysCols.filter(c => millTools.some(t => t[c.key]));
    return [...filteredAlways, ...dynamicCols];
  })() : [];
  const tTools = turningTools || { turrets: [] };
  const tChuck = turningChuck || {};
  const partZero = pz && Object.keys(pz).length ? { ...emptyPartZero, ...pz } : emptyPartZero;
  const partZeroHasData = Object.entries(partZero).some(([k, v]) => {
    if (k === "part_zero_enabled") return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null) return Object.keys(v).length > 0;
    return v !== "" && v !== null && v !== undefined;
  });
  const ops = operations?.length ? operations : [];
  const opsHasData = ops.some(op => Object.values(op).some(v => v !== "" && v !== null && v !== undefined));
  const ph = photos || {};
  const extraSlots = ph.__extra_slots || [];
  const allPhotoSlots = [...DEFAULT_PHOTO_SLOTS, ...extraSlots].filter(({ key }) => ph[key]);

  const gen = { ...emptyGeneral, ...general };
  const fix = fixturingNotes || {};

  return (
    <div className="bg-white text-gray-900 font-body">
      <div className="max-w-[1100px] mx-auto px-2 sm:px-4 md:px-6 py-3 md:py-6 space-y-5">

        {/* General Information */}
        <section>
          <SectionTitle>General Information</SectionTitle>
          {(() => {
            const fields = [
              ["Customer", gen.customer],
              ["Rev", gen.revision],
              ["Part Name", gen.part_name],
              ["Machine", gen.machine],
              ["Machinist", gen.programmer],
              ["CAM", gen.program_software],
              ["Material", gen.material],
              ...(gen.material_color_enabled && gen.material_color ? [["Material Color", gen.material_color]] : []),
              ...(gen.material_condition_enabled && gen.material_condition ? [["Material Condition", gen.material_condition]] : []),
              ...(isTurning && gen.stock ? [["Stock", gen.stock]] : []),
              ...(isTurning && gen.consumed_per_part ? [["Length/1pc", gen.consumed_per_part]] : []),
              ["Qty", gen.quantity],
              ...(isTurning && getProgramMode(gen.machine) !== "single" && gen.program_numbers
    ? Object.entries(gen.program_numbers).filter(([_, v]) => v.active).map(([k, v]) => [getProgramLabel(k), v.number])
    : [["File Name", gen.program]]),
              ["Program Desc", gen.program_description],
              ...(gen.program_location ? [["Program Location", gen.program_location]] : []),
              ...(gen.cycle_time ? [["Cycle Time", gen.cycle_time]] : []),
              ...(gen.handling_time ? [["Handling Time", gen.handling_time]] : []),
              ...(gen.total_cycle_time ? [["Total Cycle", gen.total_cycle_time]] : []),
              ...(gen.automation ? [["Automated", gen.automation]] : []),
              ...(gen.date ? [["Date", gen.date]] : []),
            ].filter(([, v]) => v);
            if (fields.length === 0) return null;
            return (
              <div className="border border-gray-200 rounded p-3 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                  {fields.map(([label, val]) => (
                    <InfoRow key={label} label={label} value={val} />
                  ))}
                </div>
              </div>
            );
          })()}
          {(gen.stops || []).filter(Boolean).length > 0 && (
            <div className="mt-2 border border-gray-200 rounded p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Program Stops</p>
              <ul className="text-xs text-gray-800 space-y-0.5">
                {(gen.stops || []).filter(Boolean).map((s, i) => (
                  <li key={i}>#{i + 1}: {s}</li>
                ))}
              </ul>
            </div>
          )}
          {gen.has_deburring && (gen.deburring_time || gen.finishing_time || gen.wash_time || gen.deburring_notes || gen.finishing_notes || gen.wash_notes) && (
            <div className="mt-2 border border-gray-200 rounded p-3 bg-gray-50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Additional Handling</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-6 gap-y-1.5">
                <InfoRow label="Deburr Time" value={gen.deburring_time} />
                <InfoRow label="Finish Time" value={gen.finishing_time} />
                <InfoRow label="Wash Time" value={gen.wash_time} />
                <InfoRow label="Total Add'l" value={gen.total_additional_time} />
              </div>
              {(gen.deburring_notes || gen.finishing_notes || gen.wash_notes) && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {gen.deburring_notes && <div><span className="text-[10px] font-semibold uppercase text-gray-500">Deburring Notes:</span> <span className="text-xs text-gray-800">{gen.deburring_notes}</span></div>}
                  {gen.finishing_notes && <div><span className="text-[10px] font-semibold uppercase text-gray-500">Finishing Notes:</span> <span className="text-xs text-gray-800">{gen.finishing_notes}</span></div>}
                  {gen.wash_notes && <div><span className="text-[10px] font-semibold uppercase text-gray-500">Wash Notes:</span> <span className="text-xs text-gray-800">{gen.wash_notes}</span></div>}
                </div>
              )}
            </div>
          )}
          {gen.operation_description && (
            <div className="mt-2 border border-gray-200 rounded p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                {isTurning ? "Pre-machining Notes" : "Operation Description"}
              </p>
              <p className="text-xs text-gray-800 whitespace-pre-wrap">{gen.operation_description}</p>
            </div>
          )}
          {!isTurning && gen.work_holding_notes && (
            <div className="mt-2 border border-gray-200 rounded p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Work Holding Notes</p>
              <p className="text-xs text-gray-800 whitespace-pre-wrap">{gen.work_holding_notes}</p>
            </div>
          )}
          {!isTurning && fix && Object.keys(fix).length > 0 && (() => {
            const fGroup = getMachineGroup(gen.machine);
            if (!fGroup) return null;

            if (fGroup === "bandsaw") {
              const rows = [
                ["Stock Type", fix.stock_type],
                ["Stock Dimensions", fix.stock_dimensions],
                ["Cut Length", fix.cut_length],
                ["Quantity", fix.quantity],
                ["Blade TPI", fix.blade_tpi],
                ["Fence / Stop", fix.fence_stop_ref],
              ];
              const hasData = rows.some(([, v]) => v);
              if (!hasData && !fix.notes && !fix.photos?.length) return null;
              return (
                <div className="mt-2 border border-gray-200 rounded p-3 bg-gray-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Saw Setup</p>
                  {hasData && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                      {rows.filter(([, v]) => v).map(([l, v]) => <InfoRow key={l} label={l} value={v} />)}
                    </div>
                  )}
                  {fix.notes && <p className="text-xs text-gray-800 whitespace-pre-wrap mt-1">{fix.notes}</p>}
                  {fix.photos?.length > 0 && (
                    <div className="space-y-3 mt-1.5">
                      {fix.photos.map((p, pi) => (
                        <div key={pi}>
                          <ViewPhoto url={p.url} className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50" style={{ maxHeight: "500px" }} />
                          {p.note && <p className="text-[9px] text-gray-600 mt-0.5 italic">{p.note}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const stations = fix.stations || [];
            if (stations.length === 0) return null;

            const renderStationRows = (s, isHmc) => {
              const rows = [];
              if (isHmc) {
                rows.push(["Fixture Structure / Tombstone Note", s.fixture_structure_note || s.pallet_note], ["Workholding", s.workholding_type]);
                if (s.workholding_type === "Vise") {
                rows.push(["Vise Model", s.vise_model === "Other" ? (s.vise_model_other || "Other") : s.vise_model], ["Jaw Type", s.jaw_type], ["# Vises", s.num_vises], ["Parallels", s.parallels ? `Yes${s.parallel_height ? ` (${s.parallel_height})` : ""}` : "No"]);
                (s.additional_vises || []).forEach((v, vi) => {
                  rows.push(
                    [`Vise ${vi + 2} Model`, v.vise_model === "Other" ? (v.vise_model_other || "Other") : v.vise_model],
                    [`Vise ${vi + 2} Jaw Type`, v.jaw_type],
                    [`Vise ${vi + 2} Parallels`, v.parallels ? `Yes${v.parallel_height ? ` (${v.parallel_height})` : ""}` : "No"]
                  );
                });
                }
                if (s.workholding_type === "Custom Fixture Block") {
                rows.push(["Notes", s.fixture_note]);
                }
                if (s.workholding_type === "Collet Chuck") {
                rows.push(["Collet Size", s.collet_size], ["Part Stick-out", s.part_stickout]);
                }
                if (s.workholding_type === "Soft Jaw Pocket") {
                rows.push(["Notes", s.fixture_note]);
                }
              } else {
                rows.push(["Fixture Type", s.fixture_type]);
                if (s.fixture_type === "Vise") {
                  rows.push(["Vise Model", s.vise_model === "Other" ? (s.vise_model_other || "Other") : s.vise_model], ["Jaw Type", s.jaw_type], ["Parallels", s.parallels ? `Yes${s.parallel_height ? ` (${s.parallel_height})` : ""}` : "No"], ["# Vises", s.num_vises]);
                  (s.additional_vises || []).forEach((v, vi) => {
                    rows.push(
                      [`Vise ${vi + 2} Model`, v.vise_model === "Other" ? (v.vise_model_other || "Other") : v.vise_model],
                      [`Vise ${vi + 2} Jaw Type`, v.jaw_type],
                      [`Vise ${vi + 2} Parallels`, v.parallels ? `Yes${v.parallel_height ? ` (${v.parallel_height})` : ""}` : "No"]
                    );
                  });
                }
                if (s.fixture_type === "Fixture Plate") {
                  rows.push(["Notes", s.fixture_note]);
                }
                if (s.fixture_type === "Vacuum Plate") {
                  rows.push(["Notes", s.fixture_note]);
                }
                if (s.fixture_type === "Collet Chuck") {
                  rows.push(["Collet Size", s.collet_size], ["Part Stick-out", s.part_stickout]);
                }
                if (s.fixture_type === "Tallon Grip") {
                  rows.push(["Notes", s.fixture_note]);
                }
                if (s.fixture_type === "Soft Jaw Pocket") {
                  rows.push(["Notes", s.fixture_note]);
                }
              }
              if (s.work_stop) rows.push(["Work Stop", "Yes"]);
              if (s.workholding_note) rows.push(["Note", s.workholding_note]);
              return rows;
            };

            return (
              <>
                {stations.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded p-3 bg-gray-50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Fixturing Stations</p>
                    <div className="space-y-3">
                      {stations.map((s, i) => {
                        const rows = renderStationRows(s, fGroup === "hmc");
                        const header = `Station ${i + 1}`;
                        return (
                          <div key={i} className="border border-gray-200 rounded p-2 bg-white">
                            {fGroup === "hmc" && <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">{header}</p>}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                              {rows.filter(([, v]) => v).map(([l, v]) => <InfoRow key={l} label={l} value={v} />)}
                            </div>
                            {s.notes && <p className="text-xs text-gray-800 whitespace-pre-wrap mt-1">{s.notes}</p>}
                            {s.fixture_photo && (
                              <div className="mt-1.5">
                                <ViewPhoto url={s.fixture_photo} className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50" style={{ maxHeight: "500px" }} />
                                {s.fixture_photo_note && <p className="text-[9px] text-gray-600 mt-0.5 italic">{s.fixture_photo_note}</p>}
                              </div>
                            )}
                            {s.photos?.length > 0 && (
                              <div className="space-y-3 mt-1.5">
                                {s.photos.map((p, pi) => (
                                  <div key={pi}>
                                    <ViewPhoto url={p.url} className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50" style={{ maxHeight: "500px" }} />
                                    {p.note && <p className="text-[9px] text-gray-600 mt-0.5 italic">{p.note}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </section>

        {isTurning ? (
          <>
            {hasTurningChuckData(tChuck) && (
              <section>
                <SectionTitle>Chuck & Work Holding</SectionTitle>
                <TurningChuckView turningChuck={tChuck} />
              </section>
            )}

            {hasTurningToolsData(tTools) && (
              <section>
                <SectionTitle>Tools</SectionTitle>
                <TurningToolsView turningTools={tTools} tableClass="view-table" />
              </section>
            )}

            {partZeroHasData && (
              <section>
                <SectionTitle>Offsets</SectionTitle>
                <div className="border border-gray-200 rounded p-3 bg-gray-50 space-y-2">
                  {partZero.offsets?.length > 0 && (
                    <div className="space-y-2">
                      {partZero.offsets.map((offset, i) => (
                        <div key={i} className="border border-gray-200 rounded p-2 bg-white">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                            {i === 0 ? "Primary Offset" : `Stage ${i + 1}`}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                            <InfoRow label="Work Offset" value={offset.g_code} />
                            <InfoRow label="Z" value={offset.z} />
                            <InfoRow label="C" value={offset.c} />
                            <InfoRow label="Z Stock Amount" value={offset.dist_from_jaws} />
                            {i > 0 && <InfoRow label="Relative Pickoff" value={offset.relative_pickoff} />}
                          </div>
                          {offset.note && <p className="text-xs text-gray-800 whitespace-pre-wrap mt-1">{offset.note}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {partZero.part_zero_enabled && (
                    <table className="view-table w-full" style={{ maxWidth: "220px" }}>
                      <thead><tr><th>Axis</th><th>Max</th><th>Min</th></tr></thead>
                      <tbody>
                        {[
                          { axis: "X", max: partZero.x_max, min: partZero.x_min },
                          { axis: "Z", max: partZero.z_max, min: partZero.z_min },
                        ].map(({ axis, max, min }) => (
                          <tr key={axis}>
                            <td className="font-bold font-mono">{axis}</td>
                            <td className="font-mono">{max}</td>
                            <td className="font-mono">{min}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            )}

            {gen.operations_in_view && opsHasData && (() => {
              const filtered = filterOpColumns(TURNING_OP_COLS, TURNING_OP_KEYS, ops);
              return (
              <section>
                <SectionTitle>Operations</SectionTitle>
                <div className="overflow-x-auto">
                  <table className="view-table w-full">
                    <thead><tr>{filtered.map(({ col, key }) => <th key={key}>{col}</th>)}</tr></thead>
                    <tbody>
                      {ops.map((op, i) => (
                        <tr key={i}>{filtered.map(({ key }) => <td key={key}>{op[key]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              );
            })()}
          </>
        ) : (
          <>
            {millTools.length > 0 && (
              <section>
                <SectionTitle>Tool List</SectionTitle>
                <div className="overflow-x-auto">
                  <table className="view-table w-full">
                    <thead><tr>{millToolColumns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
                    <tbody>
                      {millTools.map((tool, i) => (
                        <tr key={i}>{millToolColumns.map(c => <td key={c.key}>{tool[c.key]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {partZeroHasData && (
              <section>
                <SectionTitle>Offsets</SectionTitle>
                <div className="border border-gray-200 rounded p-3 bg-gray-50 space-y-2">
                  {partZero.program_coord_zero_note && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Program Coordinate Zero Note</p>
                      <p className="text-xs text-gray-800 whitespace-pre-wrap">{partZero.program_coord_zero_note}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
                    <InfoRow label="Coordinate System" value={partZero.coordinate_system} />
                    <InfoRow label="Overall Depth Range" value={partZero.overall_depth_range} />
                    <InfoRow label="Work Coordinate System" value={partZero.work_coordinate_system} />
                  </div>
                </div>
              </section>
            )}

            {gen.operation_notes && (
              <section>
                <SectionTitle>Operation Notes</SectionTitle>
                <div className="border border-gray-200 rounded p-3">
                  <p className="text-xs text-gray-800 whitespace-pre-wrap">{gen.operation_notes}</p>
                </div>
              </section>
            )}

            {gen.operations_in_view && opsHasData && (() => {
              const filtered = filterOpColumns(OP_COLS, OP_KEYS, ops);
              return (
              <section>
                <SectionTitle>Operations</SectionTitle>
                <div className="overflow-x-auto">
                  <table className="view-table w-full">
                    <thead><tr>{filtered.map(({ col, key }) => <th key={key}>{col}</th>)}</tr></thead>
                    <tbody>
                      {ops.map((op, i) => (
                        <tr key={i}>{filtered.map(({ key }) => <td key={key}>{op[key]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              );
            })()}
          </>
        )}

        {isTurning && gen.operation_notes && (
          <section>
            <SectionTitle>Operation Notes</SectionTitle>
            <div className="border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-800 whitespace-pre-wrap">{gen.operation_notes}</p>
            </div>
          </section>
        )}

        {allPhotoSlots.length > 0 && (
          <section>
            <SectionTitle>Photos</SectionTitle>
            <div className="grid grid-cols-1 gap-8">
              {allPhotoSlots.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200 pb-1">{label}</p>
                  <ViewPhoto
                    url={ph[key]}
                    label={label}
                    className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50"
                    style={{ maxHeight: "600px" }}
                  />
                  {ph[`${key}__note`] && (
                    <p className="text-xs text-gray-600 italic">{ph[`${key}__note`]}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}