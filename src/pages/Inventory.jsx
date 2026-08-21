import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Boxes } from "lucide-react";
import { INVENTORY_SECTIONS, useInventoryItems } from "@/lib/inventory";
import InventorySection from "@/components/inventory/InventorySection";

export default function Inventory() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(null);
  const items = useInventoryItems();

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("employeeSession") || "null");
    if (!session?.isAdmin) {
      navigate("/employee-login");
    } else {
      setAuthed(true);
    }
  }, []);

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Boxes className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Inventory</h1>
            <p className="text-xs text-muted-foreground">Manage the machines, tooling, and equipment available across all setup sheets.</p>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {INVENTORY_SECTIONS.map(section => (
            <InventorySection key={section.id} section={section} items={items} />
          ))}
        </div>
      </main>
    </div>
  );
}