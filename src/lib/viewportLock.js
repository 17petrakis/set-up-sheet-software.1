// Keeps the mobile viewport fixed: no pinch zoom, no double-tap zoom and no
// sideways drift — the page only scrolls up and down. Photos opt back in
// through the photo viewer, which zooms itself.
export default function lockViewport() {
  if (typeof document === "undefined") return;

  const block = (event) => event.preventDefault();
  const options = { passive: false };

  // iOS Safari ignores user-scalable=no, so stop the pinch gesture directly.
  ["gesturestart", "gesturechange", "gestureend"].forEach((name) =>
    document.addEventListener(name, block, options),
  );

  // Two fingers on the page is a pinch — never let it zoom or shift the page.
  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    },
    options,
  );

  // Double tap / double click zoom.
  document.addEventListener("dblclick", block, options);
}