import React from "react";
import ViewPhoto from "./ViewPhoto";

/**
 * Read-only process steps (used by view mode and the print layout).
 */
export default function ProcessStepsView({ steps }) {
  const list = (steps || []).filter(s => s && (s.title || s.description || (s.media || []).length));
  if (list.length === 0) return null;

  return (
    <div className="space-y-3">
      {list.map((step, i) => (
        <div key={i} className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white text-[10px] font-bold shrink-0">
              {i + 1}
            </span>
            <p className="text-sm font-bold text-gray-900">{step.title || `Step ${i + 1}`}</p>
          </div>
          {step.description && (
            <p className="text-xs text-gray-800 whitespace-pre-wrap">{step.description}</p>
          )}
          {(step.media || []).length > 0 && (
            <div className="space-y-3 mt-2">
              {(step.media || []).map((m, mi) => (
                m.type === "video" ? (
                  <video
                    key={mi}
                    src={m.url}
                    controls
                    className="w-full rounded-lg border border-gray-200 bg-black"
                    style={{ maxHeight: "420px" }}
                  />
                ) : (
                  <ViewPhoto
                    key={mi}
                    url={m.url}
                    annotations={m.annotations}
                    className="w-full rounded-lg border border-gray-200 object-contain bg-gray-50"
                    style={{ maxHeight: "500px" }}
                  />
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}