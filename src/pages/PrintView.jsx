import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation } from "@/lib/setupSheetDefaults";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOOL_FIELDS, TOOL_FIELD_SHORT, getEffectiveVisibleFields } from "@/lib/toolTypeOptions";
import { getMachineGroup } from "@/lib/machineGroups";
import TurningChuckView, { hasTurningChuckData } from "@/components/setup-sheet/TurningChuckView";
import TurningToolsView, { hasTurningToolsData } from "@/components/setup-sheet/TurningToolsView";
import { migratePhotoSlots } from "@/lib/photoSlots";

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
    <div className="text-xs min-w-0 break-words">
      <span className="font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{label}:</span>{" "}
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

export default function PrintView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!id) return;
    base44.entities.SetupSheet.get(id).then((sheet) => setData(sheet));
  }, [id]);

  if (!data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const general = { ...emptyGeneral, ...data };
  const isTurning = general.machine_type === "turning";
  const tools = data.tools?.length ? data.tools : [];
  const millToolColumns = tools.length > 0 ? (() => {
    const alwaysCols = [{ key: "tool_number", label: "Tool #" }, { key: "tool_type", label: "Tool Type" }];
    const visibleKeys = new Set();
    tools.forEach(t => {
      const vis = getEffectiveVisibleFields(t);
      TOOL_FIELDS.forEach(f => { if (vis[f.key] && t[f.key]) visibleKeys.add(f.key); });
    });
    const dynamicCols = TOOL_FIELDS.filter(f => visibleKeys.has(f.key)).map(f => ({ key: f.key, label: TOOL_FIELD_SHORT[f.key] }));
    const filteredAlways = alwaysCols.filter(c => tools.some(t => t[c.key]));
    return [...filteredAlways, ...dynamicCols];
  })() : [];
  const turningTools = data.turning_tools || { turrets: [] };
  const turningChuck = data.turning_chuck || {};
  const partZero = data.part_zero && Object.keys(data.part_zero).length ? { ...emptyPartZero, ...data.part_zero } : emptyPartZero;
  const partZeroHasData = Object.entries(partZero).some(([k, v]) => {
    if (k === "part_zero_enabled") return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null) return Object.keys(v).length > 0;
    return v !== "" && v !== null && v !== undefined;
  });
  const operations = data.operations?.length ? data.operations : [];
  const opsHasData = operations.some(op => Object.values(op).some(v => v !== "" && v !== null && v !== undefined));
  const photos = data.photos || {};
  const allPhotoSlots = migratePhotoSlots(photos);

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shadow-sm">
        <Button variant="outline" size="sm" onClick={() => navigate(`/sheet/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Editor
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
        <span className="text-sm text-gray-500 ml-2">Print-optimised layout — use landscape orientation for best results</span>
      </div>

      {/* Print content */}
      <div className="print-view bg-white text-gray-900 font-body" style={{ paddingTop: "64px" }}>
        <div className="max-w-[1100px] mx-auto px-6 py-6 space-y-5">

          {/* Title header */}
          <div className="flex items-start justify-between border-b-2 border-gray-800 pb-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {general.part_number || "CNC Setup Sheet"}
                {general.operation_name && (
                  <span className="text-gray-500 font-medium"> — {general.operation_name}</span>
                )}
              </h1>
              {general.customer && <p className="text-sm text-gray-600 mt-0.5">{general.customer}</p>}
            </div>
            <div className="text-right text-xs text-gray-500 space-y-0.5">
              {general.revision && <div><span className="font-semibold">Rev:</span> {general.revision}</div>}
              {general.date && <div><span className="font-semibold">Date:</span> {general.date}</div>}
              {general.programmer && <div><span className="font-semibold">Programmer:</span> {general.programmer}</div>}
            </div>
          </div>

          {/* General info grid */}
          <section>
            <h2 className="print-section-title">General Information</h2>
            {(() => {
              const fields = [
                ["Customer", general.customer],
                ["Rev", general.revision],
                ["Part Name", general.part_name],
                ["Machine", general.machine],
                ["Machinist", general.programmer],
                ["CAM", general.program_software],
                ["Material", general.material],
                ...(general.material_color_enabled && general.material_color ? [["Material Color", general.material_color]] : []),
                ...(general.material_condition_enabled && general.material_condition ? [["Material Condition", general.material_condition]] : []),
                ...(isTurning && general.stock ? [["Stock", general.stock]] : []),
                ...(isTurning && general.consumed_per_part ? [["Length/1pc", general.consumed_per_part]] : []),
                ["Qty", general.quantity],
                ["File Name", general.program],
                ["Program Desc", general.program_description],
                ...(general.program_location ? [["Program Location", general.program_location]] : []),
                ...(general.cycle_time ? [["Cycle Time", general.cycle_time]] : []),
                ...(general.handling_time ? [["Handling Time", general.handling_time]] : []),
                ...(general.total_cycle_time ? [["Total Cycle", general.total_cycle_time]] : []),
                ...(general.automation ? [["Automated", general.automation]] : []),
                ...(general.date ? [["Date", general.date]] : []),
              ].filter(([, v]) => v);
              const rows = [];
              for (let i = 0; i < fields.length; i += 2) {
                rows.push([fields[i], fields[i + 1] || ["", ""]]);
              }
              return (
              <div className="border border-gray-200 rounded p-3 bg-gray-50">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {rows.map(([left, right], i) => (
                      <tr key={i} className="border-b border-gray-200 last:border-b-0">
                        <td className="py-1.5 pr-2 font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap align-top w-[1%]">{left[0]}</td>
                        <td className="py-1.5 pr-6 text-gray-900 break-words align-top">{left[1]}</td>
                        <td className="py-1.5 pr-2 font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap align-top w-[1%]">{right[0]}</td>
                        <td className="py-1.5 text-gray-900 break-words align-top">{right[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              );
            })()}
            {(general.stops || []).filter(Boolean).length > 0 && (
              <div className="mt-2 border border-gray-200 rounded p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Program Stops</p>
                <ul className="text-xs text-gray-800 space-y-0.5">
                  {(general.stops || []).filter(Boolean).map((s, i) => (
                    <li key={i}>#{i + 1}: {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {general.has_deburring && (
              <div className="mt-2 border border-gray-200 rounded p-3 bg-gray-50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Additional Handling</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-6 gap-y-1.5">
                  <InfoRow label="Deburr Time" value={general.deburring_time} />
                  <InfoRow label="Finish Time" value={general.finishing_time} />
                  <InfoRow label="Wash Time" value={general.wash_time} />
                  <InfoRow label="Total Add'l" value={general.total_additional_time} />
                </div>
                {(general.deburring_notes || general.finishing_notes || general.wash_notes) && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {general.deburring_notes && <div><span className="text-[10px] font-semibold uppercase text-gray-500">Deburring Notes:</span> <span className="text-xs text-gray-800">{general.deburring_notes}</span></div>}
                    {general.finishing_notes && <div><span className="text-[10px] font-semibold uppercase text-gray-500">Finishing Notes:</span> <span className="text-xs text-gray-800">{general.finishing_notes}</span></div>}
                    {general.wash_notes && <div><span className="text-[10px] font-semibold uppercase text-gray-500">Wash Notes:</span> <span className="text-xs text-gray-800">{general.wash_notes}</span></div>}
                  </div>
                )}
              </div>
            )}
            {general.operation_description && (
              <div className="mt-2 border border-gray-200 rounded p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  {isTurning ? "Pre-machining Notes" : "Operation Description"}
                </p>
                <p className="text-xs text-gray-800 whitespace-pre-wrap">{general.operation_description}</p>
              </div>
            )}
            {!isTurning && general.work_holding_notes && (
              <div className="mt-2 border border-gray-200 rounded p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Work Holding Notes</p>
                <p className="text-xs text-gray-800 whitespace-pre-wrap">{general.work_holding_notes}</p>
              </div>
            )}
            {!isTurning && data.fixturing_notes && (() => {
              const fix = data.fixturing_notes;
              const fGroup = getMachineGroup(general.machine);
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
                            <img src={p.url} alt="" className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50" style={{ maxHeight: "500px" }} />
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
                              {s.fixture_photos?.length > 0 && (
                                <div className="space-y-3 mt-1.5">
                                  {s.fixture_photos.map((p, pi) => (
                                    <div key={pi}>
                                      <img src={p.url} alt="" className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50" style={{ maxHeight: "500px" }} />
                                      {p.note && <p className="text-[9px] text-gray-600 mt-0.5 italic">{p.note}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {s.photos?.length > 0 && (
                                <div className="space-y-3 mt-1.5">
                                  {s.photos.map((p, pi) => (
                                    <div key={pi}>
                                      <img src={p.url} alt="" className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50" style={{ maxHeight: "500px" }} />
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
              {/* Chuck & Work Holding */}
              {hasTurningChuckData(turningChuck) && (
                <section>
                  <h2 className="print-section-title">Chuck & Work Holding</h2>
                  <TurningChuckView turningChuck={turningChuck} />
                </section>
              )}

              {/* Tools */}
              {hasTurningToolsData(turningTools) && (
                <section>
                  <h2 className="print-section-title">Tools</h2>
                  <TurningToolsView turningTools={turningTools} tableClass="print-table" />
                </section>
              )}

              {/* Offsets */}
              {partZeroHasData && (
              <section>
                <h2 className="print-section-title">Offsets</h2>
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
                    <table className="print-table w-full" style={{ maxWidth: "220px" }}>
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

              {/* Turning Operations */}
              {general.operations_in_view && opsHasData && (() => {
                const filtered = filterOpColumns(TURNING_OP_COLS, TURNING_OP_KEYS, operations);
                return (
                <section>
                  <h2 className="print-section-title">Operations</h2>
                  <table className="print-table w-full">
                    <thead><tr>{filtered.map(({ col, key }) => <th key={key}>{col}</th>)}</tr></thead>
                    <tbody>
                      {operations.map((op, i) => (
                        <tr key={i}>{filtered.map(({ key }) => <td key={key}>{op[key]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </section>
                );
              })()}
            </>
          ) : (
            <>
              {/* Two-column: Tool List + Part Zero */}
              {/* Tool List */}
              {tools.length > 0 && (
                <section>
                  <h2 className="print-section-title">Tool List</h2>
                  <table className="print-table w-full">
                    <thead><tr>{millToolColumns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
                    <tbody>
                      {tools.map((tool, i) => (
                        <tr key={i}>{millToolColumns.map(c => <td key={c.key}>{tool[c.key]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* Offsets */}
              {partZeroHasData && (
              <section>
                <h2 className="print-section-title">Offsets</h2>
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

              {/* Operation Notes / Instruction */}
              {(general.operation_notes || (general.operation_media && general.operation_media.length > 0)) && (
                <section>
                  <h2 className="print-section-title">Operation Notes / Instruction</h2>
                  <div className="border border-gray-200 rounded p-3 space-y-3">
                    {general.operation_notes && <p className="text-xs text-gray-800 whitespace-pre-wrap">{general.operation_notes}</p>}
                    {general.operation_media?.map((m, i) => (
                      <div key={i}>
                        {m.title && <p className="text-[10px] font-semibold text-gray-700 mb-1">{m.title}</p>}
                        {m.type === "video" ? (
                          <video src={m.url} controls className="w-full rounded-lg border border-gray-200 bg-black" style={{ maxHeight: "420px" }} />
                        ) : (
                          <img src={m.url} alt={m.title || ""} className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50" style={{ maxHeight: "420px" }} />
                        )}
                        {m.note && <p className="text-xs text-gray-600 whitespace-pre-wrap mt-1">{m.note}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Operations */}
              {general.operations_in_view && opsHasData && (() => {
                const filtered = filterOpColumns(OP_COLS, OP_KEYS, operations);
                return (
                <section>
                  <h2 className="print-section-title">Operations</h2>
                  <table className="print-table w-full">
                    <thead><tr>{filtered.map(({ col, key }) => <th key={key}>{col}</th>)}</tr></thead>
                    <tbody>
                      {operations.map((op, i) => (
                        <tr key={i}>{filtered.map(({ key }) => <td key={key}>{op[key]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </section>
                );
              })()}
            </>
          )}

          {/* Operation Notes */}
          {isTurning && general.operation_notes && (
            <section>
              <h2 className="print-section-title">Operation Notes</h2>
              <div className="border border-gray-200 rounded p-3">
                <p className="text-xs text-gray-800 whitespace-pre-wrap">{general.operation_notes}</p>
              </div>
            </section>
          )}

          {/* Photos */}
          {allPhotoSlots.length > 0 && (
            <section>
              <h2 className="print-section-title">Photos</h2>
              <div className="grid grid-cols-1 gap-8">
                {allPhotoSlots.map((slot) => (
                  <div key={slot.id} className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200 pb-1">{slot.label}</p>
                    <img
                      src={slot.url}
                      alt={slot.label}
                      className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50"
                      style={{ maxHeight: slot.category === "work_holding" ? "500px" : "600px" }}
                    />
                    {slot.note && (
                      <p className="text-xs text-gray-600 italic">{slot.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-view { padding-top: 0 !important; }
          body { background: white !important; }
        }
        .print-section-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #374151;
          margin-bottom: 6px;
          padding-bottom: 3px;
          border-bottom: 1px solid #d1d5db;
        }
        .print-table {
          border-collapse: collapse;
          font-size: 11px;
        }
        .print-table th {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 4px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
        }
        .print-table td {
          border: 1px solid #e5e7eb;
          padding: 3px 8px;
          color: #111827;
        }
        .print-table tr:nth-child(even) td {
          background: #f9fafb;
        }
      `}</style>
    </>
  );
}