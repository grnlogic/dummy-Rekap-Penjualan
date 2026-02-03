"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";

export default function Home() {
  const [shouldRender, setShouldRender] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading, isHydrated, user } = useAuth();

  useEffect(() => {
    // ✅ Wait for hydration first
    if (!isHydrated) {
      return;
    }

    // ✅ CEK TOKEN LANGSUNG DARI LOCALSTORAGE
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("currentUser");

    if (!token || !userData || token === "null" || token === "undefined") {
      console.log("❌ No valid token found, redirecting to login");
      window.location.href = "/auth/login";
      return;
    }

    // ✅ Then check auth
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("❌ Not authenticated, redirecting to login");
        window.location.href = "/auth/login";
      } else {
        console.log("✅ Authenticated, rendering page");
        setShouldRender(true);
      }
    }
  }, [isHydrated, isLoading, isAuthenticated, router, user]);

  // Show loading while checking
  if (!isHydrated || isLoading || !shouldRender) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isHydrated ? "Initializing..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  // Only render if authenticated and hydrated
  return <LandingPage />;
}
