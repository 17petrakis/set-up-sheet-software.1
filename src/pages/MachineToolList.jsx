import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft } from "lucide-react";
import ToolList from "@/components/setup-sheet/ToolList";
import TurningToolList from "@/components/setup-sheet/TurningToolList";
import { emptyTool } from "@/lib/setupSheetDefaults";
import { MACHINES, getToolSlots } from "@/lib/machines";

export default function MachineToolList() {
  const { machineName } = useParams();
  const decodedName = decodeURIComponent(machineName);
  const machine = MACHINES.find(m => m.name === decodedName);

  const [record, setRecord] = useState(null);
  const [tools, setTools] = useState([{ ...emptyTool }]);
  const [turningTools, setTurningTools] = useState({ turrets: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const isInitialLoad = useRef(true);
  const saveTimer = useRef(null);
  const recordRef = useRef(null);

  const cleanTools = (arr) =>
    (arr || []).filter((t) => {
      const { tool_number, locked, visible_fields, ...rest } = t || {};
      return Object.values(rest).some((v) => v !== "" && v !== null && v !== undefined);
    }).map((t) => {
      const { locked, ...data } = t;
      return locked ? { ...data, locked } : data;
    });

  const buildSlotTools = (loaded, slotCount) => {
    const source = Array.isArray(loaded) ? loaded : [];
    const slots = Array.from({ length: slotCount }, (_, i) => ({ ...emptyTool, tool_number: String(i + 1) }));
    const placed = new Array(slotCount).fill(false);
    const leftovers = [];
    source.forEach((t) => {
      const n = parseInt(t.tool_number, 10);
      if (!isNaN(n) && n >= 1 && n <= slotCount && !placed[n - 1]) {
        slots[n - 1] = { ...t, tool_number: String(n) };
        placed[n - 1] = true;
      } else {
        leftovers.push(t);
      }
    });
    let li = 0;
    for (let i = 0; i < slotCount && li < leftovers.length; i++) {
      if (!placed[i]) {
        slots[i] = { ...leftovers[li], tool_number: String(i + 1) };
        placed[i] = true;
        li++;
      }
    }
    return slots;
  };

  useEffect(() => {
    if (!machine) { setLoading(false); return; }
    base44.entities.MachineTool.filter({ machine_name: decodedName }).then((results) => {
      if (results && results.length > 0) {
        const r = results[0];
        setRecord(r);
        recordRef.current = r;
        if (machine.type === "mill" || machine.type === "saw") {
          setTools(buildSlotTools(r.tools, getToolSlots(machine)));
        } else {
          setTurningTools(r.turrets ? { turrets: r.turrets } : { turrets: [] });
        }
      } else if (machine.type === "mill" || machine.type === "saw") {
        setTools(buildSlotTools([], getToolSlots(machine)));
      }
      setLoading(false);
    });
  }, [decodedName]);

  const saveRecord = useCallback(async (toolsArg, turningArg) => {
    const rec = recordRef.current;
    setSaving(true);
    const data = {
      machine_name: decodedName,
      machine_type: machine.type,
      tools: machine.type === "mill" || machine.type === "saw" ? cleanTools(toolsArg) : [],
      turrets: machine.type === "lathe" ? turningArg.turrets : [],
    };
    try {
      if (rec) {
        await base44.entities.MachineTool.update(rec.id, data);
      } else {
        const created = await base44.entities.MachineTool.create(data);
        setRecord(created);
        recordRef.current = created;
      }
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 1500);
    } catch (e) {
      console.error("Auto-save failed", e);
    }
    setSaving(false);
  }, [decodedName, machine]);

  useEffect(() => {
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    if (!machine) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveRecord(tools, turningTools);
    }, 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [tools, turningTools]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Machine not found</p>
          <Link to="/machine-tool-lists" className="text-primary text-sm mt-2 block">Back to Machine Tool Lists</Link>
        </div>
      </div>
    );
  }

  const typeLabel = machine.type === "mill" ? "Mill" : machine.type === "lathe" ? "Lathe" : "Saw";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <Link to="/machine-tool-lists" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Machine Tool Lists</span>
          </Link>
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="text-xs text-muted-foreground">Saving...</span>
            ) : autoSaved ? (
              <span className="text-xs text-green-600">Saved</span>
            ) : null}
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-heading text-foreground">{decodedName}</h1>
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{typeLabel}</span>
          </div>
          <p className="text-muted-foreground text-sm">Manage and track all tools stationed in this machine.</p>
        </div>

        {machine.type === "lathe" ? (
          <TurningToolList tools={turningTools} onChange={setTurningTools} />
        ) : (
          <ToolList tools={tools} onChange={setTools} slotCount={getToolSlots(machine)} />
        )}
      </section>
    </div>
  );
}