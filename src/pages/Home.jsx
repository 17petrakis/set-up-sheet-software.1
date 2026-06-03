import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LayoutDashboard, Users, FilePlus, FileText, FolderOpen, ChevronRight, ArrowLeft, Plus, Trash2, LogOut, FolderX } from "lucide-react";
import NewSheetDialog from "@/components/home/NewSheetDialog";
import AddCustomerDialog from "@/components/home/AddCustomerDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Repeating: "bg-blue-100 text-blue-700",
  "One Time": "bg-amber-100 text-amber-700",
  Completed: "bg-gray-100 text-gray-700",
  "On Hold": "bg-red-100 text-red-700"
};

function SheetCard({ sheet, onOpen, onDelete }) {
  return (
    <div
      className="relative bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
      onClick={() => onOpen(sheet.id)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(sheet); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-lg p-1.5 transition-all"
        title="Delete sheet"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground truncate max-w-[120px]">{sheet.part_number || "Unnamed"}</span>
            {sheet.revision && (
              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                Rev {sheet.revision}
              </span>
            )}
          </div>
          {sheet.customer && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{sheet.customer}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${statusColors[sheet.status] || statusColors.Active}`}>
          {sheet.status || "Active"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
        {sheet.job_number && (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Job</p>
            <p className="text-foreground font-medium truncate">{sheet.job_number}</p>
          </div>
        )}
        {sheet.machine && (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Machine</p>
            <p className="text-foreground font-medium truncate">{sheet.machine}</p>
          </div>
        )}
        {sheet.updated_date && (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Updated</p>
            <p className="text-foreground font-medium">{format(new Date(sheet.updated_date), "MMM d, yyyy")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Auth guard — after all hooks
  const session = JSON.parse(localStorage.getItem("employeeSession") || "null");
  const isAdmin = session?.isAdmin === true;

  useEffect(() => {
    if (!session) {
      navigate("/employee-login");
    }
  }, []);

  const load = async () => {
    setLoading(true);
    const [data, customerData] = await Promise.all([
      base44.entities.SetupSheet.list("-updated_date", 200),
      base44.entities.Customer.list("name", 200),
    ]);
    setSheets(data);
    setCustomers(customerData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = sheets.filter(s => {
    const searchMatch = !search.trim() ||
        s.part_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.customer?.toLowerCase().includes(search.toLowerCase()) ||
        s.job_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.machine?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || s.status === statusFilter;
    return searchMatch && statusMatch;
  });

  // Group by customer — include standalone Customer records as empty folders
  const grouped = {};
  for (const c of customers) {
    const name = c.name?.trim();
    if (name && !grouped[name]) grouped[name] = [];
  }
  for (const sheet of sheets) {
    const customer = sheet.customer?.trim() || "No Customer";
    if (!grouped[customer]) grouped[customer] = [];
    grouped[customer].push(sheet);
  }
  const sortedCustomers = Object.keys(grouped).sort((a, b) =>
    a === "No Customer" ? 1 : b === "No Customer" ? -1 : a.localeCompare(b)
  );

  // All known customer names (for dropdowns)
  const allCustomerNames = sortedCustomers.filter(c => c !== "No Customer");

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerTarget) return;
    // Delete the Customer entity record if it exists
    const match = customers.find(c => c.name === deleteCustomerTarget);
    if (match) await base44.entities.Customer.delete(match.id);
    setCustomers(prev => prev.filter(c => c.name !== deleteCustomerTarget));
    setDeleteCustomerTarget(null);
    if (selectedCustomer === deleteCustomerTarget) setSelectedCustomer(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const customerName = deleteTarget.customer?.trim();
    await base44.entities.SetupSheet.delete(deleteTarget.id);
    const remaining = sheets.filter(s => s.id !== deleteTarget.id);
    // Preserve the customer folder if this was the last sheet for that customer
    if (customerName) {
      const stillHasSheets = remaining.some(s => s.customer?.trim() === customerName);
      const alreadyInCustomers = customers.some(c => c.name === customerName);
      if (!stillHasSheets && !alreadyInCustomers) {
        const newCustomer = await base44.entities.Customer.create({ name: customerName });
        setCustomers(prev => [...prev, newCustomer]);
      }
    }
    setSheets(remaining);
    setDeleteTarget(null);
  };

  const handleCreated = (sheet) => {
    navigate(`/sheet/${sheet.id}`);
  };

  const switchNav = (nav) => {
    setActiveNav(nav);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setSearch("");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-background text-foreground flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-white/10 bg-background">
          <img
            src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/815a07707_BlackwithSPILettering1.svg"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => switchNav("dashboard")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "dashboard" ? "bg-primary text-white" : "text-slate-800 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
          </button>
          <button
            onClick={() => switchNav("customers")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "customers" ? "bg-primary text-white" : "text-slate-800 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Users className="w-4 h-4 shrink-0" /> Customers
          </button>
          <button
            onClick={() => setShowNewDialog(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <FilePlus className="w-4 h-4 shrink-0" /> New Setup Sheet
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate("/employee-management")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                              <Users className="w-4 h-4 shrink-0" /> Employees
            </button>
          )}
          <button
            onClick={() => { localStorage.removeItem("employeeSession"); navigate("/employee-login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900 transition-colors mt-2"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">

          {activeNav === "customers" ? (
            selectedCustomer ? (
              /* Customer drill-down */
              <div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
                </button>
                <h2 className="text-2xl font-bold text-foreground mb-5">{selectedCustomer}</h2>
                {(grouped[selectedCustomer] || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sheets for this customer yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(grouped[selectedCustomer] || []).map(sheet => (
                      <SheetCard key={sheet.id} sheet={sheet} onOpen={id => navigate(`/sheet/${id}`)} onDelete={setDeleteTarget} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Customers list */
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                    <p className="text-sm text-muted-foreground mt-1">Organize setup sheets by customer folders</p>
                  </div>
                  <Button onClick={() => setShowAddCustomerDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Customer
                  </Button>
                </div>
                <div className="relative mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search customers..."
                    className="pl-9 h-10 text-sm bg-card border-border"
                  />
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading…</div>
                ) : sortedCustomers.filter(c => c.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground text-sm">No customers found.</p>
                ) : (
                  <div className="space-y-3">
                    {sortedCustomers
                      .filter(c => c.toLowerCase().includes(customerSearch.toLowerCase()))
                      .map(customer => (
                        <div key={customer} className="relative group/folder flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 hover:shadow-md hover:border-primary/30 transition-all">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="flex items-center gap-4 flex-1 min-w-0 text-left"
                          >
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                              <FolderOpen className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-foreground">{customer}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm text-muted-foreground">
                                {grouped[customer].length} {grouped[customer].length === 1 ? "sheet" : "sheets"}
                              </span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </button>
                          <button
                            onClick={() => setDeleteCustomerTarget(customer)}
                            className="opacity-0 group-hover/folder:opacity-100 p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-all shrink-0"
                            title="Delete customer folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          ) : (
            /* Dashboard view */
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Setup Sheets</h1>
                  <p className="text-sm text-muted-foreground mt-1">Manage and organize your machine shop setup documentation</p>
                </div>
                <Button onClick={() => setShowNewDialog(true)} className="gap-2">
                  <FilePlus className="w-4 h-4" /> New Setup Sheet
                </Button>
              </div>
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by part #, customer, job #, or machine..."
                    className="pl-9 h-10 text-sm bg-card border-border"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="h-10 px-3 text-sm bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Repeating">Repeating</option>
                  <option value="One Time">One Time</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading…</div>
              ) : sheets.length === 0 ? (
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
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No results found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map(sheet => (
                    <SheetCard key={sheet.id} sheet={sheet} onOpen={id => navigate(`/sheet/${id}`)} onDelete={setDeleteTarget} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showNewDialog && (
        <NewSheetDialog onClose={() => setShowNewDialog(false)} onCreate={handleCreated} existingCustomers={allCustomerNames} />
      )}

      {showAddCustomerDialog && (
        <AddCustomerDialog
          onClose={() => setShowAddCustomerDialog(false)}
          onAdded={(name) => {
            setCustomers(prev => [...prev, { name }]);
            setShowAddCustomerDialog(false);
          }}
        />
      )}

      <AlertDialog open={!!deleteCustomerTarget} onOpenChange={(open) => !open && setDeleteCustomerTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the folder for <strong>{deleteCustomerTarget}</strong>? This will only remove the folder — existing setup sheets won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Setup Sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.part_number || "this sheet"}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}