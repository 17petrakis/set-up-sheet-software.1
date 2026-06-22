import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, FileSpreadsheet } from "lucide-react";

function FieldRow({ label, value }) {
  return (
    <div className="flex border-b border-border/40 py-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-40 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value || "—"}</span>
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

      <div className="max-w-4xl mx-auto px-6 py-8 print-container">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight">CMM Setup Sheet</h1>
          <div className="border-b-2 border-black mt-2" />
        </div>

        {/* General Info */}
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">General Information</h2>
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <FieldRow label="Part #" value={sheet.part_number} />
              <FieldRow label="Customer" value={sheet.customer} />
              <FieldRow label="Description" value={sheet.description} />
              <FieldRow label="Machine" value={sheet.machine} />
            </div>
            <div>
              <FieldRow label="REV" value={sheet.material} />
              <FieldRow label="Cycle Time" value={sheet.cycle_time} />
              <FieldRow label="Units" value={sheet.units === "mm" ? "mm" : "in"} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 mt-2">
            <FieldRow label="Program #" value={sheet.program_number} />
            <FieldRow label="Program Location" value={sheet.program_location} />
          </div>
        </section>

        {/* Fixturing Equipment */}
        {fixturingItems.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">Fixturing Equipment</h2>
            <div className="flex flex-wrap gap-2">
              {fixturingItems.map((item, idx) => (
                <span key={idx} className="text-sm border border-border rounded px-2 py-1">
                  {item.custom_name || (item.variant ? `${item.type} – ${item.variant}` : item.type)}
                  {item.note ? ` – ${item.note}` : ""}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Work Placement */}
        {posts.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">
              Work Placement
              {posts.length === 3 &&
                posts.some(p => p.size === "Small" && String(p.x) === "18" && String(p.y) === "4") &&
                posts.some(p => p.size === "Small" && String(p.x) === "14" && String(p.y) === "6") &&
                posts.some(p => p.size === "Small" && String(p.x) === "14" && String(p.y) === "12") &&
                <span className="ml-2 text-xs font-medium text-primary normal-case tracking-normal">(Standard)</span>
              }
            </h2>
            <table className="text-sm w-full max-w-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left py-1 pr-4">#</th>
                  <th className="text-left py-1 pr-4">Post</th>
                  <th className="text-left py-1 pr-4">X</th>
                  <th className="text-left py-1">Y</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="py-1 pr-4">{idx + 1}</td>
                    <td className="py-1 pr-4">{post.size || "—"}</td>
                    <td className="py-1 pr-4">{post.x || "—"}</td>
                    <td className="py-1">{post.y || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Work Holding */}
        {workHolding.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">Work Holding</h2>
            <div className="space-y-4">
              {workHolding.map((wh, idx) => (
                <div key={idx} className="flex border border-border rounded overflow-hidden break-inside-avoid">
                  <div className="w-[30%] shrink-0 p-3 flex flex-col justify-center">
                    {idx === 0 ? (
                      <p className="text-sm font-semibold leading-snug">Final position on CMM table before running program</p>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{wh.note || "—"}</p>
                    )}
                  </div>
                  {wh.photo_url && (
                    <div className="flex-1 border-l border-border">
                      <img src={wh.photo_url} alt="" className="w-full object-contain" style={{ maxHeight: "400px" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Important Notes */}
        {importantNotes.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">Important Notes</h2>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              {importantNotes.map((note, idx) => (
                <li key={idx}>{typeof note === "object" ? note.note || JSON.stringify(note) : note}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Program Notes */}
        {sheet.program_notes && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">Program Notes</h2>
            <p className="text-sm whitespace-pre-wrap">{sheet.program_notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}