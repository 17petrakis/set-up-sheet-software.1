import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Guard against accidentally leaving a page while work is still saving.
 *
 * - The in-app back button calls `requestLeave({ type: "path", to })`.
 * - The browser / hardware back button is intercepted: a duplicate history entry
 *   parks the page on its own URL, so the first back press can be turned into a prompt.
 * - Closing or reloading the tab triggers the browser's own leave warning.
 *
 * When `enabled` is false (e.g. read-only view) leaving is allowed straight away —
 * the back button keeps working, it just doesn't ask.
 */
export default function useLeaveGuard({ enabled }) {
  const navigate = useNavigate();
  const [promptOpen, setPromptOpen] = useState(false);
  const pendingNav = useRef(null);
  const allowNextPop = useRef(false);
  const pageHref = useRef(window.location.href);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Actually perform the navigation the user asked for.
  const leaveNow = useCallback(() => {
    const nav = pendingNav.current;
    pendingNav.current = null;
    setPromptOpen(false);
    if (!nav) return;

    if (nav.type === "history") {
      // Step past our duplicate entry, back to the real previous page.
      allowNextPop.current = true;
      const here = window.location.pathname + window.location.search;
      window.history.go(-2);
      window.setTimeout(() => {
        // Nothing to go back to (page opened directly) — fall back to the dashboard.
        if (window.location.pathname + window.location.search === here) {
          navigate("/", { replace: true });
        }
      }, 400);
      return;
    }
    navigate(nav.to);
  }, [navigate]);

  const requestLeave = useCallback((nav) => {
    if (!enabledRef.current) {
      if (nav.type === "history") window.history.back();
      else navigate(nav.to);
      return;
    }
    pendingNav.current = nav;
    setPromptOpen(true);
  }, [navigate]);

  const cancelLeave = useCallback(() => {
    pendingNav.current = null;
    setPromptOpen(false);
  }, []);

  const requestLeaveRef = useRef(requestLeave);
  useEffect(() => { requestLeaveRef.current = requestLeave; }, [requestLeave]);

  // Browser / hardware back button.
  useEffect(() => {
    pageHref.current = window.location.href;
    window.history.pushState({ leaveGuard: true }, "", pageHref.current);

    const onPop = () => {
      if (allowNextPop.current) {
        allowNextPop.current = false;
        return;
      }
      // The back press landed on our duplicate entry. Going nowhere is safe here
      // only while guarding is on — otherwise carry on leaving the page.
      if (!enabledRef.current) {
        allowNextPop.current = true;
        window.history.go(-1);
        return;
      }
      window.history.pushState({ leaveGuard: true }, "", pageHref.current);
      requestLeaveRef.current({ type: "history" });
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Closing or reloading the tab.
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);

  return { promptOpen, requestLeave, cancelLeave, leaveNow };
}