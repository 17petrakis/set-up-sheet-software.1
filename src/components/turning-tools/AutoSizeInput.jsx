import React, { useLayoutEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

let _ctx = null;
function measureCtx() {
  if (!_ctx) _ctx = document.createElement("canvas").getContext("2d");
  return _ctx;
}

/**
 * AutoSizeInput — a text input that grows/shrinks to fit its content
 * (value or placeholder) on a single line, in every browser.
 *
 * Instead of relying on `field-sizing` (unsupported in some browsers) or a
 * mirroring <span> (which can mismatch the input's real padding/font), this
 * measures the input's OWN computed font, padding and border with a canvas
 * and sets its width to exactly fit the text. Whatever the input actually
 * renders, the measurement matches.
 */
export default function AutoSizeInput({ value, onChange, placeholder = "", inputClass = "", minWidth = "3rem", className = "", ...props }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const ctx = measureCtx();
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

    let text = value || placeholder || "";
    if (cs.textTransform === "uppercase") text = text.toUpperCase();
    else if (cs.textTransform === "lowercase") text = text.toLowerCase();

    const textW = ctx.measureText(text).width;
    const letterSpacing = parseFloat(cs.letterSpacing) || 0;
    const totalTextW = textW + letterSpacing * text.length;

    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const borderX = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
    const needed = cs.boxSizing === "border-box" ? totalTextW + padX + borderX : totalTextW;

    el.style.width = `${Math.max(needed, 0)}px`;
  }, [value, placeholder, inputClass, className]);

  return (
    <Input
      ref={ref}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputClass} ${className}`}
      style={{ minWidth }}
      {...props}
    />
  );
}