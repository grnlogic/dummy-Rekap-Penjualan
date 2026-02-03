"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { useAuth } from "@/app/contexts/AuthContext";
import NekoAiChat from "@/app/components/NekoAiChat";

const LandingPage = () => {
  const [salesData, setSalesData] = useState<PenjualanData[]>([]);
  const [totalProdukData, setTotalProdukData] = useState<TotalProdukData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ GUNAKAN useAuth CONTEXT
  const { isAuthenticated, isHydrated, isLoading } = useAuth();

  // Tambahkan state baru ini
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "weekly">(
    "overview"
  );
  const [selectedSalesId, setSelectedSalesId] = useState<number | null>(null);
  const [salesList, setSalesList] = useState<SalesData[]>([]);
  const [totalMingguData, setTotalMingguData] = useState<TotalMingguData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Tambahkan state untuk filter periode
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<PenjualanData[]>(
    []
  );

  // State untuk Network Monitoring
  const [networkData, setNetworkData] = useState<any[]>([]);
  const [networkStatus, setNetworkStatus] = useState<
    "online" | "slow" | "offline"
  >("online");
  const [latency, setLatency] = useState<number>(0);
  const [bandwidth, setBandwidth] = useState<number>(0);

  // ✅ LOAD DATA HANYA JIKA SUDAH AUTHENTICATED
  useEffect(() => {
    if (isHydrated && isAuthenticated && !isLoading) {
      loadDashboardData();
    }
  }, [isHydrated, isAuthenticated, isLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // ✅ TAMBAH DEBUG AUTHENTICATION
      console.log("🔍 Checking authentication before loading data...");

      // Test public endpoint first
      const publicEndpointOk = await apiService.testPublicEndpoint();
      console.log("🔍 Public endpoint test:", publicEndpointOk);

      const isAuthenticated = await apiService.testAuthentication();
      console.log("🔍 Authentication status:", isAuthenticated);

      // ✅ TAMBAH DEBUG TOKEN
      const token =
        localStorage.getItem("sessionId") || localStorage.getItem("authToken");
      console.log(
        "🔍 Current token:",
        token ? token.substring(0, 20) + "..." : "null"
      );

      const [
        penjualanData,
        totalProduk,
        salesListData,
        totalMinggu,
        periodeResponse,
      ] = await Promise.all([
        apiService.getAllPenjualan(),
        apiService.getTotalPenjualanPerProduk(),
        apiService.getAllSales(),
        apiService.getTotalPenjualanPerMinggu(),
        apiService.getAllPeriode(),
      ]);

      setSalesData(penjualanData);
      setTotalProdukData(totalProduk);

      const filteredSales = getCachedFilteredData(
        "dashboard-sales",
        salesListData,
        (data) => removeDuplicatesByName(data, "namaSales")
      );

      setSalesList(filteredSales);
      setTotalMingguData(totalMinggu);
      setPeriodeList(periodeResponse);

      // Set filtered data awal (semua data)
      setFilteredSalesData(penjualanData);

      // Set default periode (periode terbaru)
      if (periodeResponse.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(periodeResponse[0].id);
      }

      setError(null);
    } catch (err: any) {
      console.error("Dashboard data loading error:", err);
      setError("Gagal memuat data dashboard");

      // ✅ CEK JIKA ERROR KARENA TOKEN/AUTH ISSUES
      if (
        err?.message?.includes("401") ||
        err?.message?.includes("Unauthorized") ||
        err?.message?.includes("fetch") ||
        err?.status === 401
      ) {
        console.log("🚨 Authentication error detected, redirecting to login");
        sweetAlert
          .error(
            "Sesi Berakhir",
            "Sesi login Anda telah berakhir. Silakan login kembali."
          )
          .then(() => {
            import("../utils/authUtils").then(({ redirectToLogin }) => {
              redirectToLogin("Session expired during data loading");
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
              // Redirect ke login jika user pilih login ulang
              import("../utils/authUtils").then(({ redirectToLogin }) => {
                redirectToLogin("User requested login from error dialog");
              });
            }
          });
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter data berdasarkan periode yang dipilih
  useEffect(() => {
    if (selectedPeriodId) {
      const filtered = salesData.filter(
        (item) => item.periode?.id === selectedPeriodId
      );
      setFilteredSalesData(filtered);
    } else {
      setFilteredSalesData(salesData);
    }
  }, [selectedPeriodId, salesData]);

  // Pisahkan data berdasarkan tipeTransaksi
  const penjualanNormal = filteredSalesData.filter(
    (item) =>
      !item.tipeTransaksi || item.tipeTransaksi.toUpperCase() === "PENJUALAN"
  );
  const penjualanReturn = filteredSalesData.filter(
    (item) =>
      item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
  );
  const penjualanBS = filteredSalesData.filter(
    (item) => item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
  );

  // Total penjualan: penjualan - return - bs
  const totalPenjualan =
    penjualanNormal.reduce(
      (sum, item) =>
        sum + Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
      0
    ) -
    penjualanReturn.reduce(
      (sum, item) =>
        sum + Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
      0
    ) -
    penjualanBS.reduce(
      (sum, item) =>
        sum + Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
      0
    );

  // Total orders: hanya penjualan normal
  const totalOrders = penjualanNormal.length;
  // Total units: penjualan - return - bs
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

  // Unique customers/products: hanya dari penjualan normal
  const uniqueCustomers = new Set(
    penjualanNormal.map((item) => item.sales?.namaSales).filter(Boolean)
  ).size;
  const uniqueProducts = new Set(
    penjualanNormal.map((item) => item.produk?.namaProduk).filter(Boolean)
  ).size;

  // Tambahkan summary return/bs
  const totalReturn = penjualanReturn.reduce(
    (sum, item) =>
      sum + Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
    0
  );
  const totalBS = penjualanBS.reduce(
    (sum, item) =>
      sum + Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
    0
  );

  // Tambahkan setelah loadDashboardData
  const getFilteredDataBySales = (salesId: number) => {
    return filteredSalesData.filter((item) => item.sales?.id === salesId);
  };

  const getSalesMetrics = (salesId: number) => {
    const filteredData = getFilteredDataBySales(salesId);
    const totalPenjualanSales = filteredData.reduce((sum, item) => {
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      return sum + kuantitas * hargaPerUnit;
    }, 0);

    return {
      totalPenjualan: totalPenjualanSales,
      totalOrders: filteredData.length,
      topProducts: getTopProductsForSales(filteredData),
    };
  };

  const getTopProductsForSales = (salesData: PenjualanData[]) => {
    const productMap = new Map();
    salesData.forEach((item) => {
      const productName = item.produk?.namaProduk || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;
      // Jika tipeTransaksi RETURN/BS, totalValue dikurangkan
      const isReturn =
        item.tipeTransaksi &&
        ["RETURN", "BS"].includes(item.tipeTransaksi.toUpperCase());
      const valueToAdd = isReturn ? -totalValue : totalValue;
      const qtyToAdd = isReturn ? -kuantitas : kuantitas;
      if (productMap.has(productName)) {
        const existing = productMap.get(productName);
        productMap.set(productName, {
          namaProduk: productName,
          totalPenjualan: existing.totalPenjualan + valueToAdd,
          totalKuantitas: existing.totalKuantitas + qtyToAdd,
          jumlahTransaksi: existing.jumlahTransaksi + 1,
        });
      } else {
        productMap.set(productName, {
          namaProduk: productName,
          totalPenjualan: valueToAdd,
          totalKuantitas: qtyToAdd,
          jumlahTransaksi: 1,
        });
      }
    });
    return Array.from(productMap.entries())
      .map(([_, data]) => data)
      .sort((a, b) => b.totalPenjualan - a.totalPenjualan)
      .slice(0, 5);
  };

  // Fungsi untuk monitoring jaringan
  const monitorNetwork = useCallback(async () => {
    try {
      const startTime = Date.now();

      // Test koneksi ke API (fallback ke external service jika API tidak tersedia)
      let response = null;
      try {
        response = await fetch("/api/ping", {
          method: "GET",
          cache: "no-cache",
        });
      } catch (error) {
        // Fallback: test dengan Google DNS
        response = await fetch("https://8.8.8.8", {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
        }).catch(() => null);
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Update latency
      setLatency(responseTime);

      // Tentukan status berdasarkan response time
      let status: "online" | "slow" | "offline" = "online";
      if (!response) {
        status = "offline";
      } else if (responseTime > 1000) {
        status = "slow";
      }

      setNetworkStatus(status);

      // Generate bandwidth data (simulasi)
      const currentBandwidth = Math.random() * 100 + 50; // 50-150 Mbps
      setBandwidth(currentBandwidth);

      // Update network data untuk chart
      const now = new Date();
      const newDataPoint = {
        time: now.toLocaleTimeString(),
        latency: responseTime,
        bandwidth: currentBandwidth,
        timestamp: now.getTime(),
      };

      setNetworkData((prev) => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points
        return updated.slice(-20);
      });
    } catch (error) {
      console.error("Network monitoring error:", error);
      setNetworkStatus("offline");
      setLatency(0);
      setBandwidth(0);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "sales" && salesList.length > 0 && !selectedSalesId) {
      setSelectedSalesId(salesList[0].id);
    }
  }, [activeTab, salesList]);

  // Monitoring jaringan setiap 5 detik
  useEffect(() => {
    // Initial monitoring
    monitorNetwork();

    // Set interval untuk monitoring berkelanjutan
    const interval = setInterval(monitorNetwork, 5000);

    return () => clearInterval(interval);
  }, [monitorNetwork]);

  // Tambahkan method untuk laporan minggu
  const getWeeklyMetrics = () => {
    const weeklyMap = new Map();

    // Process raw sales data untuk weekly metrics
    filteredSalesData.forEach((item) => {
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
      recentActivity: filteredSalesData.slice(-3).reverse(),
    };
  };

  // Update currentMetrics
  const getCurrentMetrics = () => {
    if (activeTab === "overview") {
      return {
        totalPenjualan,
        totalReturn,
        totalBS,
        totalOrders,
        uniqueCustomers,
        uniqueProducts,
        displayData: getTopProductsForSales(filteredSalesData),
        recentActivity: filteredSalesData.slice(-3).reverse(),
      };
    } else if (activeTab === "weekly") {
      // Filter per minggu: ambil data minggu yang aktif (bisa dikembangkan jika ada filter minggu)
      // Untuk sekarang, gunakan seluruh data mingguan
      const weeklyMetrics = getWeeklyMetrics();
      return {
        totalPenjualan: weeklyMetrics.totalPenjualan,
        totalReturn: penjualanReturn.reduce(
          (sum, item) =>
            sum +
            Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
          0
        ),
        totalBS: penjualanBS.reduce(
          (sum, item) =>
            sum +
            Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
          0
        ),
        totalOrders: weeklyMetrics.totalOrders,
        uniqueCustomers: weeklyMetrics.uniqueCustomers,
        uniqueProducts: weeklyMetrics.uniqueProducts,
        displayData: weeklyMetrics.displayData,
        recentActivity: weeklyMetrics.recentActivity,
      };
    } else if (activeTab === "sales" && selectedSalesId) {
      const filteredData = getFilteredDataBySales(selectedSalesId);
      const penjualanNormalSales = filteredData.filter(
        (item) =>
          !item.tipeTransaksi ||
          item.tipeTransaksi.toUpperCase() === "PENJUALAN"
      );
      const penjualanReturnSales = filteredData.filter(
        (item) =>
          item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
      );
      const penjualanBSSales = filteredData.filter(
        (item) =>
          item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
      );
      return {
        totalPenjualan:
          penjualanNormalSales.reduce(
            (sum, item) =>
              sum +
              Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
            0
          ) -
          penjualanReturnSales.reduce(
            (sum, item) =>
              sum +
              Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
            0
          ) -
          penjualanBSSales.reduce(
            (sum, item) =>
              sum +
              Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
            0
          ),
        totalReturn: penjualanReturnSales.reduce(
          (sum, item) =>
            sum +
            Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
          0
        ),
        totalBS: penjualanBSSales.reduce(
          (sum, item) =>
            sum +
            Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
          0
        ),
        totalOrders: penjualanNormalSales.length,
        uniqueCustomers: 1,
        uniqueProducts: new Set(
          filteredData.map((item) => item.produk?.namaProduk).filter(Boolean)
        ).size,
        displayData: getTopProductsForSales(filteredData),
        recentActivity: filteredData.slice(-3).reverse(),
      };
    } else {
      return {
        totalPenjualan: 0,
        totalReturn: 0,
        totalBS: 0,
        totalOrders: 0,
        uniqueCustomers: 0,
        uniqueProducts: 0,
        displayData: [],
        recentActivity: [],
      };
    }
  };

  const currentMetrics = getCurrentMetrics();

  const debugData = () => {
    // Keep for development debugging if needed
    if (process.env.NODE_ENV === "development") {
      console.log("🐛 Debug Dashboard Data:");
      console.log("- Sales Data:", salesData);
      console.log("- Total Produk Data:", totalProdukData);
      console.log("- Sales List:", salesList);
      console.log("- Loading:", loading);
      console.log("- Error:", error);

      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        console.log(`- ${key}:`, localStorage.getItem(key));
      });
    }
  };

  // Update method untuk menyiapkan data dashboard untuk NEKO AI - PERBAIKAN
  const prepareDashboardDataForAI = () => {
    const dashboardData = {
      // Data utama yang ditampilkan
      totalPenjualan: currentMetrics.totalPenjualan,
      totalOrders: currentMetrics.totalOrders,
      uniqueCustomers: currentMetrics.uniqueCustomers,
      uniqueProducts: currentMetrics.uniqueProducts,

      // Context informasi
      activeTab,
      selectedSalesId,

      // Data mentah untuk analisis mendalam
      rawSalesData: salesData,
      rawTotalProdukData: totalProdukData,
      rawTotalMingguData: totalMingguData,

      // Data yang sudah diproses
      displayData: currentMetrics.displayData.slice(0, 10),
      recentActivity: currentMetrics.recentActivity,

      // Sales list info
      salesList: salesList.map((s) => ({
        id: s.id,
        namaSales: s.namaSales,
        isSelected: s.id === selectedSalesId,
      })),

      // Metadata
      pageType: "dashboard",
      timestamp: new Date().toISOString(),
      dataSource: "dashboard-real-time",

      // Debug info untuk troubleshooting
      debugInfo: {
        salesDataLength: salesData.length,
        totalProdukDataLength: totalProdukData.length,
        totalMingguDataLength: totalMingguData.length,
        salesListLength: salesList.length,
        hasValidData: salesData.length > 0,
        currentTab: activeTab,
        selectedSales: selectedSalesId
          ? salesList.find((s) => s.id === selectedSalesId)?.namaSales
          : null,
        sampleData: {
          latestSale: salesData[salesData.length - 1] || null,
          topProduct: totalProdukData[0] || null,
        },
      },

      // Calculated metrics untuk context tambahan
      calculatedMetrics: {
        avgOrderValue:
          currentMetrics.totalOrders > 0
            ? Math.round(
                currentMetrics.totalPenjualan / currentMetrics.totalOrders
              )
            : 0,
        totalUnitsFromSales: salesData.reduce(
          (sum, item) => sum + Number(item.kuantitas || 1),
          0
        ),
        revenuePerSales:
          currentMetrics.uniqueCustomers > 0
            ? Math.round(
                currentMetrics.totalPenjualan / currentMetrics.uniqueCustomers
              )
            : 0,
      },
    };

    console.log("🔍 Dashboard Data for AI:", dashboardData);
    return dashboardData;
  };

  // Fungsi untuk Top Produk Return
  const getTopReturnProducts = () => {
    // Gabungkan return dan BS
    const returnItems = filteredSalesData.filter(
      (item) =>
        item.tipeTransaksi &&
        ["RETURN", "BS"].includes(item.tipeTransaksi.toUpperCase())
    );
    const productMap = new Map();
    returnItems.forEach((item) => {
      const productName = item.produk?.namaProduk || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;
      if (productMap.has(productName)) {
        const existing = productMap.get(productName);
        productMap.set(productName, {
          namaProduk: productName,
          totalReturn: existing.totalReturn + totalValue,
          totalKuantitas: existing.totalKuantitas + kuantitas,
          jumlahTransaksi: existing.jumlahTransaksi + 1,
        });
      } else {
        productMap.set(productName, {
          namaProduk: productName,
          totalReturn: totalValue,
          totalKuantitas: kuantitas,
          jumlahTransaksi: 1,
        });
      }
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.totalReturn - a.totalReturn)
      .slice(0, 5);
  };

  // Update loading condition
  if (!isHydrated || loading) {
    return <PageLoader text="Memverifikasi session dan memuat dashboard..." />;
  }

  // Function untuk refresh data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
    } catch (error) {
      console.error("Error refreshing data:", error);
      sweetAlert.error("Error", "Gagal me-refresh data dashboard");
    } finally {
      setRefreshing(false);
    }
  };

  // Component untuk Line Chart sederhana
  const SimpleLineChart = ({ data, dataKey, color, label }: any) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map((d: any) => d[dataKey]));
    const minValue = Math.min(...data.map((d: any) => d[dataKey]));
    const range = maxValue - minValue || 1;

    const points = data
      .map((d: any, index: number) => {
        // Prevent division by zero for single data point
        const x = data.length > 1 ? (index / (data.length - 1)) * 300 : 150; // Width 300px, center if single point
        const y = 80 - ((d[dataKey] - minValue) / range) * 60; // Height 80px, padding 10px
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-sm text-slate-600">
            {data[data.length - 1]?.[dataKey]?.toFixed(
              dataKey === "latency" ? 0 : 1
            )}
            {dataKey === "latency" ? "ms" : "Mbps"}
          </span>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <svg width="300" height="80" className="w-full">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={points}
            />
            {data.map((d: any, index: number) => {
              // Prevent division by zero for single data point
              const x =
                data.length > 1 ? (index / (data.length - 1)) * 300 : 150;
              const y = 80 - ((d[dataKey] - minValue) / range) * 60;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={color}
                  className="opacity-70"
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

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

        {/* Filter Periode - TAMBAHKAN INI */}
        <div className="bg-white rounded-xl shadow-lg mb-6 border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Filter Data Berdasarkan Periode
              </h3>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-slate-700">
                  Pilih Bulan:
                </label>
                <select
                  value={selectedPeriodId || "all"}
                  onChange={(e) =>
                    setSelectedPeriodId(
                      e.target.value === "all" ? null : Number(e.target.value)
                    )
                  }
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                >
                  <option value="all">Semua Periode</option>
                  {periodeList.map((periode) => (
                    <option key={periode.id} value={periode.id}>
                      {periode.namaPeriode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span>Data Ditampilkan:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-medium">
                {filteredSalesData.length} transaksi
              </span>
              {selectedPeriodId && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg font-medium">
                  {periodeList.find((p) => p.id === selectedPeriodId)
                    ?.namaPeriode || "Periode"}
                </span>
              )}
            </div>
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
            {/* Metrics Cards - Revenue Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Ringkasan Pendapatan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Penjualan */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Total Penjualan
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {(currentMetrics.totalPenjualan || 0).toLocaleString(
                          "id-ID"
                        )}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600 font-medium">
                          Net Penjualan
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                {/* Total Return */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Total Return
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {(currentMetrics.totalReturn || 0).toLocaleString(
                          "id-ID"
                        )}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-sm text-red-600 font-medium">
                          Return
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
                {/* Total BS */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Total BS
                      </p>
                      <p className="text-3xl font-bold text-orange-600">
                        {(currentMetrics.totalBS || 0).toLocaleString("id-ID")}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingDown className="h-4 w-4 text-orange-500 mr-1" />
                        <span className="text-sm text-orange-600 font-medium">
                          Barang Susut
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Cards - Operational Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Ringkasan Operasional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Orders */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Total Orders
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {(currentMetrics.totalOrders || 0).toLocaleString(
                          "id-ID"
                        )}
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
                {/* Total Sales */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Total Sales
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {(currentMetrics.uniqueCustomers || 0).toLocaleString(
                          "id-ID"
                        )}
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
                {/* Jenis Produk */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Jenis Produk
                      </p>
                      <p className="text-3xl font-bold text-orange-600">
                        {(currentMetrics.uniqueProducts || 0).toLocaleString(
                          "id-ID"
                        )}
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
              </div>
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

              {/* Top Produk Return */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Produk Return
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
                    {getTopReturnProducts().map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-semibold text-red-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {item.namaProduk}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.totalReturn.toLocaleString("id-ID")} total
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.totalReturn.toLocaleString("id-ID")}
                          </p>
                          <div className="flex items-center text-red-600">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            <span className="text-xs">Return</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Network Monitoring Dropdown */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 relative">
              {/* Status Badge Mengambang */}
              <div className="absolute -top-3 right-4 z-10">
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full shadow-lg border-2 border-white ${
                    networkStatus === "online"
                      ? "bg-green-100"
                      : networkStatus === "slow"
                      ? "bg-yellow-100"
                      : "bg-red-100"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      networkStatus === "online"
                        ? "bg-green-500"
                        : networkStatus === "slow"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span
                    className={`text-xs font-medium ${
                      networkStatus === "online"
                        ? "text-green-700"
                        : networkStatus === "slow"
                        ? "text-yellow-700"
                        : "text-red-700"
                    }`}
                  >
                    {networkStatus === "online"
                      ? "Stabil"
                      : networkStatus === "slow"
                      ? "Lambat"
                      : "Offline"}
                  </span>
                </div>
              </div>

              {/* Dropdown Content */}
              <details className="group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-slate-50 transition-colors rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        Network Monitoring
                      </h3>
                      <p className="text-sm text-slate-600">
                        Klik untuk lihat detail jaringan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">{latency}ms</span>
                    <TrendingUp className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" />
                  </div>
                </summary>

                {/* Dropdown Content */}
                <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                  {/* Network Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">
                            Latency
                          </p>
                          <p className="text-2xl font-bold text-blue-800">
                            {latency}ms
                          </p>
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            latency < 100
                              ? "bg-green-500"
                              : latency < 500
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          <Globe className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">
                            Bandwidth
                          </p>
                          <p className="text-2xl font-bold text-green-800">
                            {bandwidth.toFixed(1)} Mbps
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-700">
                            Data Points
                          </p>
                          <p className="text-2xl font-bold text-purple-800">
                            {networkData.length}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Charts */}
                  <div className="space-y-4 mb-4">
                    <SimpleLineChart
                      data={networkData}
                      dataKey="latency"
                      color="#3B82F6"
                      label="Latency Response Time"
                    />
                    <SimpleLineChart
                      data={networkData}
                      dataKey="bandwidth"
                      color="#10B981"
                      label="Bandwidth Usage"
                    />
                  </div>

                  {/* Network Health Summary */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          Network Health
                        </p>
                        <p className="text-xs text-slate-600">
                          Monitoring aktif sejak{" "}
                          {networkData.length > 0
                            ? new Date(
                                networkData[0]?.timestamp
                              ).toLocaleTimeString()
                            : "belum tersedia"}
                        </p>
                      </div>
                      <button
                        onClick={monitorNetwork}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md transition-colors"
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Latency:</span>
                        <span className="font-medium">
                          {networkData.length > 0
                            ? (
                                networkData.reduce(
                                  (sum, d) => sum + d.latency,
                                  0
                                ) / networkData.length
                              ).toFixed(0) + "ms"
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Bandwidth:</span>
                        <span className="font-medium">
                          {networkData.length > 0
                            ? (
                                networkData.reduce(
                                  (sum, d) => sum + d.bandwidth,
                                  0
                                ) / networkData.length
                              ).toFixed(1) + " Mbps"
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </>
        )}
      </main>

      {/* NEKO AI Chat - tambahkan di bagian paling bawah sebelum closing div */}
      <NekoAiChat dashboardData={prepareDashboardDataForAI()} />
    </div>
  );
};

export default LandingPage;
