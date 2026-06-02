import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LayoutDashboard, Users, FilePlus, FileText } from "lucide-react";
import NewSheetDialog from "@/components/home/NewSheetDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function SheetCard({ sheet, onOpen }) {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
      onClick={() => onOpen(sheet.id)}>
      
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground truncate max-w-[120px]">{sheet.part_number || "Unnamed"}</span>
            {sheet.revision &&
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                Rev {sheet.revision}
              </span>
            }
          </div>
          {sheet.customer &&
          <p className="text-xs text-muted-foreground truncate mt-0.5">{sheet.customer}</p>
          }
        </div>
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
        {sheet.job_number &&
        <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Job</p>
            <p className="text-foreground font-medium truncate">{sheet.job_number}</p>
          </div>
        }
        {sheet.machine &&
        <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px] flex items-center gap-0.5">⚙ Machine</p>
            <p className="text-foreground font-medium truncate">{sheet.machine}</p>
          </div>
        }
        {sheet.updated_date &&
        <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px] flex items-center gap-0.5">≈ Updated</p>
            <p className="text-foreground font-medium">
              {format(new Date(sheet.updated_date), "MMM d, yyyy")}
            </p>
          </div>
        }
      </div>
    </div>);

}

export default function Home() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.SetupSheet.list("-updated_date", 200);
    setSheets(data);
    setLoading(false);
  };

  useEffect(() => {load();}, []);

  const filtered = search.trim() ?
  sheets.filter((s) =>
  s.part_number?.toLowerCase().includes(search.toLowerCase()) ||
  s.customer?.toLowerCase().includes(search.toLowerCase()) ||
  s.job_number?.toLowerCase().includes(search.toLowerCase()) ||
  s.machine?.toLowerCase().includes(search.toLowerCase())
  ) :
  sheets;

  // Group by customer for the Customers view
  const grouped = {};
  for (const sheet of filtered) {
    const customer = sheet.customer?.trim() || "No Customer";
    if (!grouped[customer]) grouped[customer] = [];
    grouped[customer].push(sheet);
  }
  const sortedCustomers = Object.keys(grouped).sort((a, b) =>
  a === "No Customer" ? 1 : b === "No Customer" ? -1 : a.localeCompare(b)
  );

  const handleDelete = async (id) => {
    await base44.entities.SetupSheet.delete(id);
    setSheets((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreated = (sheet) => {
    navigate(`/sheet/${sheet.id}`);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10 bg-[hsl(var(--background))]">
          <img src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/815a07707_BlackwithSPILettering1.svg"

          alt="Logo"
          className="h-10 w-auto object-contain" />
          
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => setActiveNav("dashboard")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "dashboard" ?
              "bg-primary text-white" :
              "text-slate-300 hover:bg-white/10 hover:text-white"
            )}>
            
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveNav("customers")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "customers" ?
              "bg-primary text-white" :
              "text-slate-300 hover:bg-white/10 hover:text-white"
            )}>
            
            <Users className="w-4 h-4 shrink-0" />
            Customers
          </button>
          <button
            onClick={() => setShowNewDialog(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
            
            <FilePlus className="w-4 h-4 shrink-0" />
            New Setup Sheet
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {activeNav === "customers" ? "Customers" : "Setup Sheets"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeNav === "customers" ?
                "Browse setup sheets organized by customer" :
                "Manage and organize your machine shop setup documentation"}
              </p>
            </div>
            <Button onClick={() => setShowNewDialog(true)} className="gap-2">
              <FilePlus className="w-4 h-4" />
              New Setup Sheet
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by part #, customer, job #, or machine..."
              className="pl-9 h-10 text-sm bg-card border-border" />
            
          </div>

          {/* Content */}
          {loading ?
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading…</div> :
          activeNav === "customers" ? (
          /* Customers view — grouped */
          <div className="space-y-6">
              {sortedCustomers.length === 0 ?
            <p className="text-center py-12 text-muted-foreground text-sm">No results found.</p> :
            sortedCustomers.map((customer) =>
            <div key={customer}>
                  <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    {customer}
                    <span className="text-xs text-muted-foreground font-normal">({grouped[customer].length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {grouped[customer].map((sheet) =>
                <SheetCard key={sheet.id} sheet={sheet} onOpen={(id) => navigate(`/sheet/${id}`)} />
                )}
                  </div>
                </div>
            )}
            </div>) : (

          /* Dashboard view — all cards */
          sheets.length === 0 ?
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <FileText className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No setup sheets yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create your first setup sheet to get started.</p>
                </div>
                <Button size="sm" onClick={() => setShowNewDialog(true)} className="gap-1.5">
                  <FilePlus className="w-3.5 h-3.5" /> New Sheet
                </Button>
              </div> :
          filtered.length === 0 ?
          <p className="text-center py-12 text-muted-foreground text-sm">No results found.</p> :

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((sheet) =>
            <SheetCard key={sheet.id} sheet={sheet} onOpen={(id) => navigate(`/sheet/${id}`)} />
            )}
              </div>)

          }
        </main>
      </div>

      {showNewDialog &&
      <NewSheetDialog onClose={() => setShowNewDialog(false)} onCreate={handleCreated} />
      }
    </div>);

}