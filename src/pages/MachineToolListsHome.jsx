import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { MACHINES } from "@/lib/machines";

const TYPE_LABEL = { mill: "Mill", lathe: "Lathe", saw: "Saw" };
const TYPE_COLOR = { mill: "bg-blue-100 text-blue-700", lathe: "bg-orange-100 text-orange-700", saw: "bg-green-100 text-green-700" };

export default function MachineToolListsHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Machine Tool Lists</span>
          </div>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
            Machine Tool Lists
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
            Select a machine to view and manage its tool list.
          </p>
        </div>

        <div className="space-y-2.5">
          {MACHINES.map((machine, i) => (
            <motion.div
              key={machine.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={`/machine-tool-lists/${encodeURIComponent(machine.name)}`}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 hover:border-primary/30 hover:shadow-sm transition-all group"
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
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}