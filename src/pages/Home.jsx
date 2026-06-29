import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LayoutDashboard, Users, FilePlus, FolderOpen, ChevronRight, ArrowLeft, Plus, Trash2, LogOut, BookOpen, Menu, ClipboardList, ArrowLeftCircle } from "lucide-react";
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
    // Open the part folder immediately when returning from a setup sheet,
    // so the dashboard doesn't flash before the folder loads.
    const folderId = params.get("folder");
    if (folderId) {
      setOpenFolder({
        partNumber: params.get("pn") || "Unnamed",
        customer: params.get("cu") || "",
        folderId,
      });
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

  // Most recent 8 part folders (by latest updated sheet in each folder)
  const recentFolders = allFolders
    .map(f => ({ ...f, _last: Math.max(...f.sheets.map(s => new Date(s.updated_date || s.created_date || 0).getTime())) }))
    .sort((a, b) => b._last - a._last)
    .slice(0, 8);

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
  const openFolderSheetsResolved = openFolder
    ? (allFolders.find(f =>
        (openFolder.folderId && f.key === openFolder.folderId) ||
        (f.partNumber === openFolder.partNumber && f.customer === openFolder.customer)
      )?.sheets || [])
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
          {isAdmin && (
            <a
              href="https://straightline-precision-industries-procedures.base44.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" /> Procedures
            </a>
          )}
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
            <CMMDashboardContent customers={customers} onCustomersChange={setCustomers} />
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
          ) : selectedCustomer ? (
            /* Customer drill-down (within dashboard) — shows part folders + delete customer */
            <div>
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <Button
                  onClick={() => setDeleteCustomerTarget(selectedCustomer)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Customer
                </Button>
              </div>
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
            /* Dashboard — Recents + Customers */
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

              {/* Recents — recent setup sheets + part search */}
              <section className="mb-8">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-widest mb-3">Recents</h2>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search parts..."
                    className="pl-9 h-10 text-sm bg-card border-border"
                  />
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Loading…</div>
                ) : search.trim() ? (
                  (() => {
                    const q = search.trim().toLowerCase();
                    const matches = allFolders.filter(f =>
                      f.partNumber.toLowerCase().includes(q) || f.customer.toLowerCase().includes(q)
                    );
                    if (matches.length === 0) return <p className="text-sm text-muted-foreground">No parts found.</p>;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {matches.map(folder => (
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
                    );
                  })()
                ) : recentFolders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No setup sheets yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {recentFolders.map(folder => (
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
              </section>

              {/* Customers — list of customer files */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Customers</h2>
                  <Button onClick={() => setShowAddCustomerDialog(true)} variant="outline" size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Customer
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
                  <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Loading…</div>
                ) : sortedCustomers.filter(c => c.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground text-sm">No customers found.</p>
                ) : (
                  <div className="space-y-3">
                    {sortedCustomers
                      .filter(c => c.toLowerCase().includes(customerSearch.toLowerCase()))
                      .map(customer => {
                        const folderCount = (grouped[customer] || []).length;
                        return (
                          <div key={customer} className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 hover:shadow-md hover:border-primary/30 transition-all">
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
                          </div>
                        );
                      })}
                  </div>
                )}
              </section>
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
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteCustomerTarget}</strong>? This only removes the customer folder — existing setup sheets won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete Customer
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