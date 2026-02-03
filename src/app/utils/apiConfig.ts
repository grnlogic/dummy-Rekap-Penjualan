// Secure API Configuration Utility

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  environment: "development" | "production" | "staging";
}

class ApiConfigManager {
  private static instance: ApiConfigManager;
  private config: ApiConfig;

  private constructor() {
    this.config = this.initializeConfig();
  }

  public static getInstance(): ApiConfigManager {
    if (!ApiConfigManager.instance) {
      ApiConfigManager.instance = new ApiConfigManager();
    }
    return ApiConfigManager.instance;
  }

  private initializeConfig(): ApiConfig {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const environment =
      (process.env.NEXT_PUBLIC_APP_ENV as
        | "development"
        | "production"
        | "staging") || "development";

    if (!baseUrl) {
      throw new Error(
        "NEXT_PUBLIC_API_BASE_URL environment variable is required! Check your .env file."
      );
    }

    return {
      baseUrl,
      timeout: environment === "production" ? 30000 : 10000,
      retryAttempts: environment === "production" ? 5 : 3,
      environment,
    };
  }

  public getApiBaseUrl(): string {
    return this.config.baseUrl;
  }

  public getConfig(): ApiConfig {
    return { ...this.config }; // Return copy untuk immutability
  }

  public isProduction(): boolean {
    return this.config.environment === "production";
  }

  public isDevelopment(): boolean {
    return this.config.environment === "development";
  }

  // Method untuk validasi URL sebelum request
  public validateApiUrl(): boolean {
    const url = this.config.baseUrl;

    // Validasi format URL
    try {
      new URL(url);

      // Untuk production, pastikan menggunakan HTTPS
      if (this.isProduction() && !url.startsWith("https://")) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiConfig = ApiConfigManager.getInstance();

// Export helper functions
export const getApiBaseUrl = (): string => {
  if (!apiConfig.validateApiUrl()) {
    throw new Error(
      "Konfigurasi API tidak valid. Periksa environment variable."
    );
  }
  return apiConfig.getApiBaseUrl();
};

export const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
    "X-App-Environment": apiConfig.getConfig().environment,
  };
};

// Helper untuk development
export const logApiConfig = (): void => {
  if (apiConfig.isDevelopment()) {
    // Keep only in development for debugging
  }
};
