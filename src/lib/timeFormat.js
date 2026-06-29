// Parse a time string to total seconds.
// "MM:SS" → minutes*60 + seconds
// Plain number → treated as seconds
// "" or invalid → 0
export function parseTimeToSeconds(val) {
  if (!val) return 0;
  const s = String(val).trim();
  if (s.includes(":")) {
    const parts = s.split(":");
    const min = parseInt(parts[0]) || 0;
    const sec = parseFloat(parts[1]) || 0;
    return min * 60 + sec;
  }
  // Plain number → treated as minutes (backward compat with old data)
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n * 60;
}

// Format total seconds as "MM:SS"
export function formatSecondsToTime(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return "";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}