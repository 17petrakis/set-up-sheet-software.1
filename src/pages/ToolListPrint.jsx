import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

export default function ToolListPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.SetupSheet.get(id);
        setSheet(data);
      } catch (err) {
        console.error("Failed to load sheet:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sheet not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Print button - hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(`/sheet/${id}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Editor
        </button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>

      {/* Print content */}
      <div className="print-container max-w-4xl mx-auto p-8 print:p-0">
        {/* Header */}
        <div className="mb-8 pb-4 border-b-2 border-border">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tool List</h1>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Part Number</p>
              <p className="text-foreground font-semibold">{sheet.part_number || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Job Number</p>
              <p className="text-foreground font-semibold">{sheet.job_number || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Machine</p>
              <p className="text-foreground font-semibold">{sheet.machine || "N/A"}</p>
            </div>
          </div>
          {(sheet.customer || sheet.revision) && (
            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
              {sheet.customer && (
                <div>
                  <p className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Customer</p>
                  <p className="text-foreground font-semibold">{sheet.customer}</p>
                </div>
              )}
              {sheet.revision && (
                <div>
                  <p className="text-muted-foreground font-medium uppercase tracking-wider text-xs">Revision</p>
                  <p className="text-foreground font-semibold">{sheet.revision}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tool Table */}
        {sheet.tools && sheet.tools.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 px-3 font-bold text-foreground text-sm uppercase tracking-wider">Tool #</th>
                <th className="text-left py-3 px-3 font-bold text-foreground text-sm uppercase tracking-wider">Description</th>
                <th className="text-left py-3 px-3 font-bold text-foreground text-sm uppercase tracking-wider">Diameter</th>
                <th className="text-left py-3 px-3 font-bold text-foreground text-sm uppercase tracking-wider">Flutes</th>
                <th className="text-left py-3 px-3 font-bold text-foreground text-sm uppercase tracking-wider">Cut Length</th>
                <th className="text-left py-3 px-3 font-bold text-foreground text-sm uppercase tracking-wider">Holder</th>
              </tr>
            </thead>
            <tbody>
              {sheet.tools.map((tool, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="py-3 px-3 text-foreground font-medium">{tool.tool_number || "-"}</td>
                  <td className="py-3 px-3 text-foreground">{tool.description || "-"}</td>
                  <td className="py-3 px-3 text-foreground">{tool.diameter || "-"}</td>
                  <td className="py-3 px-3 text-foreground">{tool.flutes || "-"}</td>
                  <td className="py-3 px-3 text-foreground">{tool.cut_length || "-"}</td>
                  <td className="py-3 px-3 text-foreground">{tool.holder || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted-foreground text-center py-12">No tools defined</p>
        )}

        {/* Footer info */}
        <div className="mt-12 pt-4 border-t border-border text-xs text-muted-foreground">
          <p>Generated: {new Date().toLocaleDateString()}</p>
          {sheet.programmer && (
            <p>Programmer: {sheet.programmer}</p>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}