import React from "react";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="text-xs min-w-0 break-words">
      <span className="font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{label}:</span>{" "}
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function SpindleView({ label, spindle }) {
  const s = spindle || {};
  const rows = [
    ["Chuck Type", s.chuck_type],
    ["Jaw Type", s.jaw_type],
    ["Chuck Pressure", s.chuck_pressure ? `${s.chuck_pressure} ${s.chuck_pressure_unit || "PSI"}` : ""],
    ["Initial Stickout", s.initial_stickout],
    ["Jaw Description", s.jaw_description],
    ["Fixture Description", s.fixture_description],
    ["Min Grip Length", s.min_grip_length],
    ["Spindle Accessories", s.accessories],
    ["Accessories Detail", s.accessories_extra],
    ["PCG Gripper Size", s.bf_pcg_gripper_size],
    ["Push Rod Ø", s.bf_push_rod],
    ["Part Library #", s.bf_part_library],
    ["Set Bar Ø To", s.bf_set_bar_dia],
    ["Total Part Feedout", s.bf_total_feedout],
    ["Top Cut Position", s.bf_top_cut_pos],
    ["End of Bar Signal", s.bf_end_bar_signal],
    ["Torque High Feed %", s.bf_torque_high_feed],
    ["Torque Feedout %", s.bf_torque_feedout],
    ["Concentricity", s.concentricity],
    ["Surface Finish", s.surface_finish],
    ["Parts Catcher", s.parts_catcher],
  ].filter(([, v]) => v);

  if (rows.length === 0 && !s.notes && !(s.photos?.length > 0)) return null;

  return (
    <div className="border border-gray-200 rounded p-2 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">{label}</p>
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
          {rows.map(([l, v]) => <InfoRow key={l} label={l} value={v} />)}
        </div>
      )}
      {s.notes && <p className="text-xs text-gray-800 whitespace-pre-wrap mt-1">{s.notes}</p>}
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
}

export function hasTurningChuckData(turningChuck) {
  const tc = turningChuck || {};
  const checkSpindle = (s) => s && Object.values(s).some(v =>
    v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
  );
  return (tc.wh_s1_active && checkSpindle(tc.wh_s1)) || (tc.wh_s2_active && checkSpindle(tc.wh_s2));
}

export default function TurningChuckView({ turningChuck }) {
  const tc = turningChuck || {};
  const s1 = tc.wh_s1_active ? tc.wh_s1 : null;
  const s2 = tc.wh_s2_active ? tc.wh_s2 : null;

  if (!s1 && !s2) return null;

  return (
    <div className="border border-gray-200 rounded p-3 bg-gray-50">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Chuck & Work Holding</p>
      <div className="space-y-3">
        {s1 && <SpindleView label="S1 Main" spindle={s1} />}
        {s2 && <SpindleView label="S2 Sub" spindle={s2} />}
      </div>
    </div>
  );
}