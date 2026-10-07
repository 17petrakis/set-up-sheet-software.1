// File links on a setup sheet live on the record itself, and any signed-in user
// can write to that record, so a link is untrusted until it has been checked.
// Only the platform's own file storage may be embedded, and only a real .pdf
// path may be handed to the document viewer — everything else is shown as an
// ordinary image, or refused, but never as markup inside the app's page.
const STORAGE_HOSTS = ["base44.app", "media.base44.com"];

export function safeStorageUrl(url) {
  if (!url || typeof url !== "string") return "";
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return "";
  }
  if (parsed.protocol !== "https:") return "";
  const host = parsed.hostname.toLowerCase();
  const onStorageHost = STORAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  return onStorageHost ? parsed.href : "";
}

export function isPdfUrl(url) {
  try {
    return /\.pdf$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}