import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ArrowRight, Wrench, Check, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { emptyTool } from "@/lib/setupSheetDefaults";
import { MACHINES, getToolSlots } from "@/lib/machines";
import { TOOL_FIELDS, TOOL_FIELD_SHORT, getEffectiveVisibleFields } from "@/lib/toolTypeOptions";

const cleanTool = (t) => {
  const cleaned = { ...t };
  delete cleaned.id;
  delete cleaned.created_date;
  delete cleaned.updated_date;
  delete cleaned.created_by_id;
  return cleaned;
};

const isToolEmpty = (t) =>
  !Object.entries(t || {}).some(([k, v]) => k !== "tool_number" && v && String(v).trim());

const toolKey = (t) =>
  [t.tool_type, t.diameter, t.flutes, t.holder, t.name, t.angle, t.flute_length, t.stickout_length]
    .map((v) => (v || "").toString().trim().toLowerCase())
    .join("|");

export default function MachineToolSync() {
  const { sheetId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null);
  const [machine, setMachine] = useState(null);
  const [machineTools, setMachineTools] = useState([]);
  const [machineRecord, setMachineRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addedKeys, setAddedKeys] = useState(new Set());
  const recordRef = useRef(null);

  useEffect(() => {
    if (!sheetId) { setLoading(false); return; }
    (async () => {
      try {
        const s = await base44.entities.SetupSheet.get(sheetId);
        setSheet(s);
        const machineName = s.machine || "";
        const match = MACHINES.find((m) => m.name === machineName);
        setMachine(match || null);

        if (match) {
          const results = await base44.entities.MachineTool.filter({ machine_name: machineName });
          if (results && results.length > 0) {
            const r = results[0];
            setMachineRecord(r);
            recordRef.current = r;
            setMachineTools(Array.isArray(r.tools) ? r.tools.map(cleanTool) : []);
          }
        }
      } catch (e) {
        console.error("Failed to load", e);
      }
      setLoading(false);
    })();
  }, [sheetId]);

  const slotCount = machine ? getToolSlots(machine) : 0;

  const machineSlots = (() => {
    const slots = Array.from({ length: slotCount }, (_, i) => ({ ...emptyTool, tool_number: String(i + 1) }));
    const placed = new Array(slotCount).fill(false);
    const leftovers = [];
    (machineTools || []).forEach((t) => {
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
  })();

  const sheetTools = (sheet?.tools || []).filter((t) => !isToolEmpty(t));

  const isToolInMachine = (sheetTool) => {
    const key = toolKey(sheetTool);
    return machineSlots.some((s) => toolKey(s) === key && key);
  };

  const addToolToMachine = (sheetTool) => {
    const key = toolKey(sheetTool);
    if (addedKeys.has(key) || isToolInMachine(sheetTool)) return;

    const emptyIdx = machineSlots.findIndex((s, idx) => isToolEmpty(s) || (!s.tool_type && !s.diameter));
    if (emptyIdx === -1) return;

    const next = [...machineTools];
    const newTool = { ...cleanTool(sheetTool), tool_number: String(emptyIdx + 1) };
    // remove any existing entry with same tool_number placeholder
    next.push(newTool);
    setMachineTools(next);
    setAddedKeys((prev) => new Set(prev).add(key));
    saveMachine(next);
  };

  const addAllTools = () => {
    const next = [...machineTools];
    const newKeys = new Set(addedKeys);
    let slot = 0;
    sheetTools.forEach((sheetTool) => {
      if (isToolInMachine(sheetTool)) return;
      const key = toolKey(sheetTool);
      if (newKeys.has(key)) return;
      while (slot < slotCount && machineSlots[slot] && !isToolEmpty(machineSlots[slot])) slot++;
      if (slot >= slotCount) return;
      next.push({ ...cleanTool(sheetTool), tool_number: String(slot + 1) });
      newKeys.add(key);
      slot++;
    });
    setMachineTools(next);
    setAddedKeys(newKeys);
    saveMachine(next);
  };

  const saveMachine = async (toolsArg) => {
    if (!machine || !recordRef.current) return;
    setSaving(true);
    const cleaned = toolsArg
      .filter((t) => !isToolEmpty(t))
      .map((t) => {
        const c = { ...t };
        delete c.id; delete c.created_date; delete c.updated_date; delete c.created_by_id;
        return c;
      });
    try {
      await base44.entities.MachineTool.update(recordRef.current.id, {
        machine_name: machine.name,
        machine_type: machine.type,
        tools: cleaned,
        turrets: [],
      });
    } catch (e) {
      console.error("Save failed", e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Setup sheet not found</p>
          <button onClick={() => navigate("/")} className="text-primary text-sm mt-2 block">Back to Home</button>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-lg font-medium mb-1">No machine selected</p>
          <p className="text-sm text-muted-foreground mb-3">This setup sheet doesn't have a recognized machine. Select a machine on the setup sheet first.</p>
          <button onClick={() => navigate(`/sheet/${sheetId}`)} className="text-primary text-sm">Back to Setup Sheet</button>
        </div>
      </div>
    );
  }

  const renderToolRow = (tool, key) => {
    const visible = getEffectiveVisibleFields(tool);
    const fields = TOOL_FIELDS.filter((f) => visible[f.key] && tool[f.key] && String(tool[f.key]).trim());
    return (
      <div key={key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/20 border-b border-border/30 last:border-b-0">
        <div className="shrink-0 w-10 text-center text-xs font-mono font-semibold text-foreground">{tool.tool_number}</div>
        <div className="shrink-0 w-32 text-xs text-muted-foreground truncate">{tool.tool_type || "—"}</div>
        {fields.slice(0, 4).map((f) => (
          <div key={f.key} className="shrink-0 text-xs text-foreground truncate" style={{ minWidth: "60px", maxWidth: "120px" }}>
            <span className="text-[9px] text-muted-foreground uppercase block">{TOOL_FIELD_SHORT[f.key]}</span>
            {tool[f.key]}
          </div>
        ))}
        <div className="shrink-0 text-xs text-foreground truncate flex-1 min-w-0">
          <span className="text-[9px] text-muted-foreground uppercase block">Comment</span>
          {tool.name || "—"}
        </div>
      </div>
    );
  };

  const fullMachineCount = machineSlots.filter((t) => !isToolEmpty(t)).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(`/sheet/${sheetId}`)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Back to Setup Sheet</span>
          </button>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-heading text-foreground">Tool Sync</h1>
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{machine.name}</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Add tools from this setup sheet to the machine's tool list. {fullMachineCount}/{slotCount} machine slots filled.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Setup Sheet Tools */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold font-heading">Setup Sheet Tools</h2>
                  <span className="text-xs text-muted-foreground">{sheetTools.length} tools</span>
                </div>
                <Button size="sm" onClick={addAllTools} className="h-7 text-xs gap-1.5">
                  <Plus className="w-3 h-3" /> Add All to Machine
                </Button>
              </div>
              <div className="space-y-0 max-h-[60vh] overflow-y-auto">
                {sheetTools.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No tools on this setup sheet.</p>
                ) : (
                  sheetTools.map((tool, i) => {
                    const inMachine = isToolInMachine(tool) || addedKeys.has(toolKey(tool));
                    return (
                      <div key={i} className="flex items-center gap-2 group">
                        <div className="flex-1 min-w-0">{renderToolRow(tool, i)}</div>
                        <Button
                          size="sm"
                          variant={inMachine ? "secondary" : "outline"}
                          disabled={inMachine}
                          onClick={() => addToolToMachine(tool)}
                          className="h-7 text-xs gap-1 shrink-0"
                        >
                          {inMachine ? <><Check className="w-3 h-3" /> Added</> : <><ArrowRight className="w-3 h-3" /> Add</>}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Machine Tool List */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold font-heading">Machine Tools — {machine.name}</h2>
              </div>
              <div className="space-y-0 max-h-[60vh] overflow-y-auto">
                {machineSlots.map((tool, i) => (
                  isToolEmpty(tool) ? (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded border-b border-border/30 last:border-b-0 bg-muted/5">
                      <div className="shrink-0 w-10 text-center text-xs font-mono font-semibold text-foreground">{tool.tool_number}</div>
                      <span className="text-xs text-muted-foreground italic">empty</span>
                    </div>
                  ) : (
                    renderToolRow(tool, `m-${i}`)
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}