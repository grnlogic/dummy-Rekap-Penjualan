/**
 * Utility functions untuk handling autentikasi dan redirect
 */

/**
 * Redirect ke halaman login
 * Membersihkan token dan data user sebelum redirect
 */
export const redirectToLogin = (reason?: string) => {
  if (typeof window === "undefined") return;

  // Log reason jika ada
  if (reason) {
    console.log(`🚨 [AuthUtils] Redirecting to login: ${reason}`);
  } else {
    console.log("🚨 [AuthUtils] Redirecting to login");
  }

  // Bersihkan storage
  try {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("sessionId");
  } catch (error) {
    console.warn("❌ [AuthUtils] Error clearing storage:", error);
  }

  // Avoid redirect loop
  if (!window.location.pathname.includes('/auth/login')) {
    window.location.href = "/auth/login";
  }
};

/**
 * Cek apakah token valid ada
 */
export const hasValidToken = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("currentUser");

    return !!(
      token && 
      userData && 
      token !== "null" && 
      token !== "undefined" &&
      userData !== "null" &&
      userData !== "undefined"
    );
  } catch (error) {
    console.warn("❌ [AuthUtils] Error checking token:", error);
    return false;
  }
};

/**
 * Cek token dan redirect jika tidak valid
 */
export const checkTokenOrRedirect = (reason?: string): boolean => {
  const isValid = hasValidToken();
  
  if (!isValid) {
    redirectToLogin(reason || "Invalid or missing token");
    return false;
  }
  
  return true;
};

/**
 * Force logout dan redirect ke login
 */
export const forceLogout = (reason?: string) => {
  console.log(`🚪 [AuthUtils] Force logout: ${reason || "Manual logout"}`);
  
  // Clear storage
  try {
    localStorage.clear(); // Clear all localStorage
  } catch (error) {
    console.warn("❌ [AuthUtils] Error clearing storage:", error);
  }

  // Redirect
  redirectToLogin(reason);
};

/**
 * Setup listener untuk auto-redirect jika token dihapus
 */
export const setupTokenWatcher = () => {
  if (typeof window === "undefined") return;

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "authToken") {
      if (!e.newValue || e.newValue === "null" || e.newValue === "undefined") {
        redirectToLogin("Token removed from storage");
      }
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // Return cleanup function
  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
};

export default {
  redirectToLogin,
  hasValidToken,
  checkTokenOrRedirect,
  forceLogout,
  setupTokenWatcher,
};
