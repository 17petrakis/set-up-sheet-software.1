import React from "react";
import { Input } from "@/components/ui/input";

/**
 * AutoSizeInput — a text input that grows/shrinks to fit its content
 * (value or placeholder) while staying on a single line.
 *
 * It works in all browsers by mirroring the text in a hidden <span> that
 * shares the same font, padding and border as the <Input>, so the span's
 * measured width drives the container size and the input fills it exactly.
 *
 * inputClass: styling classes (height, text size, padding, border, etc.)
 *            applied to BOTH the measuring span and the input so their
 *            box metrics match. Do NOT include width utilities here.
 * minWidth:  minimum width floor (default "3rem").
 * className: classes for the wrapper element (e.g. margins).
 */
export default function AutoSizeInput({ value, onChange, placeholder = "", inputClass = "", minWidth = "3rem", className = "", ...props }) {
  const text = value || placeholder || "";
  return (
    <div className={`relative inline-flex items-center ${className}`} style={{ minWidth }}>
      <span className={`invisible whitespace-pre border ${inputClass}`} aria-hidden>
        {text || " "}
      </span>
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`absolute inset-0 w-full ${inputClass}`}
        {...props}
      />
    </div>
  );
}