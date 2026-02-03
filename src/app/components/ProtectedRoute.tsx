"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/app/services/authService";
import { PageLoader } from "@/app/components/ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip auth check for auth pages
        if (pathname?.startsWith("/auth")) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // ✅ CEK TOKEN DAN USER
        const token = localStorage.getItem("authToken");
        const user = localStorage.getItem("currentUser");

        if (!token || !user || token === "null" || token === "undefined") {
          console.log("❌ No valid token or user found, redirecting to login");
          setIsAuthenticated(false);
          // ✅ LANGSUNG REDIRECT TANPA ROUTER
          window.location.href = "/auth/login";
          return;
        }

        const authenticated = authService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (!authenticated) {
          console.log("❌ Authentication failed, redirecting to login");
          // ✅ LANGSUNG REDIRECT TANPA ROUTER
          window.location.href = "/auth/login";
          return;
        }

        console.log("✅ Authentication successful");
      } catch (error) {
        console.error("❌ Auth check error:", error);
        setIsAuthenticated(false);
        if (!pathname?.startsWith("/auth")) {
          // ✅ LANGSUNG REDIRECT TANPA ROUTER
          window.location.href = "/auth/login";
        }
      } finally {
        // Reduced delay for better UX
        setTimeout(() => {
          setIsLoading(false);
        }, 200);
      }
    };

    checkAuth();
  }, [router, pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return <PageLoader text="Memverifikasi autentikasi..." />;
  }

  // If not authenticated and not on auth page, show loading while redirecting
  if (!isAuthenticated && !pathname?.startsWith("/auth")) {
    return <PageLoader text="Mengarahkan ke halaman login..." />;
  }

  // Only render children if authenticated or on auth page
  return <>{children}</>;
}
