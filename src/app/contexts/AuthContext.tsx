"use client";

import { ENV } from "../config/env";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { authService } from "../services/authService";

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ DEBUG FUNCTION
  const debugLog = (message: string, data?: any) => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE !== "false") {
      console.log(`🔍 [AuthContext] ${message}`, data || "");
    }
  };

  // ✅ FUNGSI REFRESH AUTH YANG DIPERBAIKI (MODIFIED FOR DUMMY)
  const refreshAuth = async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("currentUser");

      if (token && userData) {
        try {
          // Accept any token in dummy mode
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (parseError) {
          debugLog("❌ Error parsing user data:", parseError);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/auth/login")
        ) {
          window.location.href = "/auth/login";
        }
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // ✅ AUTO REFRESH INTERVAL - HANYA JIKA ADA USER DAN TOKEN
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    // ✅ HANYA AKTIFKAN AUTO REFRESH JIKA USER SUDAH LOGIN
    if (typeof window !== "undefined" && user) {
      debugLog("🕐 Setting up auto refresh interval for user:", user.username);

      refreshInterval = setInterval(async () => {
        try {
          const currentToken = localStorage.getItem("authToken");

          if (!currentToken) {
            debugLog(
              "❌ No token found during auto refresh, redirecting to login",
            );
            // ✅ REDIRECT KE LOGIN JIKA TOKEN HILANG
            if (!window.location.pathname.includes("/auth/login")) {
              window.location.href = "/auth/login";
            }
            return;
          }

          debugLog("🔄 Auto refresh check...");

          // ✅ HANYA CEK TOKEN VALIDITY, JANGAN LANGSUNG LOGOUT
          const { authService } = await import("../services/authService");
          const isAuthenticated = authService.isAuthenticated();

          if (!isAuthenticated) {
            debugLog("⚠️ Token appears invalid during auto check");
            // Jangan langsung logout, biarkan user action yang trigger
          } else {
            debugLog("✅ Token still valid");
          }
        } catch (error) {
          debugLog("❌ Auto refresh error:", error);
        }
      }, 300000); // ✅ 5 menit (bukan 4 menit)
    }

    return () => {
      if (refreshInterval) {
        debugLog("🧹 Clearing auto refresh interval");
        clearInterval(refreshInterval);
      }
    };
  }, [user]); // ✅ DEPENDENCY PADA USER

  // ✅ INITIAL AUTH CHECK
  useEffect(() => {
    const checkAuth = async () => {
      try {
        debugLog("🚀 Initial auth check...");

        if (typeof window === "undefined") {
          debugLog("❌ Window undefined during initial check");
          return;
        }

        await refreshAuth();
      } catch (error) {
        debugLog("❌ Initial auth check error:", error);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []); // ✅ HANYA RUN SEKALI

  // ✅ SET HYDROGEN TRUE SETELAH COMPONENT MOUNT
  useEffect(() => {
    debugLog("💧 Setting hydration to true");
    setIsHydrated(true);
  }, []);

  // ✅ STORAGE CHANGE LISTENER
  useEffect(() => {
    if (!isHydrated) return;

    const handleStorageChange = (e: StorageEvent) => {
      debugLog("📦 Storage changed:", { key: e.key, newValue: !!e.newValue });

      if (e.key === "authToken" || e.key === "currentUser") {
        refreshAuth();
      }
    };

    const handleAuthChange = () => {
      debugLog("🔄 Auth changed event received");
      refreshAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChanged", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, [isHydrated]);

  const login = async (credentials: { username: string; password: string }) => {
    try {
      debugLog("🔑 AuthContext login started (DUMMY MODE)...", {
        username: credentials.username,
      });
      setIsLoading(true);

      // --- BYPASS REAL AUTH ---
      // const response = await authService.login(credentials);

      const dummyUser = {
        id: 1,
        username: credentials.username || "demo",
        email: "demo@example.com",
        role: "admin",
      };

      // ✅ SET DUMMY STORAGE
      localStorage.setItem("authToken", "dummy-token-12345");
      localStorage.setItem("currentUser", JSON.stringify(dummyUser));

      setUser(dummyUser);
      setIsAuthenticated(true);

      debugLog("✅ Mock login completed");

      // ✅ DISPATCH AUTH CHANGE EVENT
      window.dispatchEvent(new CustomEvent("authChanged"));
    } catch (error) {
      debugLog("❌ Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      debugLog("🚪 Starting logout process...");
      setIsLoading(true);

      // ✅ CLEAR STORAGE DULU
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");

      // ✅ CLEAR USER STATE
      setUser(null);
      setIsAuthenticated(false);

      debugLog("✅ Logout completed");
      window.dispatchEvent(new CustomEvent("authChanged"));
    } catch (error) {
      debugLog("❌ Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ DUMMY AUTH CHECK
  const checkAuthStatus = useCallback(async () => {
    // In dummy mode, we assume if we have user state, we are good.
    // No need to ping backend.
    const currentToken = localStorage.getItem("authToken");
    if (!currentToken) {
      setIsAuthenticated(false);
      setUser(null);
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isHydrated,
    login,
    logout,
    refreshAuth,
  };

  debugLog("🎯 AuthContext render:", {
    hasUser: !!user,
    isAuthenticated,
    isLoading,
    username: user?.username,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
