import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FilePlus, FolderOpen, ChevronRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import NewCMMSheetDialog from "./NewCMMSheetDialog";
import AddCustomerDialog from "@/components/home/AddCustomerDialog";
import CMMFolderCard from "./CMMFolderCard";
import CMMFolderView from "./CMMFolderView";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CMMDashboardContent({ customers = [], onCustomersChange }) {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [openFolder, setOpenFolder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [newSheetDefaultCustomer, setNewSheetDefaultCustomer] = useState("");
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await base44.entities.CMMSheet.list("-updated_date", 200);
      setSheets(data);
      setLoading(false);

      // Open the CMM folder immediately when returning from a CMM sheet
      const params = new URLSearchParams(window.location.search);
      const cmmFolder = params.get("cmm_folder");
      const pn = params.get("pn");
      if (cmmFolder || pn) {
        const folderKey = cmmFolder || `legacy__${pn || ""}__${params.get("cu") || ""}`;
        const folderSheets = data.filter(s =>
          (cmmFolder && s.folder_id === cmmFolder) ||
          (!cmmFolder && s.part_number === pn)
        );
        if (folderSheets.length > 0) {
          const f = folderSheets[0];
          setOpenFolder({
            key: folderKey,
            partNumber: f.part_number || pn || "Unnamed",
            customer: f.customer || params.get("cu") || "",
            sheets: folderSheets,
          });
        }
        window.history.replaceState({}, "", "/?tab=quality_control");
      }
    })();
  }, []);

  const buildFolders = () => {
    const map = {};
    for (const sheet of sheets) {
      const key = sheet.folder_id || `legacy__${sheet.part_number}__${sheet.customer || ""}`;
      if (!map[key]) {
        map[key] = { key, partNumber: sheet.part_number || "Unnamed", customer: sheet.customer || "", sheets: [] };
      }
      map[key].sheets.push(sheet);
    }
    return Object.values(map);
  };

  const allFolders = buildFolders();

  // Build customer grouping from shared Customer entity + CMM folders
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

  const recentFolders = allFolders
    .map(f => ({ ...f, _last: Math.max(...f.sheets.map(s => new Date(s.updated_date || s.created_date || 0).getTime())) }))
    .sort((a, b) => b._last - a._last)
    .slice(0, 8);

  const handleCreated = (sheet) => {
    setSheets(prev => [sheet, ...prev]);
    if (newSheetDefaultCustomer) {
      // Created via "Add CMM Sheet for Customer" — keep user in the customer folder view
      // so the new part folder is visible immediately.
      setShowNewDialog(false);
      setNewSheetDefaultCustomer("");
    } else {
      navigate(`/cmm-sheet/${sheet.id}`);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerTarget) return;
    const match = customers.find(c => c.name === deleteCustomerTarget);
    if (match) await base44.entities.Customer.delete(match.id);
    if (onCustomersChange) onCustomersChange(prev => prev.filter(c => c.name !== deleteCustomerTarget));
    setDeleteCustomerTarget(null);
    if (selectedCustomer === deleteCustomerTarget) setSelectedCustomer(null);
  };

  const handleOpenFolder = (folder) => {
    setOpenFolder(folder);
  };

  if (openFolder) {
    return (
      <CMMFolderView
        folder={openFolder}
        onBack={() => setOpenFolder(null)}
        onSheetsChange={(updatedSheets) => {
          const oldIds = new Set(openFolder.sheets.map(s => s.id));
          setSheets(prev => [...prev.filter(s => !oldIds.has(s.id)), ...updatedSheets]);
          if (updatedSheets.length === 0) {
            setOpenFolder(null);
          } else {
            setOpenFolder(prev => ({ ...prev, sheets: updatedSheets }));
          }
        }}
      />
    );
  }

  if (selectedCustomer) {
    return (
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
            onClick={() => { setNewSheetDefaultCustomer(selectedCustomer); setShowNewDialog(true); }}
            className="gap-2"
          >
            <FilePlus className="w-4 h-4" /> Add CMM Sheet for Customer
          </Button>
        </div>
        {(grouped[selectedCustomer] || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No CMM sheets for this customer yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(grouped[selectedCustomer] || []).map(folder => (
              <CMMFolderCard
                key={folder.key}
                folder={folder}
                onOpen={handleOpenFolder}
              />
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteCustomerTarget} onOpenChange={(open) => !open && setDeleteCustomerTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteCustomerTarget}</strong>? This only removes the customer folder — existing CMM sheets won't be deleted.
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

        {showNewDialog && (
          <NewCMMSheetDialog
            onClose={() => { setShowNewDialog(false); setNewSheetDefaultCustomer(""); }}
            onCreate={handleCreated}
            existingCustomers={allCustomerNames}
            defaultCustomer={newSheetDefaultCustomer}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">CMM Setup Sheets</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 hidden sm:block">Quality control documentation for CMM measurements</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2">
          <FilePlus className="w-4 h-4" />
          <span className="hidden sm:inline">New CMM Sheet</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Recents — 8 most recent CMM sheets + part search */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest mb-3">Recents</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={partSearch}
            onChange={e => setPartSearch(e.target.value)}
            placeholder="Search part"
            className="pl-9 h-10 text-sm bg-card border-border"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Loading…</div>
        ) : partSearch.trim() ? (
          (() => {
            const q = partSearch.trim().toLowerCase();
            const matches = allFolders.filter(f =>
              f.partNumber.toLowerCase().includes(q) || f.customer.toLowerCase().includes(q)
            );
            if (matches.length === 0) return <p className="text-sm text-muted-foreground">No parts found.</p>;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {matches.map(folder => (
                  <CMMFolderCard
                    key={folder.key}
                    folder={folder}
                    onOpen={handleOpenFolder}
                  />
                ))}
              </div>
            );
          })()
        ) : recentFolders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No CMM setup sheets yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {recentFolders.map(folder => (
              <CMMFolderCard
                key={folder.key}
                folder={folder}
                onOpen={handleOpenFolder}
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
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="pl-9 h-10 text-sm bg-card border-border"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Loading…</div>
        ) : sortedCustomers.filter(c => c.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">No customers found.</p>
        ) : (
          <div className="space-y-3">
            {sortedCustomers
              .filter(c => c.toLowerCase().includes(search.toLowerCase()))
              .map(customer => {
                const folderCount = (grouped[customer] || []).length;
                return (
                  <div key={customer} className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 hover:shadow-md hover:border-emerald-400/40 transition-all">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex items-center gap-4 flex-1 min-w-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <FolderOpen className="w-5 h-5 text-emerald-600" />
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

      {showNewDialog && (
        <NewCMMSheetDialog
          onClose={() => { setShowNewDialog(false); setNewSheetDefaultCustomer(""); }}
          onCreate={handleCreated}
          existingCustomers={allCustomerNames}
          defaultCustomer={newSheetDefaultCustomer}
        />
      )}

      {showAddCustomerDialog && (
        <AddCustomerDialog
          onClose={() => setShowAddCustomerDialog(false)}
          onAdded={(name) => {
            if (onCustomersChange) onCustomersChange(prev => [...prev, { name }]);
            setShowAddCustomerDialog(false);
          }}
        />
      )}

    </div>
  );
}