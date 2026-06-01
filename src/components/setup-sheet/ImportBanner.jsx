import React from "react";
import { AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ImportBanner({ message, onClose }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{message}</span>
          <button onClick={onClose} className="shrink-0 hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}