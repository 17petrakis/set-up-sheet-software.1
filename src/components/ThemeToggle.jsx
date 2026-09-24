import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-7 w-14 items-center rounded-full border border-border bg-muted transition-colors shrink-0",
        className
      )}
    >
      <Sun className={cn("absolute left-1.5 w-3.5 h-3.5 transition-opacity", isDark ? "opacity-40" : "opacity-0")} />
      <Moon className={cn("absolute right-1.5 w-3.5 h-3.5 transition-opacity", isDark ? "opacity-0" : "opacity-40")} />
      <span
        className={cn(
          "absolute flex h-5 w-5 items-center justify-center rounded-full shadow-md transition-all duration-200",
          isDark ? "translate-x-7 bg-slate-900" : "translate-x-1 bg-white"
        )}
      >
        {isDark ? <Moon className="w-3 h-3 text-blue-300" /> : <Sun className="w-3 h-3 text-amber-500" />}
      </span>
    </button>
  );
}