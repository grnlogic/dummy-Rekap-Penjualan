"use client";

import { useState } from "react";
import Image from "next/image";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { authService } from "@/app/services/authService";
import { sweetAlert } from "@/app/utils/sweetAlert";
import logo from "../assets/Adobe Express - file.png";

// Define user type interface
interface UserData {
  username?: string;
  email?: string;
  id?: number;
  role?: string;
}

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Add type safety for user data with proper conversion
  const userData = authService.getUser() as unknown as UserData | null;

  const handleLogout = async () => {
    const result = await sweetAlert.confirm(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar dari sistem?",
      "Ya, Keluar",
      "Batal"
    );

    if (result.isConfirmed) {
      authService.logout();
      sweetAlert.success("Logout Berhasil", "Anda telah keluar dari sistem");
    }
  };

  // Helper function to safely get user property with string conversion
  const getUserProperty = (
    property: keyof UserData,
    defaultValue: string
  ): string => {
    const value = userData?.[property];
    return value ? String(value) : defaultValue;
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg border border-slate-200 p-1">
              <Image
                src={logo}
                alt="PERUSAHAAN Logo"
                width={40}
                height={40}
                className="object-contain"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "40px",
                  maxHeight: "40px",
                }}
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Production Dashboard
              </h1>
              <p className="text-slate-600 mt-1">
                Sistem Manajemen Penjualan PERUSAHAAN
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-md">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Secure Session</span>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
              >
                <User className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {getUserProperty("username", "User")}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                  <div className="px-4 py-2 border-b border-slate-200">
                    <p className="text-sm font-medium text-slate-900">
                      {getUserProperty("username", "User")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getUserProperty("email", "user@example.com")}
                    </p>
                  </div>

                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Pengaturan</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
