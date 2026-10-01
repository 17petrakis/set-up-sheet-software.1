import { base44 } from "@/api/base44Client";

// The shop-floor session is only ever read from this module's verified cache.
// Nothing in the app trusts a raw localStorage value: on startup the stored
// token is checked by the server (employeeAuth), and only a server-confirmed
// session is handed out. A session blob written by hand in the browser is
// rejected, so admin rights cannot be forged.

const KEY = "employeeSession";

let verifiedSession = null;
let initPromise = null;

async function invoke(payload) {
  const res = await base44.functions.invoke("employeeAuth", payload);
  return res?.data || {};
}

export async function initEmployeeSession() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      stored = null;
    }

    const token = stored?.token;
    if (!token) {
      localStorage.removeItem(KEY);
      verifiedSession = null;
      return null;
    }

    try {
      const data = await invoke({ action: "verify", token });
      if (data?.valid) {
        verifiedSession = {
          employeeNumber: data.employeeNumber,
          name: data.name || "",
          isAdmin: data.isAdmin === true,
          token,
        };
        localStorage.setItem(KEY, JSON.stringify(verifiedSession));
      } else {
        verifiedSession = null;
        localStorage.removeItem(KEY);
      }
    } catch (e) {
      // Could not reach the server — stay signed out rather than trusting the
      // stored value, but keep it so a later load can verify it.
      verifiedSession = null;
    }

    return verifiedSession;
  })();

  return initPromise;
}

export function getEmployeeSession() {
  return verifiedSession;
}

export async function employeeLogin(entered) {
  const data = await invoke({ action: "login", entered });
  if (!data?.token) {
    return { error: data?.error || "Invalid employee number or code." };
  }
  verifiedSession = {
    employeeNumber: data.employeeNumber,
    name: data.name || "",
    isAdmin: data.isAdmin === true,
    token: data.token,
  };
  localStorage.setItem(KEY, JSON.stringify(verifiedSession));
  return { session: verifiedSession };
}

export function clearEmployeeSession() {
  verifiedSession = null;
  initPromise = null;
  localStorage.removeItem(KEY);
}

export async function verifyAdminPassword(password) {
  const token = verifiedSession?.token;
  if (!token) return false;
  try {
    const data = await invoke({ action: "adminUnlock", token, password });
    return data?.ok === true;
  } catch (e) {
    return false;
  }
}

async function invokeAdmin(payload) {
  const token = verifiedSession?.token;
  if (!token) throw new Error("Not signed in");
  return invoke({ ...payload, token });
}

export async function getLoginCode() {
  const data = await invokeAdmin({ action: "getLoginCode" });
  return data?.code || "";
}

export async function setLoginCode(code) {
  const data = await invokeAdmin({ action: "setLoginCode", code });
  return data?.code || "";
}

export async function listEmployees() {
  const data = await invokeAdmin({ action: "listEmployees" });
  return data?.employees || [];
}

export async function createEmployee(data) {
  const res = await invokeAdmin({ action: "createEmployee", data });
  return res?.employee;
}

export async function updateEmployee(id, data) {
  const res = await invokeAdmin({ action: "updateEmployee", id, data });
  return res?.employee;
}

export async function deleteEmployee(id) {
  await invokeAdmin({ action: "deleteEmployee", id });
  return true;
}