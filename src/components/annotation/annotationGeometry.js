let _annSeq = 0;
export function newAnnId() {
  return `ann-${Date.now()}-${_annSeq++}`;
}

export function rotatePt(px, py, cx, cy, deg) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const dx = px - cx, dy = py - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

export function getCenter(ann) {
  if (ann.type === "line" || ann.type === "arrow") {
    return { x: (ann.x1 + ann.x2) / 2, y: (ann.y1 + ann.y2) / 2 };
  }
  if (ann.type === "pen") {
    if (!ann.points || ann.points.length === 0) return { x: 0, y: 0 };
    let sx = 0, sy = 0;
    ann.points.forEach(p => { sx += p.x; sy += p.y; });
    return { x: sx / ann.points.length, y: sy / ann.points.length };
  }
  return { x: ann.x || 0, y: ann.y || 0 };
}

export function getBounds(ann) {
  if (ann.type === "line" || ann.type === "arrow") {
    return {
      x: Math.min(ann.x1, ann.x2),
      y: Math.min(ann.y1, ann.y2),
      width: Math.abs(ann.x2 - ann.x1),
      height: Math.abs(ann.y2 - ann.y1),
    };
  }
  if (ann.type === "pen") {
    if (!ann.points || ann.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    const xs = ann.points.map(p => p.x);
    const ys = ann.points.map(p => p.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }
  return {
    x: (ann.x || 0) - (ann.width || 0) / 2,
    y: (ann.y || 0) - (ann.height || 0) / 2,
    width: ann.width || 0,
    height: ann.height || 0,
  };
}

export function moveAnnotation(ann, dx, dy) {
  if (ann.type === "line" || ann.type === "arrow") {
    return { ...ann, x1: ann.x1 + dx, y1: ann.y1 + dy, x2: ann.x2 + dx, y2: ann.y2 + dy };
  }
  if (ann.type === "pen") {
    return { ...ann, points: (ann.points || []).map(p => ({ x: p.x + dx, y: p.y + dy })) };
  }
  return { ...ann, x: (ann.x || 0) + dx, y: (ann.y || 0) + dy };
}

export function resizeAnnotation(ann, handle, pos) {
  const center = getCenter(ann);
  const deg = ann.rotation || 0;
  const local = rotatePt(pos.x, pos.y, center.x, center.y, -deg);
  const b = getBounds(ann);
  let x = b.x, y = b.y, w = b.width, h = b.height;
  const MIN = 5;
  if (handle.includes("w")) {
    const right = x + w;
    x = Math.min(local.x, right - MIN);
    w = right - x;
  }
  if (handle.includes("e")) {
    w = Math.max(MIN, local.x - x);
  }
  if (handle.includes("n")) {
    const bottom = y + h;
    y = Math.min(local.y, bottom - MIN);
    h = bottom - y;
  }
  if (handle.includes("s")) {
    h = Math.max(MIN, local.y - y);
  }
  const newLocalCx = x + w / 2;
  const newLocalCy = y + h / 2;
  const newCenter = rotatePt(newLocalCx, newLocalCy, center.x, center.y, deg);
  return { ...ann, x: newCenter.x, y: newCenter.y, width: w, height: h };
}

export function convertShape(ann, newType) {
  if (ann.type === newType) return ann;
  const center = getCenter(ann);
  const b = getBounds(ann);
  const base = {
    id: ann.id,
    type: newType,
    stroke: ann.stroke,
    fill: ann.fill || "transparent",
    strokeWidth: ann.strokeWidth,
    rotation: 0,
  };
  if (newType === "line" || newType === "arrow") {
    const halfW = Math.max(b.width / 2, 20);
    const halfH = Math.max(b.height / 2, 20);
    return { ...base, x1: center.x - halfW, y1: center.y - halfH, x2: center.x + halfW, y2: center.y + halfH };
  }
  return { ...base, x: center.x, y: center.y, width: Math.max(b.width, 40), height: Math.max(b.height, 30) };
}