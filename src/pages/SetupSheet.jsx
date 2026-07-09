import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, ArrowLeft, Eye, Wrench, History, Save, Plus, Menu, X } from "lucide-react";
import { motion } from "framer-motion";

import GeneralInfo from "@/components/setup-sheet/GeneralInfo";
import TurningGeneralInfo from "@/components/setup-sheet/TurningGeneralInfo";
import ToolList from "@/components/setup-sheet/ToolList";
import PartZero from "@/components/setup-sheet/PartZero";
import OperationsList from "@/components/setup-sheet/OperationsList";
import ImportBanner from "@/components/setup-sheet/ImportBanner";
import DebugPDFModal from "@/components/setup-sheet/DebugPDFModal";
import PhotoSection from "@/components/setup-sheet/PhotoSection";
import OperationNotes from "@/components/setup-sheet/OperationNotes";
import TurningChuckSection from "@/components/setup-sheet/TurningChuckSection";
import TurningToolList from "@/components/setup-sheet/TurningToolList";
import TurningOperationsList from "@/components/setup-sheet/TurningOperationsList";
import RevisionHistory from "@/components/setup-sheet/RevisionHistory";
import AddOperationDialog from "@/components/home/AddOperationDialog";
import FixturingNotes from "@/components/setup-sheet/FixturingNotes";
import InlineEditTitle from "@/components/setup-sheet/InlineEditTitle";

import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation, emptyTurningChuck, emptyTurningTools, emptyTurningOperation } from "@/lib/setupSheetDefaults";
import { parseExcel, extractExcelImage } from "@/lib/fileImport";

export default function SetupSheet() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [general, setGeneral] = useState({ ...emptyGeneral });
  const [tools, setTools] = useState([{ ...emptyTool }]);
  const [turningTools, setTurningTools] = useState({ ...emptyTurningTools });
  const [partZero, setPartZero] = useState({ ...emptyPartZero });
  const [operations, setOperations] = useState([{ ...emptyOperation }]);
  const [photos, setPhotos] = useState({});
  const [fixturingNotes, setFixturingNotes] = useState({});
  const [turningChuck, setTurningChuck] = useState({ ...emptyTurningChuck });
  const [importError, setImportError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saved" | null
  const [debugText, setDebugText] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddOp, setShowAddOp] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const debugFileInputRef = useRef(null);
  const saveTimer = useRef(null);
  const latestData = useRef({});

  // Load existing sheet
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const sheet = await base44.entities.SetupSheet.get(id);
        const { tools: t, turning_tools: tt, part_zero: pz, operations: ops, photos: ph, turning_chuck: tc, ...gen } = sheet;
        const isTurning = gen.machine_type === "turning";
        setGeneral({ ...emptyGeneral, ...gen });
        setTools(t?.length ? t : [{ ...emptyTool }]);
        setTurningTools(tt && (tt.turrets?.length || tt.axial || tt.radial) ? tt : { ...emptyTurningTools });
        setPartZero(pz && Object.keys(pz).length ? { ...emptyPartZero, ...pz } : { ...emptyPartZero });
        setOperations(ops?.length ? ops : isTurning ? [{ ...emptyTurningOperation }] : [{ ...emptyOperation }]);
        setPhotos(ph || {});
        setFixturingNotes(sheet.fixturing_notes || {});
        setTurningChuck(tc && Object.keys(tc).length ? { ...emptyTurningChuck, ...tc } : { ...emptyTurningChuck });
        setLoading(false);
      } catch (err) {
        // Sheet not found or deleted — go back to home
        navigate("/", { replace: true });
      }
    })();
  }, [id]);

  // Auto-save debounce
  const triggerSave = useCallback((gen, t, tt, pz, ops, ph, fn, tc) => {
    if (!id) return;
    latestData.current = { gen, t, tt, pz, ops, ph, fn, tc };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const d = latestData.current;
      try {
        await base44.entities.SetupSheet.update(id, {
          ...d.gen,
          tools: d.t,
          turning_tools: d.tt,
          part_zero: d.pz,
          operations: d.ops,
          photos: d.ph,
          fixturing_notes: d.fn,
          turning_chuck: d.tc,
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 2000);
      } catch (err) {
        // Sheet may have been deleted — silently redirect home
        navigate("/", { replace: true });
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [id]);

  // Flush save immediately on unmount so navigation doesn't lose data
  // Only flush if there's actually a pending debounced save (saveTimer is set)
  useEffect(() => {
    return () => {
      if (!id || !saveTimer.current) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      // Use refs which are always up-to-date — latestData.current can be stale/empty
      const gen = generalRef.current;
      const t = toolsRef.current;
      const tt = turningToolsRef.current;
      const pz = partZeroRef.current;
      const ops = operationsRef.current;
      const ph = photosRef.current;
      const fn = fixturingNotesRef.current;
      const tc = turningChuckRef.current;
      // Only flush if general has real data (i.e. we've finished loading)
      if (gen && gen.part_number !== undefined) {
        base44.entities.SetupSheet.update(id, {
          ...gen,
          tools: t,
          turning_tools: tt,
          part_zero: pz,
          operations: ops,
          photos: ph,
          fixturing_notes: fn,
          turning_chuck: tc,
        }).catch(() => {});
      }
    };
  }, [id]);

  // Use refs to always have latest values for triggerSave closures
  const generalRef = useRef(general);
  const toolsRef = useRef(tools);
  const turningToolsRef = useRef(turningTools);
  const partZeroRef = useRef(partZero);
  const operationsRef = useRef(operations);
  const photosRef = useRef(photos);
  const fixturingNotesRef = useRef(fixturingNotes);
  const turningChuckRef = useRef(turningChuck);

  useEffect(() => { generalRef.current = general; }, [general]);
  useEffect(() => { toolsRef.current = tools; }, [tools]);
  useEffect(() => { turningToolsRef.current = turningTools; }, [turningTools]);
  useEffect(() => { partZeroRef.current = partZero; }, [partZero]);
  useEffect(() => { operationsRef.current = operations; }, [operations]);
  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => { fixturingNotesRef.current = fixturingNotes; }, [fixturingNotes]);
  useEffect(() => { turningChuckRef.current = turningChuck; }, [turningChuck]);

  const handleGeneralChange = useCallback((field, value) => {
    setGeneral(prev => ({ ...prev, [field]: value }));

    // Auto-populate work holding when machine is selected
    if (field === "machine") {
      const machine = value || "";
      let chuckUpdate = null;

      if (machine === "Doosan Puma 2100Y II") {
        chuckUpdate = {
          wh_s1_active: true, wh_s2_active: false,
          wh_s1: { chuck_type: '8" 3-Jaw' },
        };
      } else if (machine === "Doosan Puma MX2100ST") {
        chuckUpdate = {
          wh_s1_active: true, wh_s2_active: true,
          wh_s1: { chuck_type: '8" 3-Jaw' },
          wh_s2: { chuck_type: '8" 3-Jaw' },
        };
      } else if (machine === "HAAS SL-10") {
        chuckUpdate = {
          wh_s1_active: true, wh_s2_active: false,
          wh_s1: { chuck_type: '6" 3-Jaw' },
        };
      } else if (machine.startsWith("Nakamura")) {
        chuckUpdate = {
          wh_s1_active: true, wh_s2_active: false,
          wh_s1: { chuck_type: 'Collet – Flex-C65' },
        };
      } else if (machine.startsWith("Mori")) {
        chuckUpdate = {
          wh_s1_active: true, wh_s2_active: true,
          wh_s1: { chuck_type: 'Collet – NJ-5' },
          wh_s2: { chuck_type: '6" 3-Jaw' },
        };
      }

      if (chuckUpdate) {
        const newChuck = { ...turningChuckRef.current, ...chuckUpdate };
        setTurningChuck(newChuck);
        turningChuckRef.current = newChuck;
        triggerSave(
          { ...generalRef.current, [field]: value },
          toolsRef.current, turningToolsRef.current, partZeroRef.current,
          operationsRef.current, photosRef.current, fixturingNotesRef.current, newChuck
        );
      }
    }
  }, [triggerSave]);

  const handleGeneralReplace = useCallback((val) => {
    setGeneral(val);
  }, []);

  // Trigger save whenever general changes (using refs for other slices to avoid stale closures)
  useEffect(() => {
    if (!loading) {
      triggerSave(general, toolsRef.current, turningToolsRef.current, partZeroRef.current, operationsRef.current, photosRef.current, fixturingNotesRef.current, turningChuckRef.current);
    }
  }, [general]);

  const handleToolsChange = useCallback((val) => {
    setTools(val); toolsRef.current = val;
    triggerSave(generalRef.current, val, turningToolsRef.current, partZeroRef.current, operationsRef.current, photosRef.current, fixturingNotesRef.current, turningChuckRef.current);
  }, [triggerSave]);

  const handleTurningToolsChange = useCallback((val) => {
    setTurningTools(val); turningToolsRef.current = val;
    triggerSave(generalRef.current, toolsRef.current, val, partZeroRef.current, operationsRef.current, photosRef.current, fixturingNotesRef.current, turningChuckRef.current);
  }, [triggerSave]);

  const handlePartZeroChange = useCallback((val) => {
    setPartZero(val); partZeroRef.current = val;
    triggerSave(generalRef.current, toolsRef.current, turningToolsRef.current, val, operationsRef.current, photosRef.current, fixturingNotesRef.current, turningChuckRef.current);
  }, [triggerSave]);

  const handleOperationsChange = useCallback((val) => {
    setOperations(val); operationsRef.current = val;
    triggerSave(generalRef.current, toolsRef.current, turningToolsRef.current, partZeroRef.current, val, photosRef.current, fixturingNotesRef.current, turningChuckRef.current);
  }, [triggerSave]);

  const handlePhotosChange = useCallback((val) => {
    setPhotos(val); photosRef.current = val;
    triggerSave(generalRef.current, toolsRef.current, turningToolsRef.current, partZeroRef.current, operationsRef.current, val, fixturingNotesRef.current, turningChuckRef.current);
  }, [triggerSave]);

  const handleFixturingNotesChange = useCallback((val) => {
    setFixturingNotes(val); fixturingNotesRef.current = val;
    triggerSave(generalRef.current, toolsRef.current, turningToolsRef.current, partZeroRef.current, operationsRef.current, photosRef.current, val, turningChuckRef.current);
  }, [triggerSave]);

  const handleTurningChuckChange = useCallback((val) => {
    setTurningChuck(val); turningChuckRef.current = val;
    triggerSave(generalRef.current, toolsRef.current, turningToolsRef.current, partZeroRef.current, operationsRef.current, photosRef.current, fixturingNotesRef.current, val);
  }, [triggerSave]);

  const handleDebugPDF = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) throw new Error("PDF.js not loaded");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const lines = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        lines.push(`\n─── PAGE ${p} ───\n`);
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        content.items.forEach((item, idx) => {
          const x = item.transform ? item.transform[4].toFixed(2) : "?";
          const y = item.transform ? item.transform[5].toFixed(2) : "?";
          lines.push(`[${idx}] "${item.str}" (x: ${x}, y: ${y})`);
        });
      }
      setDebugText(lines.join("\n"));
    } catch (err) {
      setDebugText(`ERROR: ${err.message}`);
    } finally {
      if (debugFileInputRef.current) debugFileInputRef.current.value = "";
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);
    try {
      const [result, isoResult] = await Promise.all([parseExcel(file), extractExcelImage(file)]);

      const newGen = result.general && Object.keys(result.general).length
        ? { ...general, ...result.general } : general;
      const newTools = result.tools?.length
        ? [...result.tools].sort((a, b) => {
            const aNum = parseInt(a.tool_number) || 0;
            const bNum = parseInt(b.tool_number) || 0;
            return aNum - bNum;
          })
        : tools;
      const newPZ = result.partZero && Object.keys(result.partZero).length
        ? { ...partZero, ...result.partZero } : partZero;
      const newOps = result.operations?.length ? result.operations : operations;

      let isoUrl = null;
      if (isoResult?.dataUrl) {
        const blob = await (await fetch(isoResult.dataUrl)).blob();
        const uploadResult = await base44.integrations.Core.UploadFile({ file: new File([blob], 'iso.png', { type: 'image/png' }) });
        isoUrl = uploadResult.file_url;
      }

      const newPhotos = isoUrl ? { ...photos, iso: isoUrl } : photos;

      handleGeneralReplace(newGen);
      handleToolsChange(newTools);
      handlePartZeroChange(newPZ);
      handleOperationsChange(newOps);
      if (isoUrl) handlePhotosChange(newPhotos);

      // Show message if IMG/PICTURE label was found but image couldn't be extracted
      if (isoResult?.labelFound && !isoUrl) {
        setImportError("Image upload failed. Please manually input ISO image.");
      }
    } catch (err) {
      setImportError("Could not read Excel file — please fill in manually");
      console.error("Import error:", err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveRevision = async (note = "") => {
    if (!id) return;
    const session = JSON.parse(localStorage.getItem("employeeSession") || "null");
    const snapshot = {
      ...generalRef.current,
      tools: toolsRef.current,
      turning_tools: turningToolsRef.current,
      part_zero: partZeroRef.current,
      operations: operationsRef.current,
      photos: photosRef.current,
      fixturing_notes: fixturingNotesRef.current,
      turning_chuck: turningChuckRef.current,
    };
    await base44.entities.SheetRevision.create({
      sheet_id: id,
      part_number: generalRef.current.part_number,
      saved_by: session?.name || "Unknown",
      note,
      snapshot,
    });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleRestore = async (revision) => {
    // First save current state as a revision
    await saveRevision("Auto-saved before restore");
    const snap = revision.snapshot;
    if (!snap) return;
    const { tools: t, turning_tools: tt, part_zero: pz, operations: ops, photos: ph, fixturing_notes: fn, turning_chuck: tc, ...gen } = snap;
    setGeneral({ ...emptyGeneral, ...gen });
    setTools(t?.length ? t : [{ ...emptyTool }]);
    setTurningTools(tt && (tt.turrets?.length || tt.axial || tt.radial) ? tt : { ...emptyTurningTools });
    setPartZero(pz && Object.keys(pz).length ? { ...emptyPartZero, ...pz } : { ...emptyPartZero });
    setOperations(ops?.length ? ops : [{ ...emptyOperation }]);
    setPhotos(ph || {});
    setFixturingNotes(fn || {});
    setTurningChuck(tc && Object.keys(tc).length ? { ...emptyTurningChuck, ...tc } : { ...emptyTurningChuck });
    // Persist the restored snapshot
    await base44.entities.SetupSheet.update(id, snap);
    setShowHistory(false);
  };

  const handleReset = () => {
    setGeneral({ ...emptyGeneral });
    setTools([{ ...emptyTool }]);
    setPartZero({ ...emptyPartZero });
    setOperations([{ ...emptyOperation }]);
    setImportError(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={() => {
              navigate(`/?folder=${general.folder_id || ""}&pn=${encodeURIComponent(general.part_number || "")}&cu=${encodeURIComponent(general.customer || "")}`);
            }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {photos.iso ? (
              <img src={photos.iso} alt="ISO" className="w-9 h-9 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <InlineEditTitle value={general.part_number} onChange={(val) => handleGeneralChange("part_number", val)} />
                {general.operation_number > 1 && (
                  <span className="text-sm font-medium text-muted-foreground">— Op {general.operation_number}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {saveStatus === "saved" ? "Saved ✓" : saving ? "Saving…" : general.customer || "Machine Shop Manager"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
            <input ref={debugFileInputRef} type="file" accept=".pdf" onChange={handleDebugPDF} className="hidden" />

            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center gap-2">
              {general.machine_type !== "turning" && (
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing} className="h-8 text-xs gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  {importing ? "Importing..." : "Import File"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate(`/sheet/${id}/print`)} className="h-8 text-xs gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Print View
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/sheet/${id}/print-tools`)} className="h-8 text-xs gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Print Tool List
              </Button>
              <Button variant="outline" size="sm" onClick={() => saveRevision()} className="h-8 text-xs gap-1.5">
                <Save className="w-3.5 h-3.5" />
                Save Revision
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="h-8 text-xs gap-1.5">
                <History className="w-3.5 h-3.5" />
                History
              </Button>
              {general.folder_id && (
                <Button variant="outline" size="sm" onClick={() => setShowAddOp(true)} className="h-8 text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add Operation
                </Button>
              )}
            </div>

            {/* Mobile hamburger */}
            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile action menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden sticky top-[57px] z-40 bg-background border-b border-border shadow-md no-print">
          <div className="px-4 py-2 flex flex-col gap-1">
            {general.machine_type !== "turning" && (
              <button onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }} disabled={importing}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                <Upload className="w-4 h-4 shrink-0 text-muted-foreground" />
                {importing ? "Importing..." : "Import File"}
              </button>
            )}
            <button onClick={() => { navigate(`/sheet/${id}/print`); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
              <Eye className="w-4 h-4 shrink-0 text-muted-foreground" />
              Print View
            </button>
            <button onClick={() => { navigate(`/sheet/${id}/print-tools`); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
              <Wrench className="w-4 h-4 shrink-0 text-muted-foreground" />
              Print Tool List
            </button>
            <button onClick={() => { saveRevision(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
              <Save className="w-4 h-4 shrink-0 text-muted-foreground" />
              Save Revision
            </button>
            <button onClick={() => { setShowHistory(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
              <History className="w-4 h-4 shrink-0 text-muted-foreground" />
              History
            </button>
            {general.folder_id && (
              <button onClick={() => { setShowAddOp(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                <Plus className="w-4 h-4 shrink-0 text-muted-foreground" />
                Add Operation
              </button>
            )}
          </div>
        </div>
      )}

      <DebugPDFModal text={debugText} onClose={() => setDebugText(null)} />
      <RevisionHistory sheetId={id} open={showHistory} onClose={() => setShowHistory(false)} onRestore={handleRestore} />
      {showAddOp && (
        <AddOperationDialog
          onClose={() => setShowAddOp(false)}
          nextOpNumber={(general.operation_number || 1) + 1}
          onAdd={async (machineType) => {
            const isTurning = machineType === "turning";
            const sameType = general.machine_type === machineType;
            // Find the max operation_number among siblings
            const siblings = await base44.entities.SetupSheet.filter({ folder_id: general.folder_id });
            const maxOp = siblings.reduce((m, s) => Math.max(m, s.operation_number || 1), 0);

            let createData;
            if (sameType) {
              // Same type: copy everything from current sheet
              createData = {
                ...general,
                tools: tools,
                turning_tools: turningTools,
                part_zero: partZero,
                operations: operations,
                photos: photos,
                fixturing_notes: fixturingNotes,
                turning_chuck: turningChuck,
                operation_description: "",
                operation_notes: "",
                work_holding_notes: "",
              };
            } else {
              // Different type: only copy shared general info fields
              const SHARED_FIELDS = ["job_number", "programmer", "revision", "date", "quantity", "material", "units", "status", "program", "program_software", "program_location", "machine", "photos"];
              createData = { ...emptyGeneral, machine_type: machineType };
              SHARED_FIELDS.forEach(k => { if (general[k]) createData[k] = general[k]; });
              createData.tools = isTurning ? [] : [{ ...emptyTool }];
              createData.turning_tools = isTurning ? { ...emptyTurningTools } : undefined;
              createData.part_zero = { ...emptyPartZero };
              createData.operations = isTurning ? [{ ...emptyTurningOperation }] : [{ ...emptyOperation }];
              createData.turning_chuck = isTurning ? { ...emptyTurningChuck } : undefined;
            }

            const newSheet = await base44.entities.SetupSheet.create({
              ...createData,
              part_number: general.part_number,
              customer: general.customer,
              folder_id: general.folder_id,
              operation_number: maxOp + 1,
            });
            setShowAddOp(false);
            navigate(`/sheet/${newSheet.id}`);
          }}
        />
      )}

      {/* Content */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-3 md:py-6 print-container space-y-3 md:space-y-5">
        {importError && (
          <ImportBanner message={importError} onClose={() => setImportError(null)} />
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {general.machine_type === "turning" ? (
            <TurningGeneralInfo data={general} onChange={handleGeneralChange} onReplace={handleGeneralReplace} />
          ) : (
            <GeneralInfo data={general} onChange={handleGeneralChange} onReplace={handleGeneralReplace} machineType={general.machine_type} />
          )}
        </motion.div>

        {general.machine_type === "turning" ? (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
              <TurningChuckSection data={turningChuck} onChange={handleTurningChuckChange} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
              <PartZero data={partZero} onChange={handlePartZeroChange} machineType="turning" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <TurningToolList tools={turningTools} onChange={handleTurningToolsChange} machine={general.machine} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
              <TurningOperationsList operations={operations} onChange={handleOperationsChange} />
            </motion.div>
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.04 }}>
              <FixturingNotes data={fixturingNotes} onChange={handleFixturingNotesChange} machine={general.machine} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
              <ToolList tools={tools} onChange={handleToolsChange} machine={general.machine} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <PartZero data={partZero} onChange={handlePartZeroChange} machineType="milling" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
              <OperationsList operations={operations} onChange={handleOperationsChange} />
            </motion.div>
          </>
        )}

        {general.machine_type !== "turning" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.18 }}>
            <OperationNotes value={general.operation_notes} onChange={(val) => handleGeneralChange("operation_notes", val)} machineType={general.machine_type} />
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <PhotoSection photos={photos} onChange={handlePhotosChange} />
        </motion.div>
      </main>
    </div>
  );
}