"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ShoppingCart,
  PlusCircle,
  FileText,
  BarChart3,
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
  Phone,
  Clock,
  Trash2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Base navigation yang semua user bisa akses
const baseNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Daftar Penjualan", href: "/sales", icon: ShoppingCart },
  { name: "Tambah Penjualan", href: "/sales/add", icon: PlusCircle },
  { name: "Return Produk", href: "/sales/return", icon: Trash2 },
  { name: "Laporan", href: "/reports", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

// Menu khusus admin - UPDATE INI
const adminNavigation = [
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "System Settings", href: "/admin/settings", icon: Settings },
  // Bisa tambah submenu jika diperlukan:
  // { name: "Sales Management", href: "/admin/settings?tab=sales", icon: Users },
  // { name: "Product Management", href: "/admin/settings?tab=produk", icon: Package },
  // { name: "Route Management", href: "/admin/settings?tab=jalur", icon: Route },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isHydrated } = useAuth(); // ✅ TAMBAH isHydrated

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if developer is operational (8:00 - 15:30)
  const isDeveloperOperational = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeInMinutes = hours * 60 + minutes;

    const startTime = 8 * 60; // 8:00 in minutes
    const endTime = 15 * 60 + 30; // 15:30 in minutes

    return currentTimeInMinutes >= startTime && currentTimeInMinutes <= endTime;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Debug effect - removed console statements
  useEffect(() => {
    // Debug information available but not logged to console
  }, [user, isLoading, isHydrated]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      // Error handling without console output
    }
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";
  const navigation = isAdmin
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation;

  // ✅ WAIT FOR HYDRATION FIRST
  // ✅ LOADING STATE YANG TIDAK MENGGANGGU
  if (!isHydrated) {
    return (
      <div className="w-64 bg-gray-900 text-white border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-800 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-64 bg-gray-900 text-white border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mx-auto mb-2"></div>
            Loading menu...
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user
  if (!user) {
    return (
      <div className="w-64 min-h-screen bg-red-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm">Please log in</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-2 px-3 py-1 bg-red-700 rounded text-xs hover:bg-red-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ✅ TAMBAH DEBUG INFO DI SIDEBAR - removed console logging
  const DebugPanel = () => {
    if (!debugMode) return null;

    return (
      <div className="p-4 bg-yellow-900 border-b border-yellow-700 text-yellow-200 text-xs">
        <div>User: {user?.username || "None"}</div>
        <div>Role: {user?.role || "None"}</div>
        <div>IsAdmin: {isAdmin.toString()}</div>
        <div>Loading: {isLoading.toString()}</div>
        <div>Hydrated: {isHydrated.toString()}</div>
        <div>Navigation Count: {navigation.length}</div>
        <div>Timestamp: {new Date().toLocaleTimeString()}</div>
      </div>
    );
  };

  return (
    <div
      className={`bg-gray-900 text-white transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } min-h-screen flex flex-col relative`}
    >
      {/* Debug Toggle - MAKE MORE VISIBLE */}
      <button
        onClick={() => setDebugMode(!debugMode)}
        className="absolute top-2 right-2 w-4 h-4 bg-yellow-500 rounded-full opacity-50 hover:opacity-100 z-50 text-black text-xs flex items-center justify-center"
        title="Toggle Debug"
      >
        D
      </button>

      <DebugPanel />

      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold">PERUSAHAAN</h1>
              <p className="text-sm text-gray-400">Rekap Penjualan</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <div className="flex items-center space-x-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isAdmin
                      ? "bg-red-900 text-red-200"
                      : "bg-blue-900 text-blue-200"
                  }`}
                >
                  {isAdmin && <Shield className="w-3 h-3 mr-1" />}
                  {user.role || "USER"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            // Add separator before admin menu
            const isFirstAdminItem = adminNavigation[0]?.name === item.name;

            return (
              <li key={`${item.name}-${index}`}>
                {/* Add separator for admin section */}
                {isFirstAdminItem && isAdmin && !isCollapsed && (
                  <div className="py-2">
                    <div className="border-t border-gray-700 mb-3"></div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                      Admin Panel
                    </p>
                  </div>
                )}

                <a
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Role Info - For debugging */}
      {!isCollapsed && debugMode && (
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="text-xs text-gray-400">
            <div>Menu Count: {navigation.length}</div>
            <div>Base: {baseNavigation.length}</div>
            <div>Admin: {isAdmin ? adminNavigation.length : 0}</div>
          </div>
        </div>
      )}

      {/* Contact Developer Section */}
      <div className="p-4 border-t border-gray-700">
        {/* Digital Clock and Operational Hours */}
        <div className={`mb-4 ${isCollapsed ? "text-center" : ""}`}>
          {!isCollapsed && (
            <div className="bg-gray-800 rounded-lg p-3 mb-3">
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-xs font-medium text-blue-400">
                  Waktu Sekarang
                </span>
              </div>
              <div className="text-sm font-mono text-white mb-1">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-400">
                {formatDate(currentTime)}
              </div>
            </div>
          )}

          {/* Operational Status */}
          <div className={`mb-3 ${isCollapsed ? "flex justify-center" : ""}`}>
            <div
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                isDeveloperOperational()
                  ? "bg-green-900 text-green-200"
                  : "bg-red-900 text-red-200"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isDeveloperOperational() ? "bg-green-400" : "bg-red-400"
                }`}
              ></div>
              {isCollapsed ? (
                isDeveloperOperational() ? (
                  "ON"
                ) : (
                  "OFF"
                )
              ) : (
                <>
                  Developer {isDeveloperOperational() ? "Online" : "Offline"}
                  <span className="ml-2 text-xs opacity-75">(08:00-15:30)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`${isCollapsed ? "text-center" : ""}`}>
          {!isCollapsed && (
            <div className="mb-2">
              <p className="text-xs text-gray-400 mb-1">Ada kendala?</p>

              {!isDeveloperOperational() && (
                <p className="text-xs text-red-400 mt-1">
                  Diluar jam operasional, respon mungkin tertunda
                </p>
              )}
            </div>
          )}
          <a
            href="https://wa.me/6281395195039"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isDeveloperOperational()
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            <Phone className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="ml-2">Hubungi Developer</span>}
          </a>
          {!isCollapsed && (
            <p className="text-xs text-green-400 mt-2 text-center">
              {isDeveloperOperational()
                ? "Respon cepat via WhatsApp"
                : "Respon diluar jam kerja mungkin tertunda"}
            </p>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
}
