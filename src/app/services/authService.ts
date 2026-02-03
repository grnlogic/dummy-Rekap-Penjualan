import { redirectToLogin, checkTokenOrRedirect } from "../utils/authUtils";
import { ENV } from "../config/env";

interface LoginRequest {
  username: string;
  password: string;
}
 
//type
interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    active: boolean;
    sessionId?: string;
    isOnline?: boolean;
  };
}

class AuthService {
  // ✅ TAMBAHKAN SEMUA PROPERTY YANG KURANG DI SINI
  private readonly API_BASE = ENV.API_BASE_URL || "http://localhost:8080/api";
  private readonly TOKEN_KEY = "authToken";
  private readonly USER_KEY = "currentUser";
  private readonly SESSION_KEY = "sessionId";

  // Property untuk heartbeat
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // ✅ DEBUG FUNCTION
  private debugLog(message: string, data?: any) {
    if (ENV.DEBUG_MODE) {
      console.log(`🔧 [AuthService] ${message}`, data || "");
    }
  }

  async login(credentials: {
    username: string;
    password: string;
  }): Promise<any> {
    try {
      this.debugLog("🔑 Login attempt:", { username: credentials.username });

      const response = await fetch(`${this.API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      this.debugLog("📡 Login response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        this.debugLog("❌ Login failed:", errorData);
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      this.debugLog("✅ Login response data:", {
        success: data.success,
        hasUser: !!data.user,
        hasToken: !!data.token,
        username: data.user?.username,
        token: data.token?.substring(0, 10) + "...",
      });

      if (data.success && data.user && data.token) {
        // ✅ SIMPAN TOKEN DAN USER - TOKEN ADA DI ROOT LEVEL, BUKAN DI data.user
        localStorage.setItem(this.TOKEN_KEY, data.token);
        localStorage.setItem(this.SESSION_KEY, data.token);
        this.debugLog("💾 Token saved to localStorage:", {
          tokenLength: data.token.length,
        });

        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
        this.debugLog("💾 User data saved to localStorage");

        // ✅ VERIFY STORAGE IMMEDIATELY
        const savedToken = localStorage.getItem(this.TOKEN_KEY);
        const savedUser = localStorage.getItem(this.USER_KEY);
        this.debugLog("🔍 Verification after save:", {
          tokenSaved: !!savedToken,
          userSaved: !!savedUser,
          isAuthenticated: this.isAuthenticated(),
        });

        // ✅ START HEARTBEAT
        this.startHeartbeat();
        return data;
      } else {
        this.debugLog("❌ Login failed - no user data");
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      this.debugLog("❌ Login error:", error);
      throw error;
    }
  }

  private async testTokenWithBackend(token: string): Promise<void> {
    try {
      const testResponse = await fetch(
        `${this.API_BASE}/user-activity/online-users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (testResponse.status === 401) {
        localStorage.removeItem(this.TOKEN_KEY);
        throw new Error("Session token was rejected by backend");
      }
    } catch (error) {
      throw error;
    }
  }

  private startHeartbeat() {
    // Clear existing heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    const sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      return;
    }

    // ✅ PERPANJANG HEARTBEAT JADI 5 MENIT (BUKAN 2 MENIT)
    this.heartbeatInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${this.API_BASE}/user-activity/heartbeat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          }
        );

        // ✅ JIKA HEARTBEAT GAGAL 401, JANGAN LANGSUNG LOGOUT
        if (response.status === 401) {
          console.warn("Heartbeat failed - token may be expired");
          // Biarkan user tetap login, akan logout saat melakukan action
        }
      } catch (error) {
        // Silent fail for heartbeat
        console.warn("Heartbeat error:", error);
      }
    }, 300000); // ✅ 5 menit = 300000ms (bukan 120000ms)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      this.debugLog("📦 Getting user from storage:", {
        hasUserData: !!userStr,
      });

      if (userStr) {
        const user = JSON.parse(userStr);
        this.debugLog("✅ User parsed successfully:", {
          username: user.username,
        });
        return user;
      }

      this.debugLog("❌ No user data in storage");
      return null;
    } catch (error) {
      this.debugLog("❌ Error parsing user data:", error);
      //this.removeToken();
      return null;
    }
  }

  // ✅ TAMBAH METHOD REFRESH TOKEN
  async refreshToken(): Promise<boolean> {
    try {
      const currentToken = this.getToken();
      if (!currentToken) {
        return false;
      }

      const response = await fetch(`${this.API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem(this.TOKEN_KEY, data.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  // ✅ TAMBAH METHOD CHECK DAN AUTO REFRESH
  async checkAndRefreshToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        this.debugLog("❌ No token for refresh check");
        return false;
      }

      this.debugLog("🔄 Checking token validity...");

      // ✅ TEST TOKEN DENGAN API CALL RINGAN
      const response = await fetch(`${this.API_BASE}/user-activity/test`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        this.debugLog("✅ Token still valid");
        return true;
      } else if (response.status === 401) {
        this.debugLog(
          "⚠️ Token expired, tidak ada refresh token. User tetap login (debug mode)"
        );
        // Jangan refresh token, jangan auto logout, cukup return false
        return false;
      } else {
        this.debugLog("❌ Token check failed:", response.status);
        return false;
      }
    } catch (error) {
      this.debugLog("❌ Check and refresh error:", error);
      return false;
    }
  }

  // ✅ HELPER METHOD UNTUK DECODE JWT
  private getTokenPayload(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  // ✅ UPDATE isAuthenticated DENGAN AUTO REDIRECT
  isAuthenticated(): boolean {
    try {
      const token = this.getToken();
      const user = this.getCurrentUser();

      this.debugLog("🔍 Auth check:", {
        hasToken: !!token,
        hasUser: !!user,
        username: user?.username,
        tokenLength: token?.length || 0,
      });

      const isAuth = !!(token && user);
      
      // ✅ REDIRECT KE LOGIN JIKA TIDAK ADA TOKEN - GUNAKAN UTILITY
      if (!isAuth && typeof window !== "undefined") {
        this.debugLog("❌ No token found, redirecting to login...");
        redirectToLogin("Missing token or user data");
      }

      return isAuth;
    } catch (error) {
      this.debugLog("❌ Auth check error:", error);
      // ✅ REDIRECT KE LOGIN JIKA ERROR - GUNAKAN UTILITY
      if (typeof window !== "undefined") {
        redirectToLogin("Auth check error");
      }
      return false;
    }
  }

  // ✅ METHOD UNTUK REDIRECT KE LOGIN - GUNAKAN UTILITY
  private redirectToLogin(): void {
    redirectToLogin("AuthService redirect");
  }

  async logout(): Promise<void> {
    try {
      const user = this.getCurrentUser();

      this.stopHeartbeat();

      if (user?.id) {
        try {
          await fetch(`${this.API_BASE}/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: user.id }),
          });
        } catch (error) {
          // Silent fail for logout call
        }
      }

      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      // Force clear even if error
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    this.debugLog("🎫 Getting token:", {
      hasToken: !!token,
      length: token?.length || 0,
    });
    
    // ✅ CEK TOKEN DAN REDIRECT JIKA TIDAK ADA - GUNAKAN UTILITY
    if (!token || token === "null" || token === "undefined") {
      this.debugLog("❌ Invalid token detected");
      if (typeof window !== "undefined" && !window.location.pathname.includes('/auth/login')) {
        redirectToLogin("Invalid token detected");
      }
      return null;
    }
    
    return token;
  }

  getSessionId(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }

  removeToken(): void {
    this.stopHeartbeat();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.SESSION_KEY);
  }

  // ✅ METHOD UNTUK CEK TOKEN DAN REDIRECT - GUNAKAN UTILITY
  checkTokenAndRedirect(): boolean {
    return checkTokenOrRedirect("Token validation check");
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "ADMIN";
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Method untuk manual update activity
  async updateActivity() {
    const user = this.getCurrentUser();
    if (!user) return;

    try {
      const sessionId = this.getSessionId();
      if (!sessionId) return;

      await fetch(`${this.API_BASE}/user-activity/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          sessionId,
        }),
      });
    } catch (error) {
      // Silent fail for activity update
    }
  }

  // ✅ ADD AUTHENTICATED FETCH METHOD
  async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token available");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    return fetch(`${this.API_BASE}${url}`, {
      ...options,
      headers,
    });
  }
}

// ✅ EXPORT STATEMENTS
export const authService = new AuthService();
export default authService;
