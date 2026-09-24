import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LayoutDashboard, Users, FilePlus, FolderOpen, ChevronRight, ArrowLeft, Plus, Trash2, LogOut, BookOpen, Menu, ClipboardList, ArrowLeftCircle, Wrench, Bell } from "lucide-react";
import NewSheetDialog from "@/components/home/NewSheetDialog";
import NewCMMSheetDialog from "@/components/cmm/NewCMMSheetDialog";
import AddCustomerDialog from "@/components/home/AddCustomerDialog";
import MobileNav from "@/components/home/MobileNav";
import PartFolderCard from "@/components/home/PartFolderCard";
import PartFolderView from "@/components/home/PartFolderView";
import CMMDashboardContent from "@/components/cmm/CMMDashboardContent";
import MachineToolListsContent from "@/components/machine-tools/MachineToolListsContent";
import DuplicatePartDialog from "@/components/home/DuplicatePartDialog";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function Home() {
  const navigate = useNavigate();
  const PAGE_SIZE = 200;
  const [sheets, setSheets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showNewCMMDialog, setShowNewCMMDialog] = useState(false);
  const [newSheetAllowCMM, setNewSheetAllowCMM] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [newSheetDefaultCustomer, setNewSheetDefaultCustomer] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [customerSearch, setCustomerSearch] = useState("");
  const [groupingMode, setGroupingMode] = useState("customer");
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineTools, setMachineTools] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openFolder, setOpenFolder] = useState(null); // { partNumber, customer }
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);
  const [duplicateFolderTarget, setDuplicateFolderTarget] = useState(null);

  const session = JSON.parse(localStorage.getItem("employeeSession") || "null");
  const isAdmin = session?.isAdmin === true;

  useEffect(() => {
    if (!session) navigate("/employee-login");
    // Support ?tab=quality_control redirect from CMM sheet back button
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "quality_control") {
      setActiveNav("quality_control");
      // Don't strip URL here — CMMDashboardContent reads cmm_folder/pn/cu params itself
    }
    // Open the part folder immediately when returning from a setup sheet,
    // so the dashboard doesn't flash before the folder loads.
    // Skip for quality_control tab — CMM params (cmm_folder/pn/cu) are handled by CMMDashboardContent.
    if (params.get("tab") !== "quality_control") {
      const folderId = params.get("folder");
      const pn = params.get("pn");
      if (folderId || pn) {
        setOpenFolder({
          partNumber: pn || "Unnamed",
          customer: params.get("cu") || "",
          folderId: folderId || undefined,
        });
        window.history.replaceState({}, "", "/");
      }
    }
  }, []);

  const load = async () => {
    setLoading(true);
    const [data, customerData, mtData] = await Promise.all([
      base44.entities.SetupSheet.list("-updated_date", PAGE_SIZE, 0),
      base44.entities.Customer.list("name", 200),
      base44.entities.MachineTool.list("machine_name", 200),
    ]);
    setSheets(data);
    setCustomers(customerData);
    setMachineTools(mtData);
    setLoading(false);
    if (isAdmin) {
     try {
       const requests = await base44.entities.AccessRequest.filter({ status: "pending" });
       setPendingRequests(requests || []);
       if (requests && requests.length > 0) setShowRequestsModal(true);
     } catch (e) {
       setPendingRequests([]);
     }
    } else if (session?.employeeNumber) {
     try {
       const approved = await base44.entities.AccessRequest.filter({
         employee_number: session.employeeNumber,
         status: "approved",
       });
       const unnotified = (approved || []).filter(r => !r.employee_notified);
       if (unnotified.length > 0) {
         setApprovedRequests(unnotified);
         setShowApprovedModal(true);
       }
     } catch (e) {
       // ignore
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

  // Build machine grouping for machine view
  const machineGrouped = {};
  for (const mt of machineTools) {
    const name = mt.machine_name?.trim();
    if (name && !machineGrouped[name]) machineGrouped[name] = [];
  }
  for (const folder of allFolders) {
    for (const sheet of folder.sheets) {
      const mach = sheet.machine?.trim();
      if (mach) {
        if (!machineGrouped[mach]) machineGrouped[mach] = [];
        if (!machineGrouped[mach].some(f => f.key === folder.key)) {
          machineGrouped[mach].push(folder);
        }
      }
    }
  }
  const sortedMachines = Object.keys(machineGrouped).sort((a, b) => a.localeCompare(b));

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

  const handleCreated = (sheet) => {
    navigate(`/sheet/${sheet.id}?mode=edit`);
  };

  const handleCMMCreated = (sheet) => {
    navigate(`/cmm-sheet/${sheet.id}`);
  };

  const handleDeleteFolderFromCard = async () => {
    if (!deleteFolderTarget) return;
    await Promise.all(deleteFolderTarget.sheets.map(s => base44.entities.SetupSheet.delete(s.id)));
    setSheets(prev => prev.filter(s => !deleteFolderTarget.sheets.some(fs => fs.id === s.id)));
    setDeleteFolderTarget(null);
  };

  const handleDuplicateFolder = async ({ partNumber, revision, customer }) => {
    const folder = duplicateFolderTarget;
    if (!folder) return;
    const newFolderId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    const sortKey = (s) => s.sort_order ?? new Date(s.created_date).getTime() ?? 0;
    const sourceSheets = [...folder.sheets].sort((a, b) => sortKey(a) - sortKey(b));
    const now = Date.now();
    const newSheets = await Promise.all(sourceSheets.map((s, i) => {
      const { id, created_date, updated_date, created_by_id, ...rest } = s;
      return base44.entities.SetupSheet.create({
        ...rest,
        part_number: partNumber,
        revision: revision || s.revision,
        customer: customer,
        folder_id: newFolderId,
        sort_order: now + i,
        published: false,
      });
    }));
    setSheets(prev => [...prev, ...newSheets]);
    setDuplicateFolderTarget(null);
    setOpenFolder({ partNumber, customer, folderId: newFolderId });
  };

  const switchNav = (nav) => {
    setActiveNav(nav);
    setSelectedCustomer(null);
    setSelectedMachine(null);
    setOpenFolder(null);
    setCustomerSearch("");
    setSearch("");
    // Record the active tab in the URL so the browser back button returns to
    // the same tab (Home remounts on back and reads this param on mount).
    const params = new URLSearchParams();
    if (nav !== "dashboard") params.set("tab", nav);
    const qs = params.toString();
    window.history.replaceState({}, "", qs ? `/?${qs}` : "/");
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
        onNewSheet={() => { setNewSheetAllowCMM(true); setShowNewDialog(true); }}
        isAdmin={isAdmin}
      />

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex w-56 bg-background text-foreground flex-col shrink-0">
        <button onClick={() => switchNav("dashboard")} className="px-4 py-5 border-b border-white/10 bg-background w-full text-left">
          <img
            src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/815a07707_BlackwithSPILettering1.svg"
            alt="Logo"
            className="h-10 w-auto object-contain dark:invert"
          />
        </button>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => switchNav("dashboard")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "dashboard" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
          </button>
          <button
            onClick={() => { setNewSheetAllowCMM(true); setShowNewDialog(true); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <FilePlus className="w-4 h-4 shrink-0" /> New Setup Sheet
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate("/employee-management")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <div className="relative">
                <Users className="w-4 h-4 shrink-0" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              Employees
              {pendingRequests.length > 0 && (
                <span className="ml-auto text-xs font-semibold text-red-500">{pendingRequests.length}</span>
              )}
            </button>
          )}
          <button
            onClick={() => switchNav("quality_control")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "quality_control" ? "bg-emerald-600 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ClipboardList className="w-4 h-4 shrink-0" /> Quality Control
          </button>
          <button
            onClick={() => switchNav("machine_tool_lists")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "machine_tool_lists" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Wrench className="w-4 h-4 shrink-0" /> Machine Tool Lists
          </button>
          <a
            href="https://straightline-precision-industries-procedures.base44.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <BookOpen className="w-4 h-4 shrink-0" /> Procedures
          </a>
          <button
            onClick={() => { localStorage.removeItem("employeeSession"); navigate("/employee-login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-2"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
          <button onClick={() => setMobileNavOpen(true)} className="p-2.5 -ml-2.5 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <button onClick={() => switchNav("dashboard")}>
            <img
              src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/815a07707_BlackwithSPILettering1.svg"
              alt="Logo"
              className="h-7 w-auto object-contain dark:invert"
            />
          </button>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button onClick={() => { setNewSheetAllowCMM(true); activeNav === "quality_control" ? setShowNewCMMDialog(true) : setShowNewDialog(true); }} className="p-2.5 -mr-2.5 rounded-lg hover:bg-muted transition-colors">
              <FilePlus className="w-6 h-6 text-foreground" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">

          {activeNav === "quality_control" ? (
            <CMMDashboardContent customers={customers} onCustomersChange={setCustomers} />
          ) : activeNav === "machine_tool_lists" ? (
            <MachineToolListsContent />
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
          ) : selectedMachine ? (
            /* Machine drill-down — shows part folders for selected machine */
            <div>
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => setSelectedMachine(null)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <Button
                  onClick={() => { setNewSheetAllowCMM(false); setShowNewDialog(true); }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <FilePlus className="w-4 h-4" /> Add Setup Sheet
                </Button>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-5">{selectedMachine}</h2>
              {(machineGrouped[selectedMachine] || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No sheets for this machine yet.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {(machineGrouped[selectedMachine] || []).map(folder => (
                    <PartFolderCard
                      key={folder.key}
                      partNumber={folder.partNumber}
                      customer={folder.customer}
                      sheets={folder.sheets}
                      onOpen={(pn, cust) => setOpenFolder({ partNumber: pn, customer: cust })}
                      onDelete={(f) => setDeleteFolderTarget(f)}
                      onDuplicate={(f) => setDuplicateFolderTarget(f)}
                    />
                  ))}
                </div>
              )}
            </div>
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
              <div className="mb-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setNewSheetDefaultCustomer(selectedCustomer); setNewSheetAllowCMM(false); setShowNewDialog(true); }}
                  className="gap-2"
                >
                  <FilePlus className="w-4 h-4" /> Add Setup Sheet for Customer
                </Button>
              </div>
              {(grouped[selectedCustomer] || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No sheets for this customer yet.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {(grouped[selectedCustomer] || []).map(folder => (
                    <PartFolderCard
                      key={folder.key}
                      partNumber={folder.partNumber}
                      customer={folder.customer}
                      sheets={folder.sheets}
                      onOpen={(pn, cust) => setOpenFolder({ partNumber: pn, customer: cust })}
                      onDelete={(f) => setDeleteFolderTarget(f)}
                      onDuplicate={(f) => setDuplicateFolderTarget(f)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Dashboard — Recents + Customers */
            <div>
              {isAdmin && pendingRequests.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900">
                      {pendingRequests.length} access request{pendingRequests.length !== 1 ? "s" : ""} pending
                    </p>
                    <p className="text-xs text-amber-700 truncate">
                      {pendingRequests[0]?.employee_name || pendingRequests[0]?.employee_number} requested to edit {pendingRequests[0]?.part_number}
                      {pendingRequests.length > 1 && ` and ${pendingRequests.length - 1} more`}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setShowRequestsModal(true)} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0">
                    View Requests
                  </Button>
                </div>
              )}
              <div className="flex items-start justify-between mb-4 lg:mb-6">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-foreground">Setup Sheets</h1>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 hidden lg:block">Manage and organize your machine shop setup documentation</p>
                </div>
                <div className="hidden lg:flex items-center gap-3">
                  <ThemeToggle />
                  <Button onClick={() => { setNewSheetAllowCMM(true); setShowNewDialog(true); }} className="gap-2">
                    <FilePlus className="w-4 h-4" /> New Setup Sheet
                  </Button>
                </div>
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
                      f.partNumber.toLowerCase().includes(q) ||
                      f.customer.toLowerCase().includes(q) ||
                      f.sheets.some(s => (s.machine || "").toLowerCase().includes(q))
                    );
                    if (matches.length === 0) return <p className="text-sm text-muted-foreground">No parts found.</p>;
                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {matches.map(folder => (
                          <PartFolderCard
                            key={folder.key}
                            partNumber={folder.partNumber}
                            customer={folder.customer}
                            sheets={folder.sheets}
                            onOpen={(pn, cust) => setOpenFolder({ partNumber: pn, customer: cust })}
                            onDelete={(f) => setDeleteFolderTarget(f)}
                            onDuplicate={(f) => setDuplicateFolderTarget(f)}
                          />
                        ))}
                      </div>
                    );
                  })()
                ) : recentFolders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No setup sheets yet.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {recentFolders.map(folder => (
                      <PartFolderCard
                        key={folder.key}
                        partNumber={folder.partNumber}
                        customer={folder.customer}
                        sheets={folder.sheets}
                        onOpen={(pn, cust) => setOpenFolder({ partNumber: pn, customer: cust })}
                        onDelete={(f) => setDeleteFolderTarget(f)}
                        onDuplicate={(f) => setDuplicateFolderTarget(f)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Customers / Machines — toggle between customer and machine grouping */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
                      {groupingMode === "customer" ? "Customers" : "Machines"}
                    </h2>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={groupingMode === "customer"}
                          onCheckedChange={() => { setGroupingMode("customer"); setSelectedMachine(null); }}
                        />
                        <span className="text-xs font-medium">Customer</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={groupingMode === "machine"}
                          onCheckedChange={() => { setGroupingMode("machine"); setSelectedCustomer(null); }}
                        />
                        <span className="text-xs font-medium">Machine</span>
                      </label>
                    </div>
                  </div>
                  {groupingMode === "customer" && (
                    <Button onClick={() => setShowAddCustomerDialog(true)} variant="outline" size="sm" className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Customer
                    </Button>
                  )}
                </div>
                <div className="relative mb-4 md:mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder={groupingMode === "customer" ? "Search customers..." : "Search machines..."}
                    className="pl-9 h-10 text-sm bg-card border-border"
                  />
                </div>
                {groupingMode === "customer" ? (
                  loading ? (
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
                  )
                ) : (
                  loading ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Loading…</div>
                  ) : sortedMachines.filter(m => m.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground text-sm">No machines found.</p>
                  ) : (
                    <div className="space-y-3">
                      {sortedMachines
                        .filter(m => m.toLowerCase().includes(customerSearch.toLowerCase()))
                        .map(machine => {
                          const folderCount = (machineGrouped[machine] || []).length;
                          return (
                            <div key={machine} className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 hover:shadow-md hover:border-primary/30 transition-all">
                              <button
                                onClick={() => setSelectedMachine(machine)}
                                className="flex items-center gap-4 flex-1 min-w-0 text-left"
                              >
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                  <Wrench className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-foreground">{machine}</p>
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
                  )
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {showNewDialog && (
        <NewSheetDialog
          onClose={() => { setShowNewDialog(false); setNewSheetDefaultCustomer(""); setNewSheetAllowCMM(false); }}
          onCreate={handleCreated}
          onCreateCMM={handleCMMCreated}
          existingCustomers={allCustomerNames}
          defaultCustomer={newSheetDefaultCustomer}
          existingSheets={sheets}
          allowCMM={newSheetAllowCMM}
        />
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

      {showNewCMMDialog && (
        <NewCMMSheetDialog
          onClose={() => setShowNewCMMDialog(false)}
          onCreate={(sheet) => {
            setShowNewCMMDialog(false);
            navigate(`/cmm-sheet/${sheet.id}`);
          }}
          existingCustomers={allCustomerNames}
        />
      )}

      <AlertDialog open={showApprovedModal} onOpenChange={async (open) => {
        setShowApprovedModal(open);
        if (!open) {
          await Promise.all(approvedRequests.map(r =>
            base44.entities.AccessRequest.update(r.id, { employee_notified: true })
          ));
          setApprovedRequests([]);
        }
      }}>
        <AlertDialogContent className="max-w-sm text-center">
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <img
                src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/4f83c4ced_image.png"
                alt="Approved"
                className="max-h-64 rounded-lg"
              />
            </div>
            <AlertDialogTitle className="text-center text-2xl">Approved!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              {approvedRequests.length === 1
                ? `Part number ${approvedRequests[0]?.part_number} is now unlocked.`
                : `${approvedRequests.length} parts are now unlocked.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex justify-center w-full">
              <AlertDialogAction>Got it</AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRequestsModal} onOpenChange={setShowRequestsModal}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <img
                src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/ae6c345d0_image.png"
                alt="Access Request"
                className="max-h-56 rounded-lg"
              />
            </div>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              Access Requests
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending requests.</p>
                ) : pendingRequests.map((req, i) => (
                  <div key={req.id || i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-amber-900 truncate">
                        {req.employee_name || req.employee_number || "Unknown"}
                      </p>
                      <p className="text-xs text-amber-700 truncate">Part: {req.part_number}</p>
                    </div>
                    <span className="text-xs font-medium text-amber-600 capitalize shrink-0 ml-2">{req.status}</span>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowRequestsModal(false); navigate("/employee-management"); }}>
              Go to Employee Management
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogTitle>Delete Part?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteFolderTarget?.partNumber}</strong> and all its operations ({deleteFolderTarget?.sheets?.length})? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolderFromCard} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {duplicateFolderTarget && (
        <DuplicatePartDialog
          sourcePartNumber={duplicateFolderTarget.partNumber}
          sourceCustomer={duplicateFolderTarget.customer}
          customers={allCustomerNames}
          onClose={() => setDuplicateFolderTarget(null)}
          onDuplicate={handleDuplicateFolder}
        />
      )}

    </div>
  );
}