import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Plus, Search } from "lucide-react";
import CustomerFolder from "@/components/home/CustomerFolder";
import NewSheetDialog from "@/components/home/NewSheetDialog";

export default function Home() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.SetupSheet.list("-updated_date", 200);
    setSheets(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = search.trim()
    ? sheets.filter(s =>
        s.part_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.customer?.toLowerCase().includes(search.toLowerCase()) ||
        s.job_number?.toLowerCase().includes(search.toLowerCase())
      )
    : sheets;

  // Group by customer
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
    setSheets(prev => prev.filter(s => s.id !== id));
  };

  const handleCreated = (sheet) => {
    navigate(`/sheet/${sheet.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/a3c66a29e_BlackwithSPILettering1.svg"
              alt="Straightline Precision Industries"
              className="h-10 w-auto object-contain"
            />
          </div>
          <Button size="sm" onClick={() => setShowNewDialog(true)} className="h-8 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Sheet
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by part number, customer, or job…"
            className="pl-9 h-9 text-sm"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading…</div>
        ) : sheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <FolderOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No setup sheets yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first setup sheet to get started.</p>
            </div>
            <Button size="sm" onClick={() => setShowNewDialog(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Sheet
            </Button>
          </div>
        ) : sortedCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No results found.</div>
        ) : (
          <div className="space-y-3">
            {sortedCustomers.map(customer => (
              <CustomerFolder
                key={customer}
                customer={customer}
                sheets={grouped[customer]}
                onOpen={id => navigate(`/sheet/${id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showNewDialog && (
        <NewSheetDialog onClose={() => setShowNewDialog(false)} onCreate={handleCreated} />
      )}
    </div>
  );
}