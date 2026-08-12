import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MachineToolListsContent from "@/components/machine-tools/MachineToolListsContent";

export default function MachineToolListsHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 -ml-2 rounded-lg active:bg-muted/50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Home</span>
          </button>
          <span className="text-muted-foreground/40 text-sm">/</span>
          <span className="text-sm font-semibold text-foreground">Machine Tool Lists</span>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <MachineToolListsContent />
      </section>
    </div>
  );
}