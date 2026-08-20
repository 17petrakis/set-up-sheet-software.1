import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, FileSpreadsheet } from "lucide-react";

function FieldRow({ label, value }) {
  return (
    <div className="flex border-b border-gray-200 py-1.5">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || "—"}</span>
    </div>
  );
}

export default function CMMPrintView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.CMMSheet.get(id);
        setSheet(data);
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (sheet) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [sheet]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (!sheet) return null;

  const fixturingItems = sheet.fixturing || [];
  const posts = sheet.work_placement || [];
  const workHolding = (sheet.work_holding || []).filter(w => w.note || w.photo_url);
  const importantNotes = sheet.important_notes || [];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Print toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/cmm-sheet/${id}`)} className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-1.5 ml-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium">CMM Setup Sheet — {sheet.part_number}</span>
          </div>
          <Button size="sm" onClick={() => window.print()} className="gap-1.5 ml-auto text-xs">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10 print-container">
        {/* Title block */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-3">
            <h1 className="text-2xl font-bold tracking-tight">CMM Setup Sheet</h1>
            {sheet.part_number && (
              <span className="text-base font-mono font-semibold text-gray-700">{sheet.part_number}</span>
            )}
          </div>
          <div className="border-b-2 border-black" />
        </div>

        {/* General Info */}
        <section className="mb-7">
          <h2 className="view-section-title">General Information</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-0">
            <div>
              <FieldRow label="Part #" value={sheet.part_number} />
              <FieldRow label="Customer" value={sheet.customer} />
              <FieldRow label="Description" value={sheet.description} />
              <FieldRow label="Machine" value={sheet.machine} />
            </div>
            <div>
              <FieldRow label="Material" value={sheet.material} />
              <FieldRow label="Cycle Time" value={sheet.cycle_time} />
              <FieldRow label="Program Name" value={sheet.program_number} />
              <FieldRow label="Units" value={sheet.units === "mm" ? "mm" : "in"} />
            </div>
          </div>
        </section>

        {/* Fixturing Equipment */}
        {fixturingItems.length > 0 && (
          <section className="mb-7">
            <h2 className="view-section-title">Fixturing Equipment</h2>
            <div className="flex flex-wrap gap-2">
              {fixturingItems.map((item, idx) => (
                <span key={idx} className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50">
                  {item.custom_name || (item.variant ? `${item.type} – ${item.variant}` : item.type)}
                  {item.note ? ` – ${item.note}` : ""}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Work Placement */}
        {posts.length > 0 && (
          <section className="mb-7">
            <h2 className="view-section-title">
              Work Placement
              {posts.length === 3 &&
                posts.some(p => p.size === "Small" && String(p.x) === "18" && String(p.y) === "4") &&
                posts.some(p => p.size === "Small" && String(p.x) === "14" && String(p.y) === "6") &&
                posts.some(p => p.size === "Small" && String(p.x) === "14" && String(p.y) === "12") &&
                <span className="ml-2 text-xs font-medium text-gray-500 normal-case tracking-normal">(Standard)</span>
              }
            </h2>
            <table className="view-table w-full max-w-md">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Post</th>
                  <th>X</th>
                  <th>Y</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{post.size || "—"}</td>
                    <td>{post.x || "—"}</td>
                    <td>{post.y || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Work Holding */}
        {workHolding.length > 0 && (
          <section className="mb-7">
            <h2 className="view-section-title">Work Holding</h2>
            <div className="space-y-3">
              {workHolding.map((wh, idx) => (
                <div key={idx} className="border border-gray-300 rounded-md overflow-hidden break-inside-avoid">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    {idx === 0 ? (
                      <p className="text-sm font-semibold leading-snug">Final position on CMM table before running program</p>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{wh.note || "—"}</p>
                    )}
                  </div>
                  {wh.photo_url && (
                    <div className="border-t border-gray-200">
                      <img src={wh.photo_url} alt="" className="w-full object-contain" style={{ maxHeight: "380px" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Important Notes */}
        {importantNotes.length > 0 && (
          <section className="mb-7">
            <h2 className="view-section-title">Important Notes</h2>
            <ol className="text-sm space-y-1.5">
              {importantNotes.map((note, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="font-semibold text-gray-500 shrink-0">{idx + 1}.</span>
                  <span className="whitespace-pre-wrap">{typeof note === "object" ? note.text || note.note || "" : note}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Program Notes */}
        {sheet.program_notes && (
          <section className="mb-7">
            <h2 className="view-section-title">Program Notes</h2>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{sheet.program_notes}</p>
          </section>
        )}

        {/* General Notes */}
        {sheet.general_notes && (
          <section className="mb-7">
            <h2 className="view-section-title">General Notes</h2>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{sheet.general_notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}