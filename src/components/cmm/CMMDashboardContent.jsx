import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FilePlus, ClipboardList } from "lucide-react";
import NewCMMSheetDialog from "./NewCMMSheetDialog";
import CMMFolderCard from "./CMMFolderCard";
import CMMFolderView from "./CMMFolderView";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CMMDashboardContent({ allCustomerNames = [] }) {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openFolder, setOpenFolder] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await base44.entities.CMMSheet.list("-updated_date", 200);
      setSheets(data);
      setLoading(false);
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

  const filteredFolders = [...allFolders]
    .filter(f =>
      !search.trim() ||
      f.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
      f.customer?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const cA = a.customer || "zzz";
      const cB = b.customer || "zzz";
      if (cA !== cB) return cA.localeCompare(cB);
      return a.partNumber.localeCompare(b.partNumber);
    });

  const handleCreated = (sheet) => {
    navigate(`/cmm-sheet/${sheet.id}`);
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    await Promise.all(deleteFolderTarget.sheets.map(s => base44.entities.CMMSheet.delete(s.id)));
    const deletedIds = new Set(deleteFolderTarget.sheets.map(s => s.id));
    setSheets(prev => prev.filter(s => !deletedIds.has(s.id)));
    if (openFolder?.key === deleteFolderTarget.key) setOpenFolder(null);
    setDeleteFolderTarget(null);
  };

  const handleOpenFolder = (folder) => {
    if (folder.sheets.length === 1) {
      navigate(`/cmm-sheet/${folder.sheets[0].id}`);
    } else {
      setOpenFolder(folder);
    }
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

  return (
    <div>
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">CMM Setup Sheets</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 hidden sm:block">Quality control documentation for CMM measurements</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2">
          <FilePlus className="w-4 h-4" />
          <span className="hidden sm:inline">New CMM Sheet</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by part #, customer..."
          className="pl-9 h-10 text-sm bg-card border-border"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading…</div>
      ) : allFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No CMM setup sheets yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first CMM setup sheet to get started.</p>
          </div>
          <Button size="sm" onClick={() => setShowNewDialog(true)} className="gap-1.5">
            <FilePlus className="w-3.5 h-3.5" /> New CMM Sheet
          </Button>
        </div>
      ) : filteredFolders.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No results found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {filteredFolders.map(folder => (
            <CMMFolderCard
              key={folder.key}
              folder={folder}
              onOpen={handleOpenFolder}
              onDelete={f => setDeleteFolderTarget(f)}
            />
          ))}
        </div>
      )}

      {showNewDialog && (
        <NewCMMSheetDialog
          onClose={() => setShowNewDialog(false)}
          onCreate={handleCreated}
          existingCustomers={allCustomerNames}
        />
      )}

      <AlertDialog open={!!deleteFolderTarget} onOpenChange={(open) => !open && setDeleteFolderTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete CMM Part Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteFolderTarget?.partNumber}</strong> and all its CMM sheets ({deleteFolderTarget?.sheets.length})? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive hover:bg-destructive/90 text-white">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}