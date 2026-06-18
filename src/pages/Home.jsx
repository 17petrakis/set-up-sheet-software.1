import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LayoutDashboard, Users, FilePlus, FileText, FolderOpen, ChevronRight, ArrowLeft, Plus, Trash2, LogOut, ChevronDown, BookOpen, Menu, ClipboardList } from "lucide-react";
import NewSheetDialog from "@/components/home/NewSheetDialog";
import AddCustomerDialog from "@/components/home/AddCustomerDialog";
import MobileNav from "@/components/home/MobileNav";
import PartFolderCard from "@/components/home/PartFolderCard";
import PartFolderView from "@/components/home/PartFolderView";
import CMMDashboardContent from "@/components/cmm/CMMDashboardContent";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const navigate = useNavigate();
  const PAGE_SIZE = 200;
  const [sheets, setSheets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openFolder, setOpenFolder] = useState(null); // { partNumber, customer }
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null); // { partNumber, customer, sheets }
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const session = JSON.parse(localStorage.getItem("employeeSession") || "null");
  const isAdmin = session?.isAdmin === true;

  useEffect(() => {
    if (!session) navigate("/employee-login");
    // Support ?tab=quality_control redirect from CMM sheet back button
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "quality_control") {
      setActiveNav("quality_control");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const load = async () => {
    setLoading(true);
    const [data, customerData] = await Promise.all([
      base44.entities.SetupSheet.list("-updated_date", PAGE_SIZE, 0),
      base44.entities.Customer.list("name", 200),
    ]);
    setSheets(data);
    setCustomers(customerData);
    setLoading(false);
    // Auto-open folder if ?folder= param present
    const params = new URLSearchParams(window.location.search);
    const folderId = params.get("folder");
    if (folderId) {
      const match = data.find(s => s.folder_id === folderId);
      if (match) {
        setOpenFolder({ partNumber: match.part_number || "Unnamed", customer: match.customer || "" });
        window.history.replaceState({}, "", "/");
      }
    }
  };

  useEffect(() => { load(); }, []);

  // Group sheets into part folders by folder_id (or fall back to part_number+customer for legacy sheets)
  const buildFolders = () => {
    const folderMap = {}; // key -> { partNumber, customer, sheets[] }

    for (const sheet of sheets) {
      const key = sheet.folder_id
        ? sheet.folder_id
        : `legacy__${sheet.part_number}__${sheet.customer || ""}`;

      if (!folderMap[key]) {
        folderMap[key] = {
          key,
          partNumber: sheet.part_number || "Unnamed",
          customer: sheet.customer || "",
          sheets: [],
        };
      }
      folderMap[key].sheets.push(sheet);
    }
    return Object.values(folderMap);
  };

  const allFolders = buildFolders();

  // Build customer grouping for customer view
  const grouped = {};
  for (const c of customers) {
    const name = c.name?.trim();
    if (name && !grouped[name]) grouped[name] = [];
  }
  for (const folder of allFolders) {
    const cust = folder.customer?.trim() || "No Customer";
    if (!grouped[cust]) grouped[cust] = [];
    grouped[cust].push(folder);
  }
  const sortedCustomers = Object.keys(grouped).sort((a, b) =>
    a === "No Customer" ? 1 : b === "No Customer" ? -1 : a.localeCompare(b)
  );
  const allCustomerNames = sortedCustomers.filter(c => c !== "No Customer");

  // Filtered folders for dashboard
  const filteredFolders = allFolders.filter(folder => {
    const searchMatch = !search.trim() ||
      folder.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
      folder.customer?.toLowerCase().includes(search.toLowerCase()) ||
      folder.sheets.some(s =>
        s.job_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.machine?.toLowerCase().includes(search.toLowerCase())
      );
    const primarySheet = folder.sheets.find(s => s.operation_number === 1) || folder.sheets[0];
    const statusMatch = statusFilter === "all" || primarySheet?.status === statusFilter;
    return searchMatch && statusMatch;
  });

  // Sort by customer then part number
  const sortedFolders = [...filteredFolders].sort((a, b) => {
    const cA = a.customer || "zzz";
    const cB = b.customer || "zzz";
    if (cA !== cB) return cA.localeCompare(cB);
    return a.partNumber.localeCompare(b.partNumber);
  });

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerTarget) return;
    const match = customers.find(c => c.name === deleteCustomerTarget);
    if (match) await base44.entities.Customer.delete(match.id);
    setCustomers(prev => prev.filter(c => c.name !== deleteCustomerTarget));
    setDeleteCustomerTarget(null);
    if (selectedCustomer === deleteCustomerTarget) setSelectedCustomer(null);
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    // Delete all sheets in the folder
    await Promise.all(deleteFolderTarget.sheets.map(s => base44.entities.SetupSheet.delete(s.id)));
    const deletedIds = new Set(deleteFolderTarget.sheets.map(s => s.id));
    setSheets(prev => prev.filter(s => !deletedIds.has(s.id)));
    setDeleteFolderTarget(null);
    if (openFolder?.partNumber === deleteFolderTarget.partNumber && openFolder?.customer === deleteFolderTarget.customer) {
      setOpenFolder(null);
    }
  };

  const handleCreated = (sheet) => {
    navigate(`/sheet/${sheet.id}`);
  };

  const switchNav = (nav) => {
    setActiveNav(nav);
    setSelectedCustomer(null);
    setOpenFolder(null);
    setCustomerSearch("");
    setSearch("");
  };

  // Get sheets for the open folder
  const openFolderSheets = openFolder
    ? sheets.filter(s => {
        const folder = allFolders.find(f => f.partNumber === openFolder.partNumber && f.customer === openFolder.customer);
        return folder?.sheets.some(fs => fs.id === s.id);
      })
    : [];

  const openFolderKey = openFolder
    ? allFolders.find(f => f.partNumber === openFolder.partNumber && f.customer === openFolder.customer)?.key
    : null;

  const openFolderSheetsResolved = openFolderKey
    ? (allFolders.find(f => f.key === openFolderKey)?.sheets || [])
    : [];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Nav Drawer */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activeNav={activeNav}
        onSwitchNav={switchNav}
        onNewSheet={() => setShowNewDialog(true)}
        isAdmin={isAdmin}
      />

      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 bg-background text-foreground flex-col shrink-0">
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
          {isAdmin && (
            <a
              href="https://straightline-precision-industries-procedures.base44.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <BookOpen className="w-4 h-4 shrink-0" /> Procedures
            </a>
          )}
          <button
            onClick={() => switchNav("quality_control")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "quality_control" ? "bg-emerald-600 text-white" : "text-slate-800 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <ClipboardList className="w-4 h-4 shrink-0" /> Quality Control
          </button>
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
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
          <button onClick={() => setMobileNavOpen(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <img
            src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/815a07707_BlackwithSPILettering1.svg"
            alt="Logo"
            className="h-7 w-auto object-contain"
          />
          <button onClick={() => setShowNewDialog(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <FilePlus className="w-5 h-5 text-foreground" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">

          {activeNav === "quality_control" ? (
            <CMMDashboardContent allCustomerNames={allCustomerNames} />
          ) : activeNav === "customers" ? (
            selectedCustomer && openFolder ? (
              /* Customer → Folder drill-down */
              <PartFolderView
                partNumber={openFolder.partNumber}
                customer={openFolder.customer}
                sheets={openFolderSheetsResolved}
                onBack={() => setOpenFolder(null)}
                onSheetsChange={(updated) => {
                  const folderIds = new Set(openFolderSheetsResolved.map(s => s.id));
                  setSheets(prev => {
                    const withoutFolder = prev.filter(s => !folderIds.has(s.id));
                    return [...withoutFolder, ...updated];
                  });
                }}
              />
            ) : selectedCustomer ? (
              /* Customer drill-down — shows part folders */
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
                    {(grouped[selectedCustomer] || []).map(folder => (
                      <PartFolderCard
                        key={folder.key}
                        partNumber={folder.partNumber}
                        customer={folder.customer}
                        sheets={folder.sheets}
                        onOpen={(pn, cust) => setOpenFolder({ partNumber: pn, customer: cust })}
                        onDelete={(pn, cust, sh) => setDeleteFolderTarget({ partNumber: pn, customer: cust, sheets: sh })}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Customers list */
              <div>
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Customers</h1>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 hidden sm:block">Organize setup sheets by customer folders</p>
                  </div>
                  <Button onClick={() => setShowAddCustomerDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Customer
                  </Button>
                </div>
                <div className="relative mb-4 md:mb-5">
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
                      .map(customer => {
                        const folderCount = (grouped[customer] || []).length;
                        return (
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
                                  {folderCount} {folderCount === 1 ? "part" : "parts"}
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
                        );
                      })}
                  </div>
                )}
              </div>
            )
          ) : openFolder ? (
            /* Part Folder drill-down */
            <PartFolderView
              partNumber={openFolder.partNumber}
              customer={openFolder.customer}
              sheets={openFolderSheetsResolved}
              onBack={() => setOpenFolder(null)}
              onSheetsChange={(updated) => {
                const folderIds = new Set(openFolderSheetsResolved.map(s => s.id));
                setSheets(prev => {
                  const withoutFolder = prev.filter(s => !folderIds.has(s.id));
                  return [...withoutFolder, ...updated];
                });
              }}
            />
          ) : (
            /* Dashboard — shows part folders */
            <div>
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Setup Sheets</h1>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 hidden sm:block">Manage and organize your machine shop setup documentation</p>
                </div>
                <Button onClick={() => setShowNewDialog(true)} className="gap-2 hidden md:flex">
                  <FilePlus className="w-4 h-4" /> New Setup Sheet
                </Button>
              </div>
              <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
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
              ) : allFolders.length === 0 ? (
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
              ) : sortedFolders.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No results found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {sortedFolders.map(folder => (
                    <PartFolderCard
                      key={folder.key}
                      partNumber={folder.partNumber}
                      customer={folder.customer}
                      sheets={folder.sheets}
                      onOpen={(pn, cust) => setOpenFolder({ partNumber: pn, customer: cust })}
                      onDelete={(pn, cust, sh) => setDeleteFolderTarget({ partNumber: pn, customer: cust, sheets: sh })}
                    />
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

      <AlertDialog open={!!deleteFolderTarget} onOpenChange={(open) => !open && setDeleteFolderTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteFolderTarget?.partNumber}</strong> and all its operations ({deleteFolderTarget?.sheets.length})? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}