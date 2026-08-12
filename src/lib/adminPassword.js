/**
 * Verifies the admin unlock password against the admin employee ID
 * used to log in as admin (currently ADMIN001SUS).
 */
export async function verifyAdminPassword(password) {
  return password.trim().toUpperCase() === "ADMIN001SUS";
}