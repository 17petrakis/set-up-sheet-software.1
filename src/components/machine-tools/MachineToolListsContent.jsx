import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Wrench, Plus, Trash2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMachines } from "@/hooks/useMachines";
import AddMachineDialog from "./AddMachineDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const TYPE_LABEL = { mill: "Mill", lathe: "Lathe", saw: "Saw" };
const TYPE_COLOR = { mill: "bg-blue-100 text-blue-600", lathe: "bg-orange-100 text-orange-600", saw: "bg-red-100 text-red-600" };

export default function MachineToolListsContent() {
  const navigate = useNavigate();
  const { machines, addMachine, removeMachine, restoreMachine, isCustom, hiddenMachines } = useMachines();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const session = JSON.parse(localStorage.getItem("employeeSession") || "null");
  const isAdmin = session?.isAdmin === true;

  const handleAdd = async (machine) => {
    await addMachine(machine);
    setShowAdd(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await removeMachine(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <section>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">Machine Tool Lists</h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">Select a machine to view and manage its tool list.</p>
      </div>

      {isAdmin && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Machine
          </button>
          {hiddenMachines.length > 0 && (
            <span className="text-xs text-muted-foreground">{hiddenMachines.length} hidden</span>
          )}
        </div>
      )}

      <div className="space-y-2.5">
          <AnimatePresence>
            {machines.map((machine, i) => (
              <motion.div
                key={machine.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="group relative"
              >
                <button
                  onClick={() => navigate(`/machine-tool-lists/${encodeURIComponent(machine.name)}`)}
                  className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 hover:border-primary/30 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors flex-1 truncate">
                    {machine.name}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLOR[machine.type] || "bg-muted text-muted-foreground"}`}>
                    {TYPE_LABEL[machine.type]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(machine.name); }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={isCustom(machine.name) ? "Remove machine" : "Hide machine"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {machines.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No machines. Click "Add Machine" to create one.</p>
          )}

          {isAdmin && hiddenMachines.length > 0 && (
            <div className="pt-4 border-t border-border/60">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Hidden Machines</p>
              <div className="space-y-1.5">
                {hiddenMachines.map((name) => (
                  <div key={name} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                    <span className="text-sm text-muted-foreground truncate">{name}</span>
                    <button
                      onClick={() => restoreMachine(name)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 shrink-0 ml-2"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {showAdd && (
        <AddMachineDialog
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          existingNames={machines.map((m) => m.name)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isCustom(deleteTarget) ? "Remove machine?" : "Hide machine?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isCustom(deleteTarget)
                ? `"${deleteTarget}" will be permanently removed from the machine list.`
                : `"${deleteTarget}" will be hidden from the list. You can restore it later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {isCustom(deleteTarget) ? "Remove" : "Hide"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}