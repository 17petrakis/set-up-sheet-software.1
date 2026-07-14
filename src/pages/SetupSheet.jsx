import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, ArrowLeft, Eye, Wrench, History, Save, Plus, Menu, X, Edit3, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { ViewModeContext } from "@/lib/viewModeContext";

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
import SetupSheetViewMode from "@/components/setup-sheet/SetupSheetViewMode";

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
  const [mode, setMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "edit" ? "edit" : "view";
  });
  const fileInputRef = useRef(null);
  const debugFileInputRef = useRef(null);
  const saveTimer = useRef(null);
  const latestData = useRef({});
  const menuRef = useRef(null);

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
            const aVal = (a.tool_number || "").toString().trim().toUpperCase();
            const bVal = (b.tool_number || "").toString().trim().toUpperCase();
            if (aVal === "N/A" || bVal === "N/A") return 0;
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

  const handleSaveAndExit = async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      setSaving(true);
      try {
        await base44.entities.SetupSheet.update(id, {
          ...generalRef.current,
          tools: toolsRef.current,
          turning_tools: turningToolsRef.current,
          part_zero: partZeroRef.current,
          operations: operationsRef.current,
          photos: photosRef.current,
          fixturing_notes: fixturingNotesRef.current,
          turning_chuck: turningChuckRef.current,
        });
      } catch (err) {
        // ignore
      } finally {
        setSaving(false);
      }
    }
    setMode("view");
  };

  // Close hamburger menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

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
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm md:text-lg font-bold tracking-tight text-foreground shrink-0 whitespace-nowrap">{general.part_number}</span>
                <span className="text-sm md:text-lg font-bold tracking-tight text-muted-foreground shrink-0">—</span>
                <InlineEditTitle
                  value={general.operation_name || "Operation"}
                  onChange={(val) => handleGeneralChange("operation_name", val)}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {saveStatus === "saved" ? "Saved ✓" : saving ? "Saving…" : general.customer || "Machine Shop Manager"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
            <input ref={debugFileInputRef} type="file" accept=".pdf" onChange={handleDebugPDF} className="hidden" />

            {mode === "edit" && (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate(`/sheet/${id}/print`)} className="hidden md:inline-flex h-9 gap-1.5 shrink-0">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/sheet/${id}/print-tools`)} className="hidden md:inline-flex h-9 gap-1.5 shrink-0">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Tool List</span>
                </Button>
                {general.folder_id && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddOp(true)} className="hidden md:inline-flex h-9 gap-1.5 shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Op</span>
                  </Button>
                )}
                {general.machine_type !== "turning" && (
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing} className="hidden md:inline-flex h-9 gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{importing ? "Importing..." : "Import"}</span>
                  </Button>
                )}
                <Button size="default" onClick={handleSaveAndExit} disabled={saving} className="hidden md:flex h-11 px-6 text-sm font-bold gap-2 ml-1 shrink-0">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
              </>
            )}

            {mode === "view" && (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate(`/sheet/${id}/print`)} className="hidden md:inline-flex h-9 gap-1.5 shrink-0">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/sheet/${id}/print-tools`)} className="hidden md:inline-flex h-9 gap-1.5 shrink-0">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Tool List</span>
                </Button>
                {general.folder_id && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddOp(true)} className="hidden md:inline-flex h-9 gap-1.5 shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Op</span>
                  </Button>
                )}
                <Button size="default" onClick={() => setMode("edit")} className="hidden md:flex h-11 px-6 text-sm font-bold gap-2 ml-1 shrink-0">
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Button>
              </>
            )}

            <div ref={menuRef} className="relative shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileMenuOpen(v => !v)}>
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
              {mobileMenuOpen && (
                <>
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-popover border border-border rounded-lg shadow-xl no-print">
                    <div className="py-1.5 flex flex-col gap-0.5">
                      {mode === "view" && (
                        <>
                          <button onClick={() => { setMode("edit"); setMobileMenuOpen(false); }}
                            className="md:hidden flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                            <Edit3 className="w-4 h-4 shrink-0 text-muted-foreground" />
                            Edit
                          </button>
                          <button onClick={() => { navigate(`/sheet/${id}/print`); setMobileMenuOpen(false); }}
                            className="md:hidden flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                            <Printer className="w-4 h-4 shrink-0 text-muted-foreground" />
                            Print
                          </button>
                          <button onClick={() => { navigate(`/sheet/${id}/print-tools`); setMobileMenuOpen(false); }}
                            className="md:hidden flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                            <Wrench className="w-4 h-4 shrink-0 text-muted-foreground" />
                            Tool List
                          </button>
                          {general.folder_id && (
                            <button onClick={() => { setShowAddOp(true); setMobileMenuOpen(false); }}
                              className="md:hidden flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                              <Plus className="w-4 h-4 shrink-0 text-muted-foreground" />
                              Add Op
                            </button>
                          )}
                          <div className="my-1 h-px bg-border" />
                        </>
                      )}
                      {mode === "edit" && (
                        <div className="md:hidden">
                          <button onClick={() => { handleSaveAndExit(); setMobileMenuOpen(false); }}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                            <Eye className="w-4 h-4 shrink-0 text-muted-foreground" />
                            View
                          </button>
                          <button onClick={() => { navigate(`/sheet/${id}/print`); setMobileMenuOpen(false); }}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                            <Printer className="w-4 h-4 shrink-0 text-muted-foreground" />
                            Print
                          </button>
                          <button onClick={() => { navigate(`/sheet/${id}/print-tools`); setMobileMenuOpen(false); }}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                            <Wrench className="w-4 h-4 shrink-0 text-muted-foreground" />
                            Tool List
                          </button>
                          {general.machine_type !== "turning" && (
                            <button onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                              <Upload className="w-4 h-4 shrink-0 text-muted-foreground" />
                              Import
                            </button>
                          )}
                          {general.folder_id && (
                            <button onClick={() => { setShowAddOp(true); setMobileMenuOpen(false); }}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                              <Plus className="w-4 h-4 shrink-0 text-muted-foreground" />
                              Add Op
                            </button>
                          )}
                          <div className="my-1 h-px bg-border" />
                        </div>
                      )}
                      <button onClick={() => { saveRevision(); setMobileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                        <Save className="w-4 h-4 shrink-0 text-muted-foreground" />
                        Save Revision
                      </button>
                      <button onClick={() => { setShowHistory(true); setMobileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left">
                        <History className="w-4 h-4 shrink-0 text-muted-foreground" />
                        History
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <DebugPDFModal text={debugText} onClose={() => setDebugText(null)} />
      <RevisionHistory sheetId={id} open={showHistory} onClose={() => setShowHistory(false)} onRestore={handleRestore} />
      {showAddOp && (
        <AddOperationDialog
          onClose={() => setShowAddOp(false)}
          onAdd={async (machineType, opName) => {
            const isTurning = machineType === "turning";
            // Fields to exclude from general info carry-over (cycle time, fixturing & operation-specific fields)
            const EXCLUDE_FIELDS = [
              "cycle_time", "cycle_time_hrs", "handling_time", "total_cycle_time",
              "total_additional_time", "deburring_time", "finishing_time", "wash_time",
              "has_deburring", "deburring_notes", "finishing_notes", "wash_notes",
              "operation_description", "operation_notes", "work_holding_notes",
              "fixturing_notes", "operation_name", "stops",
            ];
            const carriedGeneral = Object.fromEntries(
              Object.entries(general).filter(([k]) => !EXCLUDE_FIELDS.includes(k))
            );

            // Carry over only drawing, material stock, ISO view, and final part photos
            const CARRY_PHOTOS = ["drawing", "material_stock", "iso", "final_part", "final_part_2"];
            const carriedPhotos = {};
            CARRY_PHOTOS.forEach(k => { if (photos[k]) carriedPhotos[k] = photos[k]; });

            const createData = {
              ...emptyGeneral,
              ...carriedGeneral,
              machine_type: machineType,
              operation_name: opName,
              tools: isTurning ? [] : [{ ...emptyTool }],
              turning_tools: isTurning ? { ...emptyTurningTools } : undefined,
              part_zero: { ...emptyPartZero },
              operations: isTurning ? [{ ...emptyTurningOperation }] : [{ ...emptyOperation }],
              photos: carriedPhotos,
              turning_chuck: isTurning ? turningChuck : undefined,
            };

            const newSheet = await base44.entities.SetupSheet.create({
              ...createData,
              part_number: general.part_number,
              customer: general.customer,
              folder_id: general.folder_id,
              sort_order: Date.now(),
            });
            setShowAddOp(false);
            navigate(`/sheet/${newSheet.id}?mode=edit`);
          }}
        />
      )}

      {/* Content */}
      <ViewModeContext.Provider value={mode === "view"}>
      <main className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-3 md:py-6 print-container space-y-3 md:space-y-5">
        {importError && (
          <ImportBanner message={importError} onClose={() => setImportError(null)} />
        )}

        {mode === "view" ? (
          <SetupSheetViewMode
            general={general}
            tools={tools}
            turningTools={turningTools}
            partZero={partZero}
            operations={operations}
            photos={photos}
            fixturingNotes={fixturingNotes}
            turningChuck={turningChuck}
          />
        ) : (
        <>
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
                <TurningOperationsList operations={operations} onChange={handleOperationsChange} includeInView={general.operations_in_view} onIncludeInViewChange={(val) => handleGeneralChange("operations_in_view", val)} />
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

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.13 }}>
                {(mode === "edit" || (general.operation_notes && general.operation_notes.trim())) && (
                  <OperationNotes value={general.operation_notes} onChange={(val) => handleGeneralChange("operation_notes", val)} machineType={general.machine_type} />
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
                <OperationsList operations={operations} onChange={handleOperationsChange} includeInView={general.operations_in_view} onIncludeInViewChange={(val) => handleGeneralChange("operations_in_view", val)} />
              </motion.div>
            </>
          )}

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            {(mode === "edit" || Object.values(photos).some(v => typeof v === "string" && v)) && (
              <PhotoSection photos={photos} onChange={handlePhotosChange} readOnly={mode === "view"} />
            )}
          </motion.div>
        </>
        )}
      </main>
      </ViewModeContext.Provider>
    </div>
  );
}