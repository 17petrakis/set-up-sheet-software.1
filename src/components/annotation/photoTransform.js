import { getBounds } from "./annotationGeometry";

// Rotation only happens in 90° steps, so the photo is never resampled twice and
// the markup can be carried over exactly.

export function rotatedSize(w, h, rotation) {
  const deg = ((rotation % 360) + 360) % 360;
  return deg % 180 === 0 ? { w, h } : { w: h, h: w };
}

// Move every annotation into the newly rotated frame so the markup keeps sitting
// exactly where it was drawn on the photo.
export function rotateAnnotations(annotations, frameW, frameH, clockwise) {
  const map = (x, y) => (clockwise
    ? { x: frameH - y, y: x }
    : { x: y, y: frameW - x });

  return (annotations || []).map((a) => {
    if (a.type === "line" || a.type === "arrow") {
      const p1 = map(a.x1, a.y1);
      const p2 = map(a.x2, a.y2);
      return { ...a, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    if (a.type === "pen") {
      return { ...a, points: (a.points || []).map((p) => map(p.x, p.y)) };
    }
    const c = map(a.x || 0, a.y || 0);
    if (a.type === "text") {
      // Labels stay upright — sideways text can't be read on the shop floor.
      return { ...a, x: c.x, y: c.y };
    }
    return { ...a, x: c.x, y: c.y, rotation: ((a.rotation || 0) + (clockwise ? 90 : -90) + 360) % 360 };
  });
}

export function rotateRect(rect, frameW, frameH, clockwise) {
  if (!rect) return null;
  if (clockwise) {
    return { x: frameH - (rect.y + rect.h), y: rect.x, w: rect.h, h: rect.w };
  }
  return { x: rect.y, y: frameW - (rect.x + rect.w), w: rect.h, h: rect.w };
}

// Shift the markup into the cropped frame and drop whatever the crop cut away.
export function cropAnnotations(annotations, area) {
  const kept = [];
  (annotations || []).forEach((a) => {
    let shifted;
    if (a.type === "line" || a.type === "arrow") {
      shifted = { ...a, x1: a.x1 - area.x, y1: a.y1 - area.y, x2: a.x2 - area.x, y2: a.y2 - area.y };
    } else if (a.type === "pen") {
      shifted = { ...a, points: (a.points || []).map((p) => ({ x: p.x - area.x, y: p.y - area.y })) };
    } else {
      shifted = { ...a, x: (a.x || 0) - area.x, y: (a.y || 0) - area.y };
    }
    const b = getBounds(shifted);
    const visible = b.x + b.width >= 0 && b.y + b.height >= 0 && b.x <= area.w && b.y <= area.h;
    if (visible) kept.push(shifted);
  });
  return kept;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // The photo host allows this, so the canvas can export the result.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the photo"));
    img.src = src;
  });
}

// Draw the rotated and cropped photo into a new file. Only called when the photo
// actually changed, so an ordinary markup save uploads nothing.
export async function bakePhoto(url, rotation, crop) {
  const img = await loadImage(url);
  const base = { w: img.naturalWidth, h: img.naturalHeight };
  const rot = rotatedSize(base.w, base.h, rotation);
  const area = crop || { x: 0, y: 0, w: rot.w, h: rot.h };

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.w));
  canvas.height = Math.max(1, Math.round(area.h));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  ctx.translate(-area.x, -area.y);
  ctx.translate(rot.w / 2, rot.h / 2);
  ctx.rotate((((rotation % 360) + 360) % 360) * Math.PI / 180);
  ctx.drawImage(img, -base.w / 2, -base.h / 2);

  const type = /\.png(\?|$)/i.test(url) ? "image/png" : "image/jpeg";
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not write the photo"))), type, 0.92);
  });
  const ext = type === "image/png" ? "png" : "jpg";
  return new File([blob], `photo-${Date.now()}.${ext}`, { type });
}