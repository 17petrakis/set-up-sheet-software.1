import { base44 } from "@/api/base44Client";

/**
 * Fetches the admin login code from the Setting entity and compares it
 * to the supplied password. Returns true if they match (case-insensitive).
 */
export async function verifyAdminPassword(password) {
  const rows = await base44.entities.Setting.filter({ key: "login_code" });
  const code = (rows && rows[0] && rows[0].value) || "SUS";
  return password.trim().toUpperCase() === code.toUpperCase();
}