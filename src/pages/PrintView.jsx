import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation } from "@/lib/setupSheetDefaults";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_PHOTO_SLOTS = [
  { key: "work_holding", label: "Work Holding" },
  { key: "drawing", label: "Drawing" },
  { key: "iso", label: "ISO View" },
  { key: "material_stock", label: "Material Stock" },
  { key: "final_part", label: "Final Part 1" },
  { key: "final_part_2", label: "Final Part 2" },
];

const TOOL_COLS = ["Tool #", "Description", "Diameter", "Flutes", "Exp. Length", "Cut Length", "Holder"];
const TOOL_KEYS = ["tool_number", "description", "diameter", "flutes", "exposed_length", "cut_length", "holder"];

const OP_COLS = ["OP #", "Operation Name", "Comment", "Tool #", "Min Z", "Max Z", "Cycle Time", "Spindle RPM"];
const OP_KEYS = ["op_number", "operation_name", "comment", "tool_number", "min_z", "max_z", "cycle_time", "spindle_rpm"];

const AXIAL_COLS = ["T#", "Description", "Type", "Dia / Radius", "Angle", "Holder", "Stickout"];
const AXIAL_KEYS = ["tool_number", "description", "type", "diameter_radius", "angle", "holder", "stickout"];

const RADIAL_COLS = ["T#", "Description", "Type", "Dia / Radius", "Angle / Insert", "Holder", "Stickout", "Extension"];
const RADIAL_KEYS = ["tool_number", "description", "type", "diameter_radius", "angle_insert", "holder", "stickout", "extension"];

const TURNING_OP_COLS = ["N-Block", "OP #", "Operation Name", "Comment", "Tool #", "CS #", "Min Z", "Max Z"];
const TURNING_OP_KEYS = ["n_block", "op_number", "operation_name", "comment", "tool_number", "cs_number", "min_z", "max_z"];

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-1 text-xs">
      <span className="font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{label}:</span>
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
  const turningTools = data.turning_tools || { axial: [], radial: [] };
  const turningChuck = data.turning_chuck || {};
  const partZero = data.part_zero && Object.keys(data.part_zero).length ? { ...emptyPartZero, ...data.part_zero } : emptyPartZero;
  const operations = data.operations?.length ? data.operations : [];
  const photos = data.photos || {};
  const extraSlots = photos.__extra_slots || [];
  const allPhotoSlots = [...DEFAULT_PHOTO_SLOTS, ...extraSlots].filter(({ key }) => photos[key]);

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
              <h1 className="text-2xl font-bold tracking-tight">{general.part_number || "CNC Setup Sheet"}</h1>
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-6 gap-y-1.5 border border-gray-200 rounded p-3 bg-gray-50">
              <InfoRow label="Machine" value={general.machine} />
              <InfoRow label="Job #" value={general.job_number} />
              <InfoRow label="Program" value={general.program} />
              <InfoRow label="Quantity" value={general.quantity} />
              <InfoRow label="Material" value={general.material} />
              <InfoRow label="Pre Machine Size" value={general.pre_machine_size} />
              <InfoRow label="Units" value={general.units} />
              <InfoRow label="Cycle Time" value={general.total_cycle_time} />
            </div>
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
          </section>

          {isTurning ? (
            <>
              {/* Chuck & Work Holding */}
              {(turningChuck.jaw_description || turningChuck.chuck_type || turningChuck.chuck_pressure_psi || turningChuck.fixturing_notes) && (
                <section>
                  <h2 className="print-section-title">Chuck & Work Holding</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-6 gap-y-1.5 border border-gray-200 rounded p-3 bg-gray-50">
                    <InfoRow label="Jaw Description" value={turningChuck.jaw_description} />
                    <InfoRow label="Chuck Type" value={turningChuck.chuck_type} />
                    <InfoRow label="Chuck PSI" value={turningChuck.chuck_pressure_psi} />
                    <InfoRow label="Coolant PSI" value={turningChuck.coolant_pressure_psi} />
                    <InfoRow label="Concentricity" value={turningChuck.concentricity_requirement} />
                  </div>
                  {turningChuck.fixturing_notes && (
                    <div className="mt-2 border border-gray-200 rounded p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Fixturing Notes</p>
                      <p className="text-xs text-gray-800 whitespace-pre-wrap">{turningChuck.fixturing_notes}</p>
                    </div>
                  )}
                </section>
              )}

              {/* Axial Tools */}
              {turningTools.axial?.length > 0 && (
                <section>
                  <h2 className="print-section-title">Axial Tools</h2>
                  <table className="print-table w-full">
                    <thead><tr>{AXIAL_COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {turningTools.axial.map((tool, i) => (
                        <tr key={i}>{AXIAL_KEYS.map((k) => <td key={k}>{tool[k]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* Radial Tools */}
              {turningTools.radial?.length > 0 && (
                <section>
                  <h2 className="print-section-title">Radial Tools</h2>
                  <table className="print-table w-full">
                    <thead><tr>{RADIAL_COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {turningTools.radial.map((tool, i) => (
                        <tr key={i}>{RADIAL_KEYS.map((k) => <td key={k}>{tool[k]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* Part Zero */}
              <section>
                <h2 className="print-section-title">Part Zero</h2>
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
              </section>

              {/* Turning Operations */}
              {operations.length > 0 && (
                <section>
                  <h2 className="print-section-title">Operations</h2>
                  <table className="print-table w-full">
                    <thead><tr>{TURNING_OP_COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {operations.map((op, i) => (
                        <tr key={i}>{TURNING_OP_KEYS.map((k) => <td key={k}>{op[k]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          ) : (
            <>
              {/* Two-column: Tool List + Part Zero */}
              <div className="grid grid-cols-[1fr_180px] gap-4">
                {/* Tool List */}
                {tools.length > 0 && (
                  <section>
                    <h2 className="print-section-title">Tool List</h2>
                    <table className="print-table w-full">
                      <thead><tr>{TOOL_COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                      <tbody>
                        {tools.map((tool, i) => (
                          <tr key={i}>{TOOL_KEYS.map((k) => <td key={k}>{tool[k]}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                {/* Part Zero */}
                <section>
                  <h2 className="print-section-title">Part Zero</h2>
                  <table className="print-table w-full">
                    <thead><tr><th>Axis</th><th>Max</th><th>Min</th></tr></thead>
                    <tbody>
                      {[
                        { axis: "X", max: partZero.x_max, min: partZero.x_min },
                        { axis: "Y", max: partZero.y_max, min: partZero.y_min },
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
                </section>
              </div>

              {/* Operations */}
              {operations.length > 0 && (
                <section>
                  <h2 className="print-section-title">Operations</h2>
                  <table className="print-table w-full">
                    <thead><tr>{OP_COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {operations.map((op, i) => (
                        <tr key={i}>{OP_KEYS.map((k) => <td key={k}>{op[k]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          )}

          {/* Operation Notes */}
          {general.operation_notes && (
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
                {allPhotoSlots.map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200 pb-1">{label}</p>
                    <img
                      src={photos[key]}
                      alt={label}
                      className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50"
                      style={{ maxHeight: "600px" }}
                    />
                    {photos[`${key}__note`] && (
                      <p className="text-xs text-gray-600 italic">{photos[`${key}__note`]}</p>
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