// Environment configuration - Safe defaults for static deployment
export const ENV = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "",
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE !== "false",
  GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
} as const;

// Helper to check if backend is available
export const hasBackend = () => !!ENV.API_BASE_URL;
