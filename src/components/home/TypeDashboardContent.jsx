import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FilePlus, FolderOpen, ChevronRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import PartFolderCard from "./PartFolderCard";
import PartFolderView from "./PartFolderView";
import NewSheetDialog from "./NewSheetDialog";
import AddCustomerDialog from "./AddCustomerDialog";
import DuplicatePartDialog from "./DuplicatePartDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RECENT_LIMIT = 8;
const PAGE_SIZE = 200;

const folderKeyOf = (sheet) => sheet.folder_id || `legacy__${sheet.part_number}__${sheet.customer || ""}`;

export default function TypeDashboardContent({ machineType, customers = [], onCustomersChange }) {
  const navigate = useNavigate();
  const [allSheets, setAllSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [openFolderKey, setOpenFolderKey] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [newSheetDefaultCustomer, setNewSheetDefaultCustomer] = useState("");
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);
  const [duplicateFolderTarget, setDuplicateFolderTarget] = useState(null);

  const isTurning = machineType === "turning";
  const label = isTurning ? "Turning" : "Milling";

  useEffect(() => {
    (async () => {
      const data = await base44.entities.SetupSheet.list("-updated_date", PAGE_SIZE, 0);
      setAllSheets(data);
      setLoading(false);
    })();
  }, []);

  // Only the setup sheets belonging to this machine type
  const sheets = allSheets.filter(s => (s.machine_type || "milling") === machineType);

  const buildFolders = () => {
    const map = {};
    for (const sheet of sheets) {
      const key = folderKeyOf(sheet);
      if (!map[key]) {
        map[key] = { key, partNumber: sheet.part_number || "Unnamed", customer: sheet.customer || "", sheets: [] };
      }
      map[key].sheets.push(sheet);
    }
    return Object.values(map);
  };

  const allFolders = buildFolders();

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
    .slice(0, RECENT_LIMIT);

  const openFolder = openFolderKey ? allFolders.find(f => f.key === openFolderKey) : null;

  const handleOpenFolder = (partNumber, customer) => {
    const folder = allFolders.find(f => f.partNumber === partNumber && f.customer === customer);
    if (folder) setOpenFolderKey(folder.key);
  };

  const handleCreated = (sheet) => {
    setShowNewDialog(false);
    setNewSheetDefaultCustomer("");
    setAllSheets(prev => [sheet, ...prev]);
    navigate(`/sheet/${sheet.id}?mode=edit`);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerTarget) return;
    const match = customers.find(c => c.name === deleteCustomerTarget);
    if (match) await base44.entities.Customer.delete(match.id);
    if (onCustomersChange) onCustomersChange(prev => prev.filter(c => c.name !== deleteCustomerTarget));
    setDeleteCustomerTarget(null);
    if (selectedCustomer === deleteCustomerTarget) setSelectedCustomer(null);
  };

  // Delete the whole part folder (every operation, regardless of type)
  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    const key = folderKeyOf(deleteFolderTarget.sheets[0]);
    const ids = allSheets.filter(s => folderKeyOf(s) === key).map(s => s.id);
    await Promise.all(ids.map(id => base44.entities.SetupSheet.delete(id)));
    setAllSheets(prev => prev.filter(s => folderKeyOf(s) !== key));
    setDeleteFolderTarget(null);
  };

  const handleDuplicateFolder = async ({ partNumber, revision, customer }) => {
    const folder = duplicateFolderTarget;
    if (!folder) return;
    const sourceKey = folderKeyOf(folder.sheets[0]);
    const sourceSheets = allSheets
      .filter(s => folderKeyOf(s) === sourceKey)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const newFolderId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now());
    const now = Date.now();
    const created = await Promise.all(sourceSheets.map((s, i) => {
      const { id, created_date, updated_date, created_by_id, ...rest } = s;
      return base44.entities.SetupSheet.create({
        ...rest,
        part_number: partNumber,
        revision: revision || s.revision,
        customer,
        folder_id: newFolderId,
        sort_order: now + i,
        published: false,
      });
    }));
    setAllSheets(prev => [...prev, ...created]);
    setDuplicateFolderTarget(null);
    setOpenFolderKey(newFolderId);
  };

  if (openFolder) {
    return (
      <PartFolderView
        partNumber={openFolder.partNumber}
        customer={openFolder.customer}
        sheets={openFolder.sheets}
        onBack={() => setOpenFolderKey(null)}
        onSheetsChange={(updated) => {
          const ids = new Set(openFolder.sheets.map(s => s.id));
          setAllSheets(prev => [...prev.filter(s => !ids.has(s.id)), ...updated]);
          if (updated.length === 0) setOpenFolderKey(null);
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
            <FilePlus className="w-4 h-4" /> Add {label} Sheet for Customer
          </Button>
        </div>
        {(grouped[selectedCustomer] || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No {label.toLowerCase()} setup sheets for this customer yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {(grouped[selectedCustomer] || []).map(folder => (
              <PartFolderCard
                key={folder.key}
                partNumber={folder.partNumber}
                customer={folder.customer}
                sheets={folder.sheets}
                onOpen={handleOpenFolder}
                onDelete={(f) => setDeleteFolderTarget(f)}
                onDuplicate={(f) => setDuplicateFolderTarget(f)}
              />
            ))}
          </div>
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

        {showNewDialog && (
          <NewSheetDialog
            onClose={() => { setShowNewDialog(false); setNewSheetDefaultCustomer(""); }}
            onCreate={handleCreated}
            existingCustomers={allCustomerNames}
            defaultCustomer={newSheetDefaultCustomer}
            existingSheets={sheets}
            defaultMachineType={machineType}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4 lg:mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">{label} Setup Sheets</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 hidden lg:block">
            All {label.toLowerCase()} setup sheets in one place
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2">
          <FilePlus className="w-4 h-4" />
          <span className="hidden lg:inline">New Setup Sheet</span>
          <span className="lg:hidden">New</span>
        </Button>
      </div>

      {/* Recents — most recent part folders of this type + part search */}
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
                    onOpen={handleOpenFolder}
                    onDelete={(f) => setDeleteFolderTarget(f)}
                    onDuplicate={(f) => setDuplicateFolderTarget(f)}
                  />
                ))}
              </div>
            );
          })()
        ) : recentFolders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {label.toLowerCase()} setup sheets yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {recentFolders.map(folder => (
              <PartFolderCard
                key={folder.key}
                partNumber={folder.partNumber}
                customer={folder.customer}
                sheets={folder.sheets}
                onOpen={handleOpenFolder}
                onDelete={(f) => setDeleteFolderTarget(f)}
                onDuplicate={(f) => setDuplicateFolderTarget(f)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Customers */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Customers</h2>
          <Button onClick={() => setShowAddCustomerDialog(true)} variant="outline" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Customer
          </Button>
        </div>
        <div className="relative mb-4 lg:mb-5">
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

      {showNewDialog && (
        <NewSheetDialog
          onClose={() => { setShowNewDialog(false); setNewSheetDefaultCustomer(""); }}
          onCreate={handleCreated}
          existingCustomers={allCustomerNames}
          defaultCustomer={newSheetDefaultCustomer}
          existingSheets={sheets}
          defaultMachineType={machineType}
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
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive hover:bg-destructive/90 text-white">
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