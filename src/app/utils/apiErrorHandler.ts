/**
 * Global API Error Handler
 * Menangani semua error dari API calls dan otomatis redirect ke login jika diperlukan
 */

let isRedirecting = false; // Flag untuk mencegah multiple redirects

/**
 * Handler untuk error API yang otomatis mendeteksi auth issues
 */
export const handleApiError = (error: any, context?: string) => {
  console.error(`[API Error Handler] ${context || 'Unknown context'}:`, error);

  // Cek berbagai kondisi yang menandakan auth error
  const isAuthError = 
    error?.status === 401 ||
    error?.message?.includes("401") ||
    error?.message?.includes("Unauthorized") ||
    error?.message?.includes("No token") ||
    error?.message?.includes("Invalid token") ||
    error?.message?.includes("Token expired") ||
    (error?.message?.includes("fetch") && typeof window !== "undefined" && !localStorage.getItem("authToken"));

  if (isAuthError && !isRedirecting) {
    console.log("🚨 Authentication error detected, initiating redirect to login");
    isRedirecting = true;
    
    // Import dynamic untuk menghindari circular dependency
    import("./authUtils").then(({ redirectToLogin }) => {
      redirectToLogin(`API Error: ${context || 'Unknown context'}`);
    }).catch(err => {
      console.error("Failed to import authUtils:", err);
      // Fallback redirect
      if (typeof window !== "undefined" && !window.location.pathname.includes('/auth/login')) {
        window.location.href = "/auth/login";
      }
    });
  }

  // Reset flag setelah 2 detik untuk memungkinkan redirect berikutnya jika diperlukan
  setTimeout(() => {
    isRedirecting = false;
  }, 2000);

  return error;
};

/**
 * Wrapper untuk fetch yang otomatis menangani auth errors
 */
export const fetchWithAuthHandler = async (url: string, options: RequestInit = {}, context?: string) => {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      handleApiError({ status: 401, message: "Unauthorized" }, context);
      throw new Error(`Unauthorized: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    handleApiError(error, context);
    throw error;
  }
};

/**
 * Decorator untuk method API yang otomatis menangani errors
 */
export const withAuthErrorHandler = (context?: string) => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        handleApiError(error, context || `${target.constructor.name}.${propertyName}`);
        throw error;
      }
    };
  };
};

export default {
  handleApiError,
  fetchWithAuthHandler,
  withAuthErrorHandler,
};
