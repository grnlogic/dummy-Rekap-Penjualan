"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Package,
  Route,
  Calendar,
  Settings,
  Database,
  Shield,
  Clock,
  MapPin,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { apiService } from "@/app/services/api"; // Import API service

// Components for each section
import SalesManagement from "./components/SalesManagement";
import ProdukManagement from "./components/ProdukManagement";
import JalurManagement from "./components/JalurManagement";
import PeriodeManagement from "./components/PeriodeManagement";
import SystemConfig from "./components/SystemConfig";

const settingsSections = [
  {
    id: "sales",
    name: "Kelola Sales",
    description: "Tambah, edit, hapus data sales",
    icon: Users,
    color: "bg-blue-500",
    component: SalesManagement,
  },
  {
    id: "produk",
    name: "Kelola Produk",
    description: "Tambah, edit, hapus data produk",
    icon: Package,
    color: "bg-green-500",
    component: ProdukManagement,
  },
  {
    id: "jalur",
    name: "Kelola Jalur Distribusi",
    description: "Tambah, edit, hapus jalur distribusi",
    icon: Route,
    color: "bg-purple-500",
    component: JalurManagement,
  },
  {
    id: "periode",
    name: "Kelola Periode & Waktu",
    description: "Atur periode, minggu, dan hari",
    icon: Calendar,
    color: "bg-orange-500",
    component: PeriodeManagement,
  },
  {
    id: "system",
    name: "Konfigurasi Sistem",
    description: "Pengaturan umum aplikasi",
    icon: Settings,
    color: "bg-gray-500",
    component: SystemConfig,
  },
];

export default function SystemSettingsPage() {
  const [activeSection, setActiveSection] = useState("sales");

  // State untuk Quick Stats
  const [quickStats, setQuickStats] = useState({
    totalSales: 0,
    totalProduk: 0,
    totalJalur: 0,
    totalPeriode: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch Quick Stats data
  const fetchQuickStats = async () => {
    try {
      setStatsLoading(true);

      // Fetch data dari semua endpoint secara parallel
      const [salesData, produkData, jalurData, periodeData] = await Promise.all(
        [
          Promise.resolve(apiService.getAllSalespeople()).catch(() => []),
          Promise.resolve(apiService.getAllProduk()).catch(() => []),
          Promise.resolve(apiService.getAllJalur()).catch(() => []),
          Promise.resolve(apiService.getAllPeriode()).catch(() => []),
        ]
      );

      // Remove duplicates untuk setiap dataset
      const uniqueSales = (Array.isArray(salesData) ? salesData : []).filter(
        (sales: any, index, self) =>
          index === self.findIndex((s: any) => s.namaSales === sales.namaSales)
      );

      const uniqueProduk = (Array.isArray(produkData) ? produkData : []).filter(
        (produk: any, index, self) =>
          index ===
          self.findIndex((p: any) => p.namaProduk === produk.namaProduk)
      );

      const uniqueJalur = (Array.isArray(jalurData) ? jalurData : []).filter(
        (jalur: any, index, self) =>
          index === self.findIndex((j: any) => j.namaJalur === jalur.namaJalur)
      );

      const uniquePeriode = (
        Array.isArray(periodeData) ? periodeData : []
      ).filter(
        (periode: any, index, self) =>
          index ===
          self.findIndex((p: any) => p.namaPeriode === periode.namaPeriode)
      );

      setQuickStats({
        totalSales: uniqueSales.length,
        totalProduk: uniqueProduk.length,
        totalJalur: uniqueJalur.length,
        totalPeriode: uniquePeriode.length,
      });
    } catch (error) {
      // Error handling without console output
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchQuickStats();
  }, []);

  // Refresh stats when switching between sections
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    // Refresh stats setelah delay kecil untuk memastikan data ter-update
    setTimeout(() => {
      fetchQuickStats();
    }, 500);
  };

  const ActiveComponent = settingsSections.find(
    (section) => section.id === activeSection
  )?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-900 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    System Settings
                  </h1>
                  <p className="text-sm text-gray-600">
                    Kelola master data dan konfigurasi sistem
                  </p>
                </div>
              </div>
              {/* Refresh button */}
              <button
                onClick={fetchQuickStats}
                disabled={statsLoading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">
                  {statsLoading ? "Loading..." : "Refresh Stats"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pengaturan
                </h2>
                <p className="text-sm text-gray-600">
                  Pilih kategori untuk dikelola
                </p>
              </div>
              <nav className="p-2">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? "bg-blue-50 border border-blue-200 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-md ${
                          isActive ? "bg-blue-100" : section.color
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? "text-blue-600" : "text-white"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{section.name}</p>
                        <p className="text-xs text-gray-500">
                          {section.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Stats - Updated dengan data real */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Quick Stats
                </h3>
                {statsLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Sales</span>
                  <span className="text-sm font-medium">
                    {statsLoading ? (
                      <div className="animate-pulse h-4 w-8 bg-gray-200 rounded"></div>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {quickStats.totalSales}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Produk</span>
                  <span className="text-sm font-medium">
                    {statsLoading ? (
                      <div className="animate-pulse h-4 w-8 bg-gray-200 rounded"></div>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {quickStats.totalProduk}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Jalur</span>
                  <span className="text-sm font-medium">
                    {statsLoading ? (
                      <div className="animate-pulse h-4 w-8 bg-gray-200 rounded"></div>
                    ) : (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {quickStats.totalJalur}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Periode</span>
                  <span className="text-sm font-medium">
                    {statsLoading ? (
                      <div className="animate-pulse h-4 w-8 bg-gray-200 rounded"></div>
                    ) : (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                        {quickStats.totalPeriode}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Last updated info */}
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleTimeString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
