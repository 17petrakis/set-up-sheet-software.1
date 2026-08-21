import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FilePlus, BookOpen, LogOut, X, ClipboardList, ArrowLeft, Wrench, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav({ open, onClose, activeNav, onSwitchNav, onNewSheet, isAdmin }) {
  const navigate = useNavigate();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Drawer */}
      <div className="w-64 bg-background border-r border-border flex flex-col h-full shadow-xl">
        <div className="px-4 py-5 border-b border-border flex items-center justify-between">
          <img
            src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/815a07707_BlackwithSPILettering1.svg"
            alt="Logo"
            className="h-8 w-auto object-contain"
          />
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => { onSwitchNav("dashboard"); onClose(); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "dashboard" ? "bg-primary text-white" : "text-slate-800 hover:bg-slate-100"
            )}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
          </button>
          <button
            onClick={() => { onNewSheet(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <FilePlus className="w-4 h-4 shrink-0" /> New Setup Sheet
          </button>
          {isAdmin && (
            <button
              onClick={() => { navigate("/employee-management"); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Users className="w-4 h-4 shrink-0" /> Employees
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { navigate("/inventory"); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Boxes className="w-4 h-4 shrink-0" /> Inventory
            </button>
          )}
          <button
            onClick={() => { onSwitchNav("quality_control"); onClose(); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeNav === "quality_control" ? "bg-emerald-600 text-white" : "text-slate-800 hover:bg-slate-100"
            )}
          >
            <ClipboardList className="w-4 h-4 shrink-0" /> Quality Control
          </button>
          <button
            onClick={() => { navigate("/machine-tool-lists"); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Wrench className="w-4 h-4 shrink-0" /> Machine Tool Lists
          </button>
          <a
            href="https://straightline-precision-industries-procedures.base44.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <BookOpen className="w-4 h-4 shrink-0" /> Procedures
          </a>
          <button
            onClick={() => { localStorage.removeItem("employeeSession"); navigate("/employee-login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors mt-2"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Logout
          </button>
        </nav>
      </div>
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
}