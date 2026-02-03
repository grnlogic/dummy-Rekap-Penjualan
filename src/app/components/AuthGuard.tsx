"use client";

import { useEffect, useState } from "react";
import { authService } from "@/app/services/authService";
import { PageLoader } from "@/app/components/ui/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AuthGuard = ({
  children,
  redirectTo = "/auth/login",
}: AuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Check token existence
        const token = localStorage.getItem("authToken");
        if (!token || token === "null" || token === "undefined") {
          window.location.href = redirectTo;
          return;
        }

        // 2. Check with authService
        const authenticated = authService.isAuthenticated();
        if (!authenticated) {
          authService.removeToken();
          window.location.href = redirectTo;
          return;
        }

        // 3. Optional: Test with backend
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/health/status`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.status === 401) {
            authService.removeToken();
            window.location.href = redirectTo;
            return;
          }
        } catch (error) {
          // Backend check failed, continuing
        }

        setIsAuthenticated(true);
      } catch (error) {
        window.location.href = redirectTo;
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [redirectTo]);

  if (isChecking) {
    return <PageLoader text="Memverifikasi session..." />;
  }

  if (!isAuthenticated) {
    return <PageLoader text="Mengarahkan ke login..." />;
  }

  return <>{children}</>;
};

export default AuthGuard;
