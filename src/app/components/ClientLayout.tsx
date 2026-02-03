"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { useTokenGuard } from "../hooks/useTokenGuard";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isHydrated } = useAuth();

  // ✅ GUNAKAN TOKEN GUARD UNTUK PROTEKSI OTOMATIS
  useTokenGuard();

  // ✅ JANGAN GANGGU ROUTING, HANYA TANGANI LAYOUT
  const isAuthPage = pathname?.startsWith("/auth");

  // ✅ JIKA DI AUTH PAGE, TAMPILKAN FULL PAGE
  if (isAuthPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  // ✅ JIKA BELUM HYDROGEN, TAMPILKAN LOADING
  if (!isHydrated) {
    return <div className="min-h-screen">{children}</div>;
  }

  // ✅ JIKA BELUM LOGIN, BIARKAN ROUTING MENANGANI
  if (!isAuthenticated) {
    return <div className="min-h-screen">{children}</div>;
  }

  // ✅ JIKA SUDAH LOGIN, TAMPILKAN LAYOUT DENGAN SIDEBAR
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
