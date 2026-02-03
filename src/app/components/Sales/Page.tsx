"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import logo from "../assets/Adobe Express - file.png";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  BarChart3,
  FileText,
  Loader2,
  Globe,
  UserCheck,
  Calendar,
} from "lucide-react";
import {
  apiService,
  PenjualanData,
  TotalProdukData,
  SalesData,
  TotalMingguData,
} from "@/app/services/api";
import SystemStatus from "@/app/components/SystemStatus";
import { sweetAlert } from "@/app/utils/sweetAlert";
import {
  LoadingSpinner,
  PageLoader,
  CardSkeleton,
} from "@/app/components/ui/LoadingSpinner";
import { removeDuplicatesByName, getCachedFilteredData } from "@/app/lib/utils";

const LandingPage = () => {
  const [salesData, setSalesData] = useState<PenjualanData[]>([]);
  const [totalProdukData, setTotalProdukData] = useState<TotalProdukData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tambahkan state baru ini
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "weekly">(
    "overview"
  );
  const [selectedSalesId, setSelectedSalesId] = useState<number | null>(null);
  const [salesList, setSalesList] = useState<SalesData[]>([]);
  const [totalMingguData, setTotalMingguData] = useState<TotalMingguData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [penjualanData, totalProduk, salesListData, totalMinggu] =
        await Promise.all([
          apiService.getAllPenjualan(),
          apiService.getTotalPenjualanPerProduk(),
          apiService.getAllSales(),
          apiService.getTotalPenjualanPerMinggu(),
        ]);

      setSalesData(penjualanData);
      setTotalProdukData(totalProduk);

      // Gunakan utility function untuk menghilangkan duplikasi sales
      const filteredSales = getCachedFilteredData(
        "dashboard-sales",
        salesListData,
        (data) => removeDuplicatesByName(data, "namaSales")
      );

      setSalesList(filteredSales);

      setTotalMingguData(totalMinggu);
      setError(null);
    } catch (err: any) {
      console.error("Sales dashboard data loading error:", err);
      setError("Gagal memuat data dashboard");

      // ✅ CEK JIKA ERROR KARENA TOKEN/AUTH ISSUES
      if (
        err?.message?.includes("401") ||
        err?.message?.includes("Unauthorized") ||
        err?.message?.includes("fetch") ||
        err?.status === 401
      ) {
        console.log(
          "🚨 Authentication error detected in Sales page, redirecting to login"
        );
        sweetAlert
          .error(
            "Sesi Berakhir",
            "Sesi login Anda telah berakhir. Silakan login kembali."
          )
          .then(() => {
            import("../../utils/authUtils").then(({ redirectToLogin }) => {
              redirectToLogin("Session expired during sales data loading");
            });
          });
      } else {
        sweetAlert
          .confirm(
            "Error Memuat Data",
            "Terjadi kesalahan saat memuat data dashboard. Periksa koneksi internet atau coba login ulang.",
            "Login Ulang",
            "Coba Lagi"
          )
          .then((result) => {
            if (result.isConfirmed) {
              import("../../utils/authUtils").then(({ redirectToLogin }) => {
                redirectToLogin("User requested login from sales error dialog");
              });
            }
          });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    sweetAlert.loading("Refresh Data", "Sedang memuat ulang data dashboard...");

    try {
      await loadDashboardData();
      sweetAlert.close();
      sweetAlert.toast.success("Data berhasil direfresh");
    } catch (error) {
      sweetAlert.close();
      sweetAlert.toast.error("Gagal refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Pisahkan data berdasarkan tipeTransaksi
  const penjualanNormal = salesData.filter(
    (item) =>
      !item.tipeTransaksi || item.tipeTransaksi.toUpperCase() === "PENJUALAN"
  );
  const penjualanReturn = salesData.filter(
    (item) =>
      item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
  );
  const penjualanBS = salesData.filter(
    (item) => item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
  );

  // Calculate metrics from real data - PERBAIKAN LOGIKA YANG BENAR
  const totalPenjualan =
    penjualanNormal.reduce((sum, item) => {
      // Hitung total sebenarnya: kuantitas × harga per unit
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalItem = kuantitas * hargaPerUnit;
      return sum + totalItem;
    }, 0) -
    penjualanReturn.reduce((sum, item) => {
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalItem = kuantitas * hargaPerUnit;
      return sum + totalItem;
    }, 0) -
    penjualanBS.reduce((sum, item) => {
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalItem = kuantitas * hargaPerUnit;
      return sum + totalItem;
    }, 0);

  const totalOrders = penjualanNormal.length;
  const totalUnits =
    penjualanNormal.reduce(
      (sum, item) => sum + Number(item.kuantitas || 1),
      0
    ) -
    penjualanReturn.reduce(
      (sum, item) => sum + Number(item.kuantitas || 1),
      0
    ) -
    penjualanBS.reduce((sum, item) => sum + Number(item.kuantitas || 1), 0);
  const uniqueCustomers = new Set(
    salesData.map((item) => item.sales?.namaSales).filter(Boolean)
  ).size;
  const uniqueProducts = new Set(
    salesData.map((item) => item.produk?.namaProduk).filter(Boolean)
  ).size;

  // Tambahkan setelah loadDashboardData
  const getFilteredDataBySales = (salesId: number) => {
    return salesData.filter((item) => item.sales?.id === salesId);
  };

  const getSalesMetrics = (salesId: number) => {
    const filteredData = getFilteredDataBySales(salesId);

    // Pisahkan data berdasarkan tipeTransaksi
    const penjualanNormal = filteredData.filter(
      (item) =>
        !item.tipeTransaksi || item.tipeTransaksi.toUpperCase() === "PENJUALAN"
    );
    const penjualanReturn = filteredData.filter(
      (item) =>
        item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
    );
    const penjualanBS = filteredData.filter(
      (item) => item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
    );

    const totalPenjualanSales =
      penjualanNormal.reduce((sum, item) => {
        const kuantitas = Number(item.kuantitas || 1);
        const hargaPerUnit = Number(item.jumlahPenjualan || 0);
        return sum + kuantitas * hargaPerUnit;
      }, 0) -
      penjualanReturn.reduce((sum, item) => {
        const kuantitas = Number(item.kuantitas || 1);
        const hargaPerUnit = Number(item.jumlahPenjualan || 0);
        return sum + kuantitas * hargaPerUnit;
      }, 0) -
      penjualanBS.reduce((sum, item) => {
        const kuantitas = Number(item.kuantitas || 1);
        const hargaPerUnit = Number(item.jumlahPenjualan || 0);
        return sum + kuantitas * hargaPerUnit;
      }, 0);

    return {
      totalPenjualan: totalPenjualanSales,
      totalOrders: penjualanNormal.length,
      topProducts: getTopProductsForSales(penjualanNormal),
    };
  };

  const getTopProductsForSales = (salesData: PenjualanData[]) => {
    const productMap = new Map();
    salesData.forEach((item) => {
      const productName = item.produk?.namaProduk || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit; // Hitung total sebenarnya

      if (productMap.has(productName)) {
        const existing = productMap.get(productName);
        productMap.set(productName, {
          namaProduk: productName,
          totalPenjualan: existing.totalPenjualan + totalValue,
          totalKuantitas: existing.totalKuantitas + kuantitas,
          jumlahTransaksi: existing.jumlahTransaksi + 1,
        });
      } else {
        productMap.set(productName, {
          namaProduk: productName,
          totalPenjualan: totalValue,
          totalKuantitas: kuantitas,
          jumlahTransaksi: 1,
        });
      }
    });

    return Array.from(productMap.entries())
      .map(([_, data]) => data)
      .sort((a, b) => b.totalPenjualan - a.totalPenjualan)
      .slice(0, 5);
  };

  useEffect(() => {
    if (activeTab === "sales" && salesList.length > 0 && !selectedSalesId) {
      setSelectedSalesId(salesList[0].id);
    }
  }, [activeTab, salesList]);

  // Tambahkan method untuk laporan minggu
  const getWeeklyMetrics = () => {
    const weeklyMap = new Map();

    // Pisahkan data berdasarkan tipeTransaksi
    const penjualanNormal = salesData.filter(
      (item) =>
        !item.tipeTransaksi || item.tipeTransaksi.toUpperCase() === "PENJUALAN"
    );
    const penjualanReturn = salesData.filter(
      (item) =>
        item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
    );
    const penjualanBS = salesData.filter(
      (item) => item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
    );

    // Process penjualan normal
    penjualanNormal.forEach((item) => {
      const minggu = item.minggu?.namaMinggu || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (weeklyMap.has(minggu)) {
        const existing = weeklyMap.get(minggu);
        weeklyMap.set(minggu, {
          totalPenjualan: existing.totalPenjualan + totalValue,
          jumlahTransaksi: existing.jumlahTransaksi + 1,
        });
      } else {
        weeklyMap.set(minggu, {
          totalPenjualan: totalValue,
          jumlahTransaksi: 1,
        });
      }
    });

    // Process return (dikurangkan)
    penjualanReturn.forEach((item) => {
      const minggu = item.minggu?.namaMinggu || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (weeklyMap.has(minggu)) {
        const existing = weeklyMap.get(minggu);
        weeklyMap.set(minggu, {
          totalPenjualan: existing.totalPenjualan - totalValue,
          jumlahTransaksi: existing.jumlahTransaksi,
        });
      } else {
        weeklyMap.set(minggu, {
          totalPenjualan: -totalValue,
          jumlahTransaksi: 0,
        });
      }
    });

    // Process BS (dikurangkan)
    penjualanBS.forEach((item) => {
      const minggu = item.minggu?.namaMinggu || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (weeklyMap.has(minggu)) {
        const existing = weeklyMap.get(minggu);
        weeklyMap.set(minggu, {
          totalPenjualan: existing.totalPenjualan - totalValue,
          jumlahTransaksi: existing.jumlahTransaksi,
        });
      } else {
        weeklyMap.set(minggu, {
          totalPenjualan: -totalValue,
          jumlahTransaksi: 0,
        });
      }
    });

    const weeklyArray = Array.from(weeklyMap.entries()).map(
      ([minggu, data]) => ({
        namaMinggu: minggu,
        ...data,
      })
    );

    const totalWeeklyRevenue = weeklyArray.reduce(
      (sum, item) => sum + item.totalPenjualan,
      0
    );
    const totalWeeklyOrders = weeklyArray.reduce(
      (sum, item) => sum + item.jumlahTransaksi,
      0
    );

    return {
      totalPenjualan: totalWeeklyRevenue,
      totalOrders: totalWeeklyOrders,
      uniqueCustomers: weeklyArray.length,
      uniqueProducts: weeklyArray.length,
      displayData: weeklyArray.slice(0, 5),
      recentActivity: salesData.slice(-3).reverse(),
    };
  };

  // Update currentMetrics
  const currentMetrics =
    activeTab === "overview"
      ? {
          totalPenjualan,
          totalOrders,
          uniqueCustomers,
          uniqueProducts,
          displayData: totalProdukData,
          recentActivity: salesData.slice(-3).reverse(),
        }
      : activeTab === "weekly"
      ? getWeeklyMetrics()
      : selectedSalesId
      ? (() => {
          const salesMetrics = getSalesMetrics(selectedSalesId);
          const filteredData = getFilteredDataBySales(selectedSalesId);
          return {
            totalPenjualan: salesMetrics.totalPenjualan,
            totalOrders: salesMetrics.totalOrders,
            uniqueCustomers: 1,
            uniqueProducts: new Set(
              filteredData
                .map((item) => item.produk?.namaProduk)
                .filter(Boolean)
            ).size,
            displayData: salesMetrics.topProducts,
            recentActivity: filteredData.slice(-3).reverse(),
          };
        })()
      : {
          totalPenjualan: 0,
          totalOrders: 0,
          uniqueCustomers: 0,
          uniqueProducts: 0,
          displayData: [],
          recentActivity: [],
        };

  if (loading) {
    return <PageLoader text="Memuat dashboard PERUSAHAAN..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
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
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
                <span className="text-sm font-medium">Live System</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Welcome Section dengan Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Selamat Datang di Sistem PERUSAHAAN
                </h2>
                <p className="text-blue-100">
                  Kelola seluruh operasional penjualan dan produksi dengan
                  efisien
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center backdrop-blur-sm p-2">
                  <Image
                    src={logo}
                    alt="PERUSAHAAN Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxWidth: "48px",
                      maxHeight: "48px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Status Card */}
          <div className="flex flex-col justify-center">
            <SystemStatus />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8 border border-slate-200">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center px-6 py-4 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Globe className="h-5 w-5 mr-2" />
              Laporan Keseluruhan
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`flex items-center px-6 py-4 font-medium transition-colors ${
                activeTab === "sales"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <UserCheck className="h-5 w-5 mr-2" />
              Laporan Per Sales
            </button>
            <button
              onClick={() => setActiveTab("weekly")}
              className={`flex items-center px-6 py-4 font-medium transition-colors ${
                activeTab === "weekly"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Laporan Per Minggu
            </button>
          </div>

          {/* Sales Selection */}
          {activeTab === "sales" && (
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-slate-700">
                  Pilih Sales:
                </label>
                <select
                  value={selectedSalesId || ""}
                  onChange={(e) => setSelectedSalesId(Number(e.target.value))}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {salesList.map((sales) => (
                    <option
                      key={`dashboard-sales-${sales.id}-${sales.namaSales}`}
                      value={sales.id}
                    >
                      {sales.namaSales}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
            >
              {refreshing ? <LoadingSpinner size="sm" color="red" /> : null}
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {refreshing ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))
              ) : (
                <>
                  {/* Total Penjualan */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">
                          Total Penjualan
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {currentMetrics.totalPenjualan.toLocaleString(
                            "id-ID"
                          )}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600 font-medium">
                            Real Data
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Total Orders */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">
                          Total Orders
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {currentMetrics.totalOrders}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-sm text-blue-600 font-medium">
                            Real Data
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Active Sales */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">
                          Total Sales
                        </p>
                        <p className="text-3xl font-bold text-purple-600">
                          {currentMetrics.uniqueCustomers}
                        </p>
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                          <span className="text-sm text-purple-600 font-medium">
                            Real Data
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">
                          Jenis Produk
                        </p>
                        <p className="text-3xl font-bold text-orange-600">
                          {currentMetrics.uniqueProducts}
                        </p>
                        <div className="flex items-center mt-2">
                          <Package className="h-4 w-4 text-orange-500 mr-1" />
                          <span className="text-sm text-orange-600 font-medium">
                            Real Data
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Products */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {activeTab === "overview" && "Top Produk Terlaris"}
                    {activeTab === "sales" && "Top Produk Sales"}
                    {activeTab === "weekly" && "Top Minggu Terlaris"}
                  </h3>
                  <BarChart3 className="h-5 w-5 text-slate-500" />
                </div>
                {refreshing ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse flex items-center p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentMetrics.displayData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-semibold text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {activeTab === "weekly"
                                ? (item as TotalMingguData).namaMinggu
                                : (item as any).namaProduk ||
                                  (item as any).product}
                            </p>
                            <p className="text-xs text-slate-500">
                              {activeTab === "weekly"
                                ? `${
                                    (item as TotalMingguData).jumlahTransaksi ||
                                    0
                                  } transaksi`
                                : `${
                                    (item as any).totalPenjualan ||
                                    (item as any).revenue ||
                                    0
                                  } total`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {activeTab === "weekly"
                              ? (
                                  item as TotalMingguData
                                ).totalPenjualan.toLocaleString("id-ID")
                              : (
                                  (item as any).totalPenjualan ||
                                  (item as any).revenue ||
                                  0
                                ).toLocaleString("id-ID")}
                          </p>
                          <div className="flex items-center text-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            <span className="text-xs">+12.5%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg border border-blue-200 transition-all duration-200">
                    <div className="flex items-center">
                      <ShoppingCart className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="font-medium text-blue-800">
                        Tambah Penjualan Baru
                      </span>
                    </div>
                    <span className="text-blue-600">→</span>
                  </button>

                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg border border-green-200 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      {refreshing ? (
                        <LoadingSpinner size="sm" color="green" />
                      ) : (
                        <BarChart3 className="h-5 w-5 text-green-600" />
                      )}
                      <span className="font-medium text-green-800 ml-3">
                        {refreshing ? "Memuat..." : "Refresh Data"}
                      </span>
                    </div>
                    <span className="text-green-600">→</span>
                  </button>

                  <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg border border-purple-200 transition-all duration-200">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="font-medium text-purple-800">
                        Generate Laporan
                      </span>
                    </div>
                    <span className="text-purple-600">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">
                Aktivitas Terbaru
              </h3>
              {refreshing ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="w-10 h-10 bg-gray-300 rounded-full mr-4"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentMetrics.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">
                          Penjualan baru dari{" "}
                          {item.sales?.namaSales || "Unknown"}
                        </p>
                        <p className="text-sm text-slate-500">
                          Produk: {item.produk?.namaProduk || "Unknown"} •
                          Kuantitas: {item.kuantitas || "1"} unit • Jalur:{" "}
                          {item.jalur?.namaJalur || "Pasar Langsung"} • Harga
                          per unit:{" "}
                          {Number(item.jumlahPenjualan || 0).toLocaleString(
                            "id-ID",
                            { style: "currency", currency: "IDR" }
                          )}{" "}
                          • Total nilai:{" "}
                          {(
                            Number(item.kuantitas || 1) *
                            Number(item.jumlahPenjualan || 0)
                          ).toLocaleString("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          })}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">Baru saja</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LandingPage;
