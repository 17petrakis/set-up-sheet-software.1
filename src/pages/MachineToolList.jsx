import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Wrench } from "lucide-react";
import MachineToolListTable from "@/components/machine-tools/MachineToolListTable";
import TurningToolList from "@/components/setup-sheet/TurningToolList";
import { emptyTool } from "@/lib/setupSheetDefaults";
import { MACHINES, getToolSlots } from "@/lib/machines";

export default function MachineToolList() {
  const { machineName } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(machineName);
  const machine = MACHINES.find((m) => m.name === decodedName);

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
      const { tool_number, ...rest } = t || {};
      return Object.values(rest).some((v) => v !== "" && v !== null && v !== undefined);
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
  }, [decodedName]); // eslint-disable-line

  const saveRecord = useCallback(async (toolsArg, turningArg, machineArg) => {
    setSaving(true);
    const data = {
      machine_name: decodedName,
      machine_type: machineArg.type,
      tools: machineArg.type === "mill" || machineArg.type === "saw" ? cleanTools(toolsArg) : [],
      turrets: machineArg.type === "lathe" ? turningArg.turrets : [],
    };
    try {
      const rec = recordRef.current;
      if (rec) {
        await base44.entities.MachineTool.update(rec.id, data);
      } else {
        const newRec = await base44.entities.MachineTool.create(data);
        setRecord(newRec);
        recordRef.current = newRec;
      }
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 1500);
    } catch (e) {
      console.error("Auto-save failed", e);
    }
    setSaving(false);
  }, [decodedName]);

  useEffect(() => {
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    if (!machine) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveRecord(tools, turningTools, machine);
    }, 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [tools, turningTools]); // eslint-disable-line

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
          <button onClick={() => navigate("/machine-tool-lists")} className="text-primary text-sm mt-2 block">Back to Machine Tool Lists</button>
        </div>
      </div>
    );
  }

  const typeLabel = machine.type === "mill" ? "Mill" : machine.type === "lathe" ? "Lathe" : "Saw";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate("/machine-tool-lists")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Machine Tool Lists</span>
          </button>
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="text-xs text-muted-foreground">Saving...</span>
            ) : autoSaved ? (
              <span className="text-xs text-muted-foreground">All changes saved ✓</span>
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
          <TurningToolList tools={turningTools} onChange={setTurningTools} machine={decodedName} showSync={false} />
        ) : (
          <MachineToolListTable tools={tools} onChange={setTools} slotCount={getToolSlots(machine)} machineName={decodedName} />
        )}
      </section>
    </div>
  );
}