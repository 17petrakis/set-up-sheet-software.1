import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileSpreadsheet, Settings2, Printer, Plus } from "lucide-react";
import { motion } from "framer-motion";
import FixturingSection from "@/components/cmm/FixturingSection";
import WorkPlacementSection from "@/components/cmm/WorkPlacementSection";
import CMMWorkHolding from "@/components/cmm/CMMWorkHolding";
import CMMNotesSection from "@/components/cmm/CMMNotesSection";
import CMMPrintView from "@/pages/CMMPrintView";
import TimeInput from "@/components/ui/TimeInput";
import AddCMMOperationDialog from "@/components/cmm/AddCMMOperationDialog";

function FieldGroup({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function CMMSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showAddOp, setShowAddOp] = useState(false);
  const saveTimer = useRef(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.CMMSheet.get(id);
        if (!data.work_holding || data.work_holding.length === 0) {
          data.work_holding = [{ _id: "first", note: "", photo_url: "" }];
        }
        setSheet(data);
        setLoading(false);
      } catch {
        navigate("/");
      }
    })();
  }, [id]);

  const update = (field, value) => {
    setSheet(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!sheet) return;
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await base44.entities.CMMSheet.update(id, sheet);
      setSaving(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2000);
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [sheet]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={() => navigate("/?tab=quality_control")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold tracking-tight text-foreground leading-none">
              {sheet.part_number}{sheet.description ? ` — ${sheet.description}` : " — CMM Setup Sheet"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {saveStatus === "saved" ? "Saved ✓" : saving ? "Saving…" : sheet.customer || "Quality Control"}
            </p>
          </div>
          {sheet.folder_id && (
            <Button variant="outline" size="sm" onClick={() => setShowAddOp(true)} className="ml-auto gap-1.5 text-xs no-print">
              <Plus className="w-4 h-4" /> Add Operation
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(`/cmm-sheet/${id}/print`)} className="gap-1.5 text-xs no-print">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-3 md:py-6 space-y-5">
        {/* General Information */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2 mb-1">
              <Settings2 className="w-4 h-4 text-primary" />
              General Information
            </h2>
            <div className="border-b border-border mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FieldGroup label="Customer">
                <Input value={sheet.customer || ""} onChange={e => update("customer", e.target.value)} className="h-9 text-sm" />
              </FieldGroup>
              <FieldGroup label="Part #">
                <Input value={sheet.part_number || ""} onChange={e => update("part_number", e.target.value)} className="h-9 text-sm" />
              </FieldGroup>
              <FieldGroup label="Description">
                <Input value={sheet.description || ""} onChange={e => update("description", e.target.value)} className="h-9 text-sm" />
              </FieldGroup>
              <FieldGroup label="Machine">
                <select
                  value={sheet.machine || ""}
                  onChange={e => update("machine", e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">— Select —</option>
                  <option value="Zeiss">Zeiss</option>
                  <option value="Hexagon">Hexagon</option>
                </select>
              </FieldGroup>
              <FieldGroup label="REV">
                <Input value={sheet.material || ""} onChange={e => update("material", e.target.value)} className="h-9 text-sm" />
              </FieldGroup>
              <FieldGroup label="Cycle Time">
                <TimeInput value={sheet.cycle_time || ""} onChange={v => update("cycle_time", v)} />
              </FieldGroup>
              <FieldGroup label="Program #">
                <Input value={sheet.program_number || ""} onChange={e => update("program_number", e.target.value)} className="h-9 text-sm" />
              </FieldGroup>
              <FieldGroup label="Program Location">
                <Input value={sheet.program_location || ""} onChange={e => update("program_location", e.target.value)} className="h-9 text-sm" />
              </FieldGroup>
              <FieldGroup label="Units">
                <select
                  value={sheet.units || "in"}
                  onChange={e => update("units", e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="in">in (inches)</option>
                  <option value="mm">mm (millimeters)</option>
                </select>
              </FieldGroup>
            </div>
          </div>
        </motion.div>

        {/* Fixturing Equipment */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <FixturingSection items={sheet.fixturing || []} onChange={v => update("fixturing", v)} />
        </motion.div>

        {/* Work Placement */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.07 }}>
          <WorkPlacementSection items={sheet.work_placement || []} onChange={v => update("work_placement", v)} />
        </motion.div>

        {/* Work Holding */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <CMMWorkHolding items={sheet.work_holding || []} onChange={v => update("work_holding", v)} />
        </motion.div>

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <CMMNotesSection
            importantNotes={sheet.important_notes || []}
            programNotes={sheet.program_notes || ""}
            onChangeImportant={v => update("important_notes", v)}
            onChangeProgramNotes={v => update("program_notes", v)}
          />
        </motion.div>
      </main>

      {showAddOp && (
        <AddCMMOperationDialog
          onClose={() => setShowAddOp(false)}
          onAdd={async (opName) => {
            const newSheet = await base44.entities.CMMSheet.create({
              part_number: sheet.part_number,
              customer: sheet.customer,
              folder_id: sheet.folder_id,
              description: opName,
              machine: sheet.machine,
              material: sheet.material,
              units: sheet.units,
              program_number: sheet.program_number,
              program_location: sheet.program_location,
              cycle_time: sheet.cycle_time,
              fixturing: [],
              work_placement: [],
              work_holding: [{ _id: "first", note: "", photo_url: "" }],
              important_notes: [],
              program_notes: "",
            });
            setShowAddOp(false);
            navigate(`/cmm-sheet/${newSheet.id}`);
          }}
        />
      )}
    </div>
  );
}