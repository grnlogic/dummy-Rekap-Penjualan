"use client";

import { useEffect } from "react";
import { authService } from "../services/authService";

/**
 * Hook untuk memastikan user memiliki token valid
 * Akan otomatis redirect ke login jika token tidak ada atau tidak valid
 */
export const useTokenGuard = () => {
  useEffect(() => {
    const checkToken = () => {
      try {
        // Skip jika di halaman login
        if (typeof window !== "undefined" && window.location.pathname.includes('/auth/login')) {
          return;
        }

        // Cek token dari localStorage
        const token = localStorage.getItem("authToken");
        const userData = localStorage.getItem("currentUser");

        // Redirect jika tidak ada token atau data user
        if (!token || !userData || token === "null" || token === "undefined") {
          console.log("🚨 [TokenGuard] No valid token found, redirecting to login");
          window.location.href = "/auth/login";
          return;
        }

        // Cek dengan authService
        const isAuth = authService.isAuthenticated();
        if (!isAuth) {
          console.log("🚨 [TokenGuard] Authentication failed, redirecting to login");
          window.location.href = "/auth/login";
          return;
        }

        console.log("✅ [TokenGuard] Token valid");
      } catch (error) {
        console.error("❌ [TokenGuard] Error checking token:", error);
        if (typeof window !== "undefined" && !window.location.pathname.includes('/auth/login')) {
          window.location.href = "/auth/login";
        }
      }
    };

    // Check immediately
    checkToken();

    // Setup interval untuk check token secara berkala
    const interval = setInterval(checkToken, 60000); // Check setiap 1 menit

    // Setup listener untuk storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken" && (!e.newValue || e.newValue === "null")) {
        console.log("🚨 [TokenGuard] Token removed from storage, redirecting to login");
        window.location.href = "/auth/login";
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, []);
};

export default useTokenGuard;
