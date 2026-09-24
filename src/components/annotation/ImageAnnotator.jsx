import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MousePointer2, ArrowRight, Minus, Square, Circle, Type, Pencil,
  Undo2, Redo2, Trash2, X, Check, ChevronDown,
} from "lucide-react";
import AnnotationRenderer from "./AnnotationRenderer";
import TextEditorOverlay from "./TextEditorOverlay";
import { convertShape } from "./annotationGeometry";

const TOOLS = [
  { id: "select", label: "Select", Icon: MousePointer2 },
  { id: "arrow", label: "Arrow", Icon: ArrowRight },
  { id: "line", label: "Line", Icon: Minus },
  { id: "rectangle", label: "Rect", Icon: Square },
  { id: "ellipse", label: "Ellipse", Icon: Circle },
  { id: "text", label: "Text", Icon: Type },
  { id: "pen", label: "Draw", Icon: Pencil },
];

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#000000", "#ffffff"];
const STROKE_WIDTHS = [
  { label: "XS", value: 2 },
  { label: "S", value: 4 },
  { label: "M", value: 8 },
  { label: "L", value: 16 },
  { label: "XL", value: 32 },
];
const FONT_SIZES = [
  { label: "XS", value: 12 },
  { label: "S", value: 18 },
  { label: "M", value: 28 },
  { label: "L", value: 42 },
  { label: "XL", value: 60 },
];
const CONVERTIBLE = ["rectangle", "ellipse", "line", "arrow"];

export default function ImageAnnotator({ imageUrl, initialAnnotations = [], onSave, onCancel }) {
  const [tool, setTool] = useState("arrow");
  const [defaultStyle, setDefaultStyle] = useState({ stroke: "#ef4444", fill: "transparent", strokeWidth: 4, fontSize: 28 });
  const [annotations, setAnnotations] = useState(initialAnnotations || []);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [loadError, setLoadError] = useState(false);
  const [showFillDropdown, setShowFillDropdown] = useState(false);
  const [showConvertDropdown, setShowConvertDropdown] = useState(false);

  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Load image to get natural dimensions
  useEffect(() => {
    if (!imageUrl) return;
    setLoadError(false);
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setLoadError(true);
    img.src = imageUrl;
  }, [imageUrl]);

  // Compute display dimensions to fit container
  useEffect(() => {
    if (natural.w === 0 || !containerRef.current) return;
    const compute = () => {
      const c = containerRef.current;
      if (!c || natural.w === 0) return;
      const cw = c.clientWidth - 32;
      const ch = c.clientHeight - 32;
      const ratio = natural.w / natural.h;
      let dw = Math.min(cw, natural.w);
      let dh = dw / ratio;
      if (dh > ch) {
        dh = ch;
        dw = dh * ratio;
      }
      setDims({ w: Math.round(dw), h: Math.round(dh) });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [natural]);

  const scaleFactor = dims.w > 0 ? natural.w / dims.w : 1;

  const selected = annotations.find(a => a.id === selectedId);

  const activeStyle = selected
    ? {
        stroke: selected.stroke,
        fill: selected.fill,
        strokeWidth: (selected.strokeWidth || 4) / scaleFactor,
        fontSize: (selected.fontSize || 28) / scaleFactor,
      }
    : defaultStyle;

  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev, annotations]);
    setFuture([]);
  }, [annotations]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setFuture(f => [annotations, ...f]);
      setAnnotations(last);
      setSelectedId(null);
      return prev.slice(0, -1);
    });
  }, [annotations]);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const first = prev[0];
      setHistory(h => [...h, annotations]);
      setAnnotations(first);
      setSelectedId(null);
      return prev.slice(1);
    });
  }, [annotations]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    pushHistory();
    setAnnotations(prev => prev.filter(a => a.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, pushHistory]);

  const clearAll = useCallback(() => {
    if (annotations.length === 0) return;
    pushHistory();
    setAnnotations([]);
    setSelectedId(null);
  }, [annotations, pushHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (editingTextId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) { e.preventDefault(); deleteSelected(); }
      } else if (e.key === "Escape") {
        setSelectedId(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, editingTextId, deleteSelected, undo, redo]);

  const handleAnnotationsChange = (updater) => {
    if (typeof updater === "function") setAnnotations(updater);
    else setAnnotations(updater);
  };

  const handleBeginAction = () => {
    setHistory(prev => [...prev, annotations]);
    setFuture([]);
  };

  const handleTextEdit = (id) => {
    setEditingTextId(id);
    setSelectedId(id);
  };

  const handleTextChange = (text) => {
    if (!editingTextId) return;
    setAnnotations(prev => prev.map(a => a.id === editingTextId ? { ...a, text } : a));
  };

  const updateSelectedStyle = (patch) => {
    if (selected) {
      pushHistory();
      setAnnotations(prev => prev.map(a => a.id === selectedId ? { ...a, ...patch } : a));
    } else {
      setDefaultStyle(prev => ({ ...prev, ...patch }));
    }
  };

  const handleConvert = (newType) => {
    if (!selected || !CONVERTIBLE.includes(selected.type)) return;
    pushHistory();
    setAnnotations(prev => prev.map(a => a.id === selectedId ? convertShape(a, newType) : a));
    setShowConvertDropdown(false);
  };

  const handleSave = () => {
    onSave(annotations);
  };

  const isTextTool = tool === "text";
  const canConvert = selected && CONVERTIBLE.includes(selected.type);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onClick={e => e.stopPropagation()}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-black/80 border-b border-white/10 shrink-0 flex-wrap">
        {/* Tool buttons */}
        <div className="flex items-center gap-0.5 bg-white/10 rounded-lg p-1">
          {TOOLS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { setTool(id); setSelectedId(null); }}
              title={label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tool === id ? "bg-blue-500 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Shape converter */}
        {canConvert && (
          <div className="relative">
            <button
              onClick={() => setShowConvertDropdown(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-white/70 hover:text-white hover:bg-white/10 bg-white/10"
            >
              Convert <ChevronDown className="w-3 h-3" />
            </button>
            {showConvertDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[100px]">
                {CONVERTIBLE.map(t => (
                  <button
                    key={t}
                    onClick={() => handleConvert(t)}
                    className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 ${selected.type === t ? "text-blue-600 font-semibold" : "text-gray-700"}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stroke color */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => updateSelectedStyle({ stroke: c })}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${activeStyle.stroke === c ? "border-white scale-110" : "border-white/30"}`}
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>

        {/* Fill color (rect/ellipse only) */}
        {(tool === "rectangle" || tool === "ellipse" || (selected && (selected.type === "rectangle" || selected.type === "ellipse"))) && (
          <div className="relative">
            <button
              onClick={() => setShowFillDropdown(v => !v)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-white/70 hover:text-white hover:bg-white/10 bg-white/10"
              title="Fill color"
            >
              <div className="w-4 h-4 rounded border border-white/30" style={{ background: activeStyle.fill === "transparent" ? "transparent" : activeStyle.fill }} />
              Fill
            </button>
            {showFillDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-10">
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => { updateSelectedStyle({ fill: "transparent" }); setShowFillDropdown(false); }}
                    className={`w-7 h-7 rounded border-2 ${activeStyle.fill === "transparent" ? "border-blue-500" : "border-gray-300"}`}
                    style={{ background: "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 10px 10px" }}
                    title="No fill"
                  />
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => { updateSelectedStyle({ fill: c }); setShowFillDropdown(false); }}
                      className={`w-7 h-7 rounded border-2 ${activeStyle.fill === c ? "border-blue-500" : "border-gray-300"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stroke width (non-text) */}
        {!isTextTool && (
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            {STROKE_WIDTHS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => updateSelectedStyle({ strokeWidth: value })}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${activeStyle.strokeWidth === value ? "bg-blue-500 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                title={`${label} (${value}px)`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Font size (text only) */}
        {isTextTool && (
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            {FONT_SIZES.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => updateSelectedStyle({ fontSize: value })}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${activeStyle.fontSize === value ? "bg-blue-500 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                title={`${label} (${value}px)`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Undo/Redo/Clear/Delete */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button onClick={undo} disabled={history.length === 0} title="Undo" className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30">
            <Undo2 className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Undo</span>
          </button>
          <button onClick={redo} disabled={future.length === 0} title="Redo" className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30">
            <Redo2 className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Redo</span>
          </button>
          <button onClick={clearAll} disabled={annotations.length === 0} title="Clear all" className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-white/70 hover:text-red-400 hover:bg-white/10 transition-colors disabled:opacity-30">
            <Trash2 className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Clear</span>
          </button>
          <button onClick={deleteSelected} disabled={!selectedId} title="Delete selected" className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-white/70 hover:text-red-400 hover:bg-white/10 transition-colors disabled:opacity-30">
            <X className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Delete</span>
          </button>
        </div>

        <div className="w-px h-6 bg-white/10 mx-0.5" />

        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-green-600 hover:bg-green-500 text-white transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Save
        </button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden p-4 relative">
        {loadError ? (
          <p className="text-white/50 text-sm">Failed to load image.</p>
        ) : dims.w > 0 ? (
          <div className="relative" style={{ width: dims.w, height: dims.h }}>
            <img
              src={imageUrl}
              alt="Annotating"
              className="absolute inset-0 w-full h-full object-contain rounded-lg"
              style={{ pointerEvents: "none", userSelect: "none" }}
              draggable={false}
            />
            <AnnotationRenderer
              annotations={annotations}
              selectedId={selectedId}
              tool={tool}
              width={dims.w}
              height={dims.h}
              naturalWidth={natural.w}
              naturalHeight={natural.h}
              currentStyle={defaultStyle}
              svgRef={svgRef}
              onAnnotationsChange={handleAnnotationsChange}
              onBeginAction={handleBeginAction}
              onSelect={setSelectedId}
              onTextEdit={handleTextEdit}
            />
            {editingTextId && (
              <TextEditorOverlay
                ann={annotations.find(a => a.id === editingTextId)}
                svgRef={svgRef}
                naturalWidth={natural.w}
                naturalHeight={natural.h}
                onChange={handleTextChange}
                onClose={() => setEditingTextId(null)}
              />
            )}
          </div>
        ) : (
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        )}
      </div>

      <p className="text-center text-xs text-white/30 pb-2 px-4">
        {tool === "select" ? "Click to select • Drag to move • Double-click text to edit" : `Click and drag to draw ${tool}`}
      </p>
    </div>
  );
}