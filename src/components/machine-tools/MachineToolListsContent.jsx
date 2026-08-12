import { useNavigate } from "react-router-dom";
import { ChevronRight, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { MACHINES } from "@/lib/machines";

const TYPE_LABEL = { mill: "Mill", lathe: "Lathe", saw: "Saw" };
const TYPE_COLOR = { mill: "bg-blue-100 text-blue-600", lathe: "bg-orange-100 text-orange-600", saw: "bg-red-100 text-red-600" };

export default function MachineToolListsContent() {
  const navigate = useNavigate();

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

      <div className="space-y-2.5">
        {MACHINES.map((machine, i) => (
          <motion.div
            key={machine.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <button
              onClick={() => navigate(`/machine-tool-lists/${encodeURIComponent(machine.name)}`)}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 hover:border-primary/30 hover:shadow-sm transition-all group text-left"
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
          </motion.div>
        ))}
      </div>
    </section>
  );
}