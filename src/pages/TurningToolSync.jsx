import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ArrowRight, Wrench, Check, Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TOOL_FIELDS, TOOL_FIELD_SHORT, getEffectiveVisibleFields } from "@/lib/toolTypeOptions";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
} from "@/components/ui/context-menu";

const cleanTool = (t) => {
  const cleaned = { ...t };
  delete cleaned.id;
  delete cleaned.created_date;
  delete cleaned.updated_date;
  delete cleaned.created_by_id;
  delete cleaned._id;
  return cleaned;
};

const isToolEmpty = (t) =>
  !Object.entries(t || {}).some(([k, v]) =>
    k !== "_id" && k !== "tool_kind" && k !== "tool_number" && v && String(v).trim()
  );

const toolKey = (t) =>
  [t.tool_type, t.diameter, t.flutes, t.holder, t.name, t.angle,
   t.rad, t.deg, t.width, t.pitch, t.reach, t.insert, t.direction, t.tool_number]
    .map((v) => (v || "").toString().trim().toLowerCase())
    .join("|");

// Deep-copy a turrets array so we can mutate safely
const cloneTurrets = (turrets) =>
  (turrets || []).map(t => ({ ...t, tools: (t.tools || []).map(cleanTool) }));

// Collect all turret types from both sheet and machine (preserve order: sheet first, then any machine-only)
const allTurretTypes = (sheetTurrets, machineTurrets) => {
  const types = [];
  for (const t of sheetTurrets) if (t.turret_type && !types.includes(t.turret_type)) types.push(t.turret_type);
  for (const t of machineTurrets) if (t.turret_type && !types.includes(t.turret_type)) types.push(t.turret_type);
  return types;
};

export default function TurningToolSync() {
  const { sheetId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null);
  const [machineName, setMachineName] = useState("");
  const [sheetTurrets, setSheetTurrets] = useState([]);
  const [machineTurrets, setMachineTurrets] = useState([]);
  const [machineRecord, setMachineRecord] = useState(null);
  const [saving, setSaving] = useState(null);
  const [addedKeys, setAddedKeys] = useState(new Set());
  const sheetRef = useRef(null);
  const recordRef = useRef(null);

  useEffect(() => {
    if (!sheetId) { setLoading(false); return; }
    (async () => {
      try {
        const s = await base44.entities.SetupSheet.get(sheetId);
        setSheet(s);
        sheetRef.current = s;
        const sTurrets = cloneTurrets(s.turning_tools?.turrets || []);
        setSheetTurrets(sTurrets);
        const mName = s.machine || "";
        setMachineName(mName);

        if (mName) {
          const results = await base44.entities.MachineTool.filter({ machine_name: mName });
          if (results && results.length > 0) {
            const r = results[0];
            setMachineRecord(r);
            recordRef.current = r;
            setMachineTurrets(cloneTurrets(r.turrets || []));
          }
        }
      } catch (e) {
        console.error("Failed to load", e);
      }
      setLoading(false);
    })();
  }, [sheetId]);

  const getMachineTurret = (turretType) =>
    machineTurrets.find(t => t.turret_type === turretType);

  const isToolInMachine = (sheetTool, turretType) => {
    const mt = getMachineTurret(turretType);
    if (!mt) return false;
    const key = toolKey(sheetTool);
    return (mt.tools || []).some(s => toolKey(s) === key && key);
  };

  // Add a single tool from sheet → machine (matching turret)
  const addToolToMachine = (sheetTool, turretType) => {
    const addedKey = `${turretType}|${toolKey(sheetTool)}`;
    if (addedKeys.has(addedKey) || isToolInMachine(sheetTool, turretType)) return;

    const next = cloneTurrets(machineTurrets);
    let mt = next.find(t => t.turret_type === turretType);
    if (!mt) {
      mt = { turret_type: turretType, tools: [] };
      next.push(mt);
    }
    mt.tools = [...(mt.tools || []), cleanTool(sheetTool)];
    setMachineTurrets(next);
    setAddedKeys(prev => new Set(prev).add(addedKey));
    saveMachine(next);
  };

  const addAllTools = () => {
    const next = cloneTurrets(machineTurrets);
    const newKeys = new Set(addedKeys);
    for (const sheetTurret of sheetTurrets) {
      if (!sheetTurret.turret_type) continue;
      let mt = next.find(t => t.turret_type === sheetTurret.turret_type);
      if (!mt) {
        mt = { turret_type: sheetTurret.turret_type, tools: [] };
        next.push(mt);
      }
      const existingKeys = new Set((mt.tools || []).map(toolKey));
      for (const st of (sheetTurret.tools || [])) {
        if (isToolEmpty(st)) continue;
        const k = toolKey(st);
        if (!k || existingKeys.has(k)) continue;
        existingKeys.add(k);
        mt.tools = [...(mt.tools || []), cleanTool(st)];
        newKeys.add(`${sheetTurret.turret_type}|${k}`);
      }
    }
    setMachineTurrets(next);
    setAddedKeys(newKeys);
    saveMachine(next);
  };

  const deleteMachineTool = (turretType, toolIndex) => {
    const next = cloneTurrets(machineTurrets);
    const mt = next.find(t => t.turret_type === turretType);
    if (!mt) return;
    mt.tools = (mt.tools || []).filter((_, i) => i !== toolIndex);
    setMachineTurrets(next);
    saveMachine(next);
  };

  const addTurretToMachine = (turretType) => {
    const sheetTurret = sheetTurrets.find(t => t.turret_type === turretType);
    if (!sheetTurret) return;
    const next = cloneTurrets(machineTurrets);
    let mt = next.find(t => t.turret_type === turretType);
    if (!mt) {
      mt = { turret_type: turretType, tools: [] };
      next.push(mt);
    }
    const existingKeys = new Set((mt.tools || []).map(toolKey));
    const newKeys = new Set(addedKeys);
    for (const st of (sheetTurret.tools || [])) {
      if (isToolEmpty(st)) continue;
      const k = toolKey(st);
      if (!k || existingKeys.has(k)) continue;
      existingKeys.add(k);
      mt.tools = [...(mt.tools || []), cleanTool(st)];
      newKeys.add(`${turretType}|${k}`);
    }
    setMachineTurrets(next);
    setAddedKeys(newKeys);
    saveMachine(next);
  };

  const deleteSheetTool = (turretType, toolIndex) => {
    const next = cloneTurrets(sheetTurrets);
    const st = next.find(t => t.turret_type === turretType);
    if (!st) return;
    st.tools = (st.tools || []).filter((_, i) => i !== toolIndex);
    setSheetTurrets(next);
    saveSheet(next);
  };

  const addToolToSheet = (machineTool, turretType) => {
    if (!sheetRef.current) return;
    const next = cloneTurrets(sheetTurrets);
    let st = next.find(t => t.turret_type === turretType);
    if (!st) {
      st = { turret_type: turretType, tools: [] };
      next.push(st);
    }
    st.tools = [...(st.tools || []), cleanTool(machineTool)];
    setSheetTurrets(next);
    saveSheet(next);
  };

  const dragMachineToSheet = (machineTool, turretType, toolIndex) => {
    addToolToSheet(machineTool, turretType);
    const next = cloneTurrets(machineTurrets);
    const mt = next.find(t => t.turret_type === turretType);
    if (mt) {
      mt.tools = (mt.tools || []).filter((_, i) => i !== toolIndex);
      setMachineTurrets(next);
      saveMachine(next);
    }
  };

  const saveMachine = async (turretsArg) => {
    if (!recordRef.current) return;
    setSaving("machine");
    const cleaned = turretsArg.map(t => ({
      turret_type: t.turret_type,
      tools: (t.tools || []).filter(t2 => !isToolEmpty(t2)).map(cleanTool),
    }));
    try {
      await base44.entities.MachineTool.update(recordRef.current.id, {
        machine_name: machineName,
        machine_type: "lathe",
        turrets: cleaned,
        tools: recordRef.current.tools || [],
      });
    } catch (e) {
      console.error("Save machine failed", e);
    }
    setSaving(null);
  };

  const saveSheet = async (turretsArg) => {
    if (!sheetRef.current) return;
    setSaving("sheet");
    const cleaned = turretsArg.map(t => ({
      turret_type: t.turret_type,
      tools: (t.tools || []).map(cleanTool),
    }));
    try {
      const updated = await base44.entities.SetupSheet.update(sheetRef.current.id, {
        turning_tools: { turrets: cleaned },
      });
      sheetRef.current = { ...sheetRef.current, turning_tools: { turrets: cleaned } };
      setSheet(updated);
    } catch (e) {
      console.error("Save sheet failed", e);
    }
    setSaving(null);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Parse droppableId: "sheet-<turretType>" or "machine-<turretType>"
    const parseId = (id) => {
      const [side, ...rest] = id.split("-");
      return { side, turretType: rest.join("-") };
    };
    const src = parseId(source.droppableId);
    const dst = parseId(destination.droppableId);

    // Machine → Sheet
    if (src.side === "machine" && dst.side === "sheet") {
      const mt = getMachineTurret(src.turretType);
      const tool = mt?.tools?.[source.index];
      if (!tool || isToolEmpty(tool)) return;
      dragMachineToSheet(tool, src.turretType, source.index);
    }
    // Sheet → Machine
    else if (src.side === "sheet" && dst.side === "machine") {
      const st = sheetTurrets.find(t => t.turret_type === src.turretType);
      const tool = st?.tools?.[source.index];
      if (!tool) return;
      addToolToMachine(tool, src.turretType);
    }
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

  if (!machineName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-lg font-medium mb-1">No machine selected</p>
          <p className="text-sm text-muted-foreground mb-3">This setup sheet doesn't have a machine. Select a machine on the setup sheet first.</p>
          <button onClick={() => navigate(`/sheet/${sheetId}?mode=edit`)} className="text-primary text-sm">Back to Setup Sheet</button>
        </div>
      </div>
    );
  }

  const renderToolFields = (tool) => {
    const visible = getEffectiveVisibleFields(tool);
    const fields = TOOL_FIELDS.filter(f => visible[f.key] && tool[f.key] && String(tool[f.key]).trim());
    return (
      <>
        <div className="shrink-0 w-28 text-xs text-muted-foreground truncate">{tool.tool_type || "—"}</div>
        {fields.slice(0, 4).map(f => (
          <div key={f.key} className="shrink-0 text-xs text-foreground truncate" style={{ minWidth: "60px", maxWidth: "120px" }}>
            <span className="text-[9px] text-muted-foreground uppercase block">{TOOL_FIELD_SHORT[f.key]}</span>
            {tool[f.key]}
          </div>
        ))}
        <div className="shrink-0 text-xs text-foreground truncate flex-1 min-w-0">
          <span className="text-[9px] text-muted-foreground uppercase block">Comment</span>
          {tool.name || "—"}
        </div>
      </>
    );
  };

  const turretTypes = allTurretTypes(sheetTurrets, machineTurrets);
  const sheetToolCount = sheetTurrets.reduce((sum, t) => sum + (t.tools || []).filter(t2 => !isToolEmpty(t2)).length, 0);
  const machineToolCount = machineTurrets.reduce((sum, t) => sum + (t.tools || []).filter(t2 => !isToolEmpty(t2)).length, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(`/sheet/${sheetId}?mode=edit`)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Back to Setup Sheet</span>
          </button>
          <div className="flex items-center gap-2">
            {saving === "machine" && <span className="text-xs text-muted-foreground">Saving machine…</span>}
            {saving === "sheet" && <span className="text-xs text-muted-foreground">Saving sheet…</span>}
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-heading text-foreground">Turret Tool Sync</h1>
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{machineName}</span>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Setup Sheet Turrets */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold font-heading">Setup Sheet Tools</h2>
                    <span className="text-xs text-muted-foreground">{sheetToolCount} tools</span>
                  </div>
                  <Button size="sm" onClick={addAllTools} className="h-7 text-xs gap-1.5">
                    <Plus className="w-3 h-3" /> Add All to Machine
                  </Button>
                </div>
                <div className="space-y-3 max-h-[65vh] overflow-y-auto">
                  {turretTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No turrets on this setup sheet.</p>
                  ) : turretTypes.map(turretType => {
                    const st = sheetTurrets.find(t => t.turret_type === turretType);
                    const tools = (st?.tools || []).filter(t => !isToolEmpty(t));
                    return (
                      <div key={`sheet-${turretType}`} className="border border-border/40 rounded-lg">
                        <div className="px-3 py-2 bg-muted/30 border-b border-border/30 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-foreground">{turretType}</span>
                            <span className="text-xs text-muted-foreground ml-2">{tools.length} tool(s)</span>
                          </div>
                          {tools.length > 0 && (
                            <Button size="sm" variant="outline" onClick={() => addTurretToMachine(turretType)} className="h-6 text-xs gap-1">
                              <ArrowRight className="w-3 h-3" /> Add Turret to Machine
                            </Button>
                          )}
                        </div>
                        <Droppable droppableId={`sheet-${turretType}`}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[40px]">
                              {tools.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">No tools in this turret.</p>
                              ) : (
                                tools.map((tool, i) => {
                                  const inMachine = isToolInMachine(tool, turretType) || addedKeys.has(`${turretType}|${toolKey(tool)}`);
                                  return (
                                    <Draggable key={`s-${turretType}-${i}`} draggableId={`s-${turretType}-${i}`} index={i}>
                                      {(prov) => (
                                        <ContextMenu>
                                          <ContextMenuTrigger asChild>
                                            <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-2 group">
                                              <div {...prov.dragHandleProps} className="flex items-center pb-1.5 cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                                              </div>
                                              <div className="shrink-0 w-10 text-center text-xs font-mono font-semibold text-foreground">{tool.tool_number || "—"}</div>
                                              <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/20 border-b border-border/30 last:border-b-0 flex-1 min-w-0">
                                                {renderToolFields(tool)}
                                              </div>
                                              <Button
                                                size="sm"
                                                variant={inMachine ? "secondary" : "outline"}
                                                disabled={inMachine}
                                                onClick={() => addToolToMachine(tool, turretType)}
                                                className="h-7 text-xs gap-1 shrink-0"
                                              >
                                                {inMachine ? <><Check className="w-3 h-3" /> Added</> : <><ArrowRight className="w-3 h-3" /> Add</>}
                                              </Button>
                                            </div>
                                          </ContextMenuTrigger>
                                          <ContextMenuContent>
                                            <ContextMenuItem onClick={() => deleteSheetTool(turretType, i)} className="gap-2 text-destructive">
                                              <Trash2 className="w-3.5 h-3.5" /> Delete from Sheet
                                            </ContextMenuItem>
                                          </ContextMenuContent>
                                        </ContextMenu>
                                      )}
                                    </Draggable>
                                  );
                                })
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Machine Turrets */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold font-heading">Machine Tools — {machineName}</h2>
                  </div>
                </div>
                <div className="space-y-3 max-h-[65vh] overflow-y-auto">
                  {turretTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No turrets on the machine.</p>
                  ) : turretTypes.map(turretType => {
                    const mt = getMachineTurret(turretType);
                    let tools = (mt?.tools || []).filter(t => !isToolEmpty(t));
                    return (
                      <div key={`machine-${turretType}`} className="border border-border/40 rounded-lg">
                        <div className="px-3 py-2 bg-muted/30 border-b border-border/30">
                          <span className="text-xs font-semibold text-foreground">{turretType}</span>
                          <span className="text-xs text-muted-foreground ml-2">{(mt?.tools || []).filter(t => !isToolEmpty(t)).length} tool(s)</span>
                        </div>
                        <Droppable droppableId={`machine-${turretType}`}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[40px]">
                              {tools.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">No tools in this turret.</p>
                              ) : (
                                tools.map((tool, i) => {
                                  if (isToolEmpty(tool)) return null;
                                  return (
                                    <Draggable key={`m-${turretType}-${i}`} draggableId={`m-${turretType}-${i}`} index={i}>
                                      {(prov) => (
                                        <ContextMenu>
                                          <ContextMenuTrigger asChild>
                                            <div ref={prov.innerRef} {...prov.draggableProps} className="flex items-center gap-2 group">
                                              <div {...prov.dragHandleProps} className="flex items-center pb-1.5 cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                                              </div>
                                              <div className="shrink-0 w-10 text-center text-xs font-mono font-semibold text-foreground">{tool.tool_number || "—"}</div>
                                              <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/20 border-b border-border/30 last:border-b-0 flex-1 min-w-0">
                                                {renderToolFields(tool)}
                                              </div>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => deleteMachineTool(turretType, i)}
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          </ContextMenuTrigger>
                                          <ContextMenuContent>
                                            <ContextMenuItem onClick={() => addToolToSheet(tool, turretType)} className="gap-2">
                                              <ArrowLeft className="w-3.5 h-3.5" /> Add to Setup Sheet
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => deleteMachineTool(turretType, i)} className="gap-2 text-destructive">
                                              <Trash2 className="w-3.5 h-3.5" /> Delete from Machine
                                            </ContextMenuItem>
                                          </ContextMenuContent>
                                        </ContextMenu>
                                      )}
                                    </Draggable>
                                  );
                                })
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </DragDropContext>
      </section>
    </div>
  );
}