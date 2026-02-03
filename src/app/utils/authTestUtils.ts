/**
 * Test script untuk memverifikasi redirect ke login
 * Jalankan script ini di browser console untuk test
 */

// ✅ TEST 1: Clear token dan akses halaman dashboard
const testTokenClear = () => {
  console.log("🧪 Testing token clear redirect...");
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("sessionId");
  console.log("✅ Tokens cleared, page should redirect to login");
  window.location.reload();
};

// ✅ TEST 2: Simulasi API error 401
const testApiError = async () => {
  console.log("🧪 Testing API 401 error...");
  try {
    // Import dynamic untuk test
    const { apiService } = await import("../services/api");
    
    // Force token menjadi invalid
    localStorage.setItem("authToken", "invalid_token");
    
    // Coba API call yang memerlukan auth
    await apiService.getAllPenjualan();
  } catch (error: any) {
    console.log("✅ Expected error caught:", error?.message || error);
  }
};

// ✅ TEST 3: Test authService.isAuthenticated()
const testAuthService = async () => {
  console.log("🧪 Testing authService.isAuthenticated()...");
  const { authService } = await import("../services/authService");
  
  // Clear token
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  
  // Test isAuthenticated - should redirect
  const isAuth = authService.isAuthenticated();
  console.log("🔍 IsAuthenticated result:", isAuth);
};

// ✅ TEST 4: Test manual redirect
const testManualRedirect = async () => {
  console.log("🧪 Testing manual redirect...");
  const { redirectToLogin } = await import("../utils/authUtils");
  redirectToLogin("Manual test redirect");
};

// ✅ TEST 5: Test dengan berbagai kondisi token
const testTokenConditions = () => {
  console.log("🧪 Testing various token conditions...");
  
  const conditions = [
    null,
    "null",
    "undefined", 
    "",
    "   ",
    "invalid_token_123"
  ];
  
  conditions.forEach((token, index) => {
    console.log(`Test ${index + 1}: Setting token to "${token}"`);
    if (token === null) {
      localStorage.removeItem("authToken");
    } else {
      localStorage.setItem("authToken", token);
    }
    
    // Test dengan timeout untuk melihat hasil
    setTimeout(async () => {
      const { authService } = await import("../services/authService");
      authService.isAuthenticated();
    }, index * 1000);
  });
};

// Export untuk digunakan di console
if (typeof window !== "undefined") {
  (window as any).authTests = {
    testTokenClear,
    testApiError,
    testAuthService,
    testManualRedirect,
    testTokenConditions,
  };
  
  console.log("🧪 Auth tests loaded! Use window.authTests to run tests:");
  console.log("- window.authTests.testTokenClear()");
  console.log("- window.authTests.testApiError()"); 
  console.log("- window.authTests.testAuthService()");
  console.log("- window.authTests.testManualRedirect()");
  console.log("- window.authTests.testTokenConditions()");
}

export {
  testTokenClear,
  testApiError, 
  testAuthService,
  testManualRedirect,
  testTokenConditions,
};
