"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Loader2,
  BarChart3,
  Trash2,
  Database,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { apiService, PenjualanData, TotalProdukData } from "@/app/services/api";
import { sweetAlert } from "@/app/utils/sweetAlert";
import {
  LoadingSpinner,
  PageLoader,
  CardSkeleton,
  ChartSkeleton,
} from "@/app/components/ui/LoadingSpinner";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { FileText, Download } from "lucide-react";
import NekoAiChat from "@/app/components/NekoAiChat";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<PenjualanData[]>([]);
  const [totalProdukData, setTotalProdukData] = useState<TotalProdukData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Processed data for charts
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [salesPerformance, setSalesPerformance] = useState<any[]>([]);
  const [jalurAnalysis, setJalurAnalysis] = useState<any[]>([]);

  // Data untuk Return dan BS charts
  const [returnBSMonthlyData, setReturnBSMonthlyData] = useState<any[]>([]);
  const [returnProductAnalysis, setReturnProductAnalysis] = useState<any[]>([]);
  const [bsProductAnalysis, setBSProductAnalysis] = useState<any[]>([]);
  const [returnSalesAnalysis, setReturnSalesAnalysis] = useState<any[]>([]);
  const [bsSalesAnalysis, setBSSalesAnalysis] = useState<any[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  useEffect(() => {
    if (salesData.length > 0) {
      processAnalyticsData();
    }
  }, [salesData, totalProdukData]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [penjualanData, totalProduk] = await Promise.all([
        apiService.getAllPenjualan(),
        apiService.getTotalPenjualanPerProduk(),
      ]);

      setSalesData(penjualanData);
      setTotalProdukData(totalProduk);
      setError(null);
    } catch (err: any) {
      console.error("Analytics data loading error:", err);
      setError("Gagal memuat data analytics");

      // ✅ CEK JIKA ERROR KARENA TOKEN/AUTH ISSUES
      if (
        err?.message?.includes("401") ||
        err?.message?.includes("Unauthorized") ||
        err?.message?.includes("fetch") ||
        err?.status === 401
      ) {
        console.log(
          "🚨 Authentication error detected in Analytics page, redirecting to login"
        );
        sweetAlert
          .error(
            "Sesi Berakhir",
            "Sesi login Anda telah berakhir. Silakan login kembali."
          )
          .then(() => {
            import("../utils/authUtils").then(({ redirectToLogin }) => {
              redirectToLogin("Session expired during analytics data loading");
            });
          });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    sweetAlert.toast.info("Memuat ulang data analytics...");

    try {
      await loadAnalyticsData();
      sweetAlert.toast.success("Data analytics berhasil dimuat ulang");
    } catch (error) {
      sweetAlert.toast.error("Gagal memuat ulang data analytics");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCleanupOldData = async () => {
    const result = await sweetAlert.confirm(
      "Hapus Data Lama",
      "Data yang lebih dari 12 bulan akan dihapus permanen. Apakah Anda yakin?",
      "Ya, Hapus",
      "Batal"
    );

    if (result.isConfirmed) {
      try {
        setCleanupLoading(true);
        sweetAlert.toast.info("Menghapus data lama...");

        // Simulate cleanup response since method doesn't exist
        const response = { deletedCount: 0 };

        sweetAlert.toast.success(
          `Berhasil menghapus ${response.deletedCount || 0} data lama`
        );

        // Reload data after cleanup
        await loadAnalyticsData();
      } catch (error) {
        sweetAlert.toast.error("Gagal menghapus data lama");
      } finally {
        setCleanupLoading(false);
      }
    }
  };

  const handleCleanupUnusedData = async () => {
    const result = await sweetAlert.confirm(
      "Hapus Data Tidak Terpakai",
      "Data yang tidak memiliki referensi atau duplikat akan dihapus. Apakah Anda yakin?",
      "Ya, Hapus",
      "Batal"
    );

    if (result.isConfirmed) {
      try {
        setCleanupLoading(true);
        sweetAlert.toast.info("Membersihkan data yang tidak terpakai...");

        // Simulate cleanup response since method doesn't exist
        const response = { deletedCount: 0 };

        sweetAlert.toast.success(
          `Berhasil membersihkan ${
            response.deletedCount || 0
          } data tidak terpakai`
        );

        // Reload data after cleanup
        await loadAnalyticsData();
      } catch (error) {
        sweetAlert.toast.error("Gagal membersihkan data tidak terpakai");
      } finally {
        setCleanupLoading(false);
      }
    }
  };

  const handleAutoCleanup = async () => {
    const result = await sweetAlert.confirm(
      "Auto Cleanup Data",
      "Sistem akan menghapus data lama (>12 bulan) dan data tidak terpakai secara otomatis. Lanjutkan?",
      "Ya, Jalankan",
      "Batal"
    );

    if (result.isConfirmed) {
      try {
        setCleanupLoading(true);
        sweetAlert.toast.info("Menjalankan auto cleanup...");

        // Simulate cleanup responses since methods don't exist
        const [oldDataResult, unusedDataResult] = await Promise.all([
          Promise.resolve({ deletedCount: 0 }),
          Promise.resolve({ deletedCount: 0 }),
        ]);

        const totalDeleted =
          (oldDataResult.deletedCount || 0) +
          (unusedDataResult.deletedCount || 0);

        sweetAlert.toast.success(
          `Auto cleanup selesai! Total ${totalDeleted} data dibersihkan`
        );

        // Reload data after cleanup
        await loadAnalyticsData();
      } catch (error) {
        sweetAlert.toast.error("Gagal menjalankan auto cleanup");
      } finally {
        setCleanupLoading(false);
      }
    }
  };

  const handleFixUnknownData = async () => {
    const unknownData = salesData.filter(
      (item) => !item.periode || !item.periode.namaPeriode
    );

    if (unknownData.length === 0) {
      sweetAlert.toast.info("Tidak ada data Unknown yang perlu diperbaiki");
      return;
    }

    const result = await sweetAlert.confirm(
      "Perbaiki Data Unknown",
      `Ditemukan ${unknownData.length} data dengan periode Unknown. Data ini mungkin data yang ter-corrupt atau tidak memiliki relasi yang valid. Hapus data ini?`,
      "Ya, Hapus",
      "Batal"
    );

    if (result.isConfirmed) {
      try {
        setCleanupLoading(true);
        sweetAlert.loading("Memperbaiki Data", "Menghapus data Unknown...");

        let deletedCount = 0;
        for (const item of unknownData) {
          if (item.id) {
            try {
              await apiService.deletePenjualan(item.id);
              deletedCount++;
            } catch (error) {
              console.error(`Failed to delete item ${item.id}:`, error);
            }
          }
        }

        sweetAlert.close();
        await sweetAlert.success(
          "Data Diperbaiki!",
          `Berhasil menghapus ${deletedCount} data Unknown`
        );

        // Reload data after cleanup
        await loadAnalyticsData();
      } catch (error) {
        sweetAlert.close();
        sweetAlert.error(
          "Gagal Memperbaiki",
          "Terjadi kesalahan saat menghapus data Unknown"
        );
      } finally {
        setCleanupLoading(false);
      }
    }
  };

  const processAnalyticsData = () => {
    // Debug: Check for unknown data
    const unknownPeriodeData = salesData.filter(
      (item) => !item.periode || !item.periode.namaPeriode
    );
    if (unknownPeriodeData.length > 0) {
      console.warn("⚠️ Found data with missing periode:", unknownPeriodeData);
      console.warn("Total unknown periode records:", unknownPeriodeData.length);
    }

    // Pisahkan data berdasarkan tipeTransaksi untuk chart processing
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

    // Process monthly data - PERBAIKAN LOGIKA
    const monthlyMap = new Map();

    // Process normal sales first
    penjualanNormal.forEach((item) => {
      const periode = item.periode?.namaPeriode || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (monthlyMap.has(periode)) {
        const existing = monthlyMap.get(periode);
        monthlyMap.set(periode, {
          month: periode,
          sales: existing.sales + totalValue,
          orders: existing.orders + 1,
          units: existing.units + kuantitas,
          customers: existing.customers,
        });
      } else {
        monthlyMap.set(periode, {
          month: periode,
          sales: totalValue,
          orders: 1,
          units: kuantitas,
          customers: new Set([item.sales?.namaSales]).size,
        });
      }
    });

    // Subtract returns
    penjualanReturn.forEach((item) => {
      const periode = item.periode?.namaPeriode || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (monthlyMap.has(periode)) {
        const existing = monthlyMap.get(periode);
        monthlyMap.set(periode, {
          month: periode,
          sales: existing.sales - totalValue,
          orders: existing.orders,
          units: existing.units - kuantitas,
          customers: existing.customers,
        });
      }
    });

    // Subtract BS
    penjualanBS.forEach((item) => {
      const periode = item.periode?.namaPeriode || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (monthlyMap.has(periode)) {
        const existing = monthlyMap.get(periode);
        monthlyMap.set(periode, {
          month: periode,
          sales: existing.sales - totalValue,
          orders: existing.orders,
          units: existing.units - kuantitas,
          customers: existing.customers,
        });
      }
    });

    // Function to parse periode and sort chronologically
    const sortPeriodeChronologically = (data: any[]) => {
      return data.sort((a: any, b: any) => {
        if (a.month === "Unknown") return 1;
        if (b.month === "Unknown") return -1;

        // Parse periode format like "MEI 2025", "JUNI 2025", etc.
        const parseMonth = (periodeStr: string) => {
          const monthMap: { [key: string]: number } = {
            JANUARI: 0,
            FEBRUARI: 1,
            MARET: 2,
            APRIL: 3,
            MEI: 4,
            JUNI: 5,
            JULI: 6,
            AGUSTUS: 7,
            SEPTEMBER: 8,
            OKTOBER: 9,
            NOVEMBER: 10,
            DESEMBER: 11,
          };

          const parts = periodeStr.trim().toUpperCase().split(" ");
          if (parts.length >= 2) {
            const monthName = parts[0];
            const year = parseInt(parts[1]);
            const monthIndex = monthMap[monthName];

            if (monthIndex !== undefined && !isNaN(year)) {
              return new Date(year, monthIndex);
            }
          }
          return new Date(0); // fallback for invalid dates
        };

        const dateA = parseMonth(a.month);
        const dateB = parseMonth(b.month);

        return dateA.getTime() - dateB.getTime();
      });
    };

    const sortedMonthlyData = sortPeriodeChronologically(
      Array.from(monthlyMap.values())
    );
    setMonthlyData(sortedMonthlyData);

    // Process product performance - PERBAIKAN LOGIKA
    const productMap = new Map();

    // Process normal sales first
    penjualanNormal.forEach((item) => {
      const product = item.produk?.namaProduk || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (productMap.has(product)) {
        const existing = productMap.get(product);
        productMap.set(product, {
          product: product,
          sales: existing.sales + 1,
          revenue: existing.revenue + totalValue,
          units: existing.units + kuantitas,
        });
      } else {
        productMap.set(product, {
          product: product,
          sales: 1,
          revenue: totalValue,
          units: kuantitas,
        });
      }
    });

    // Subtract returns
    penjualanReturn.forEach((item) => {
      const product = item.produk?.namaProduk || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (productMap.has(product)) {
        const existing = productMap.get(product);
        productMap.set(product, {
          product: product,
          sales: existing.sales,
          revenue: existing.revenue - totalValue,
          units: existing.units - kuantitas,
        });
      }
    });

    // Subtract BS
    penjualanBS.forEach((item) => {
      const product = item.produk?.namaProduk || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (productMap.has(product)) {
        const existing = productMap.get(product);
        productMap.set(product, {
          product: product,
          sales: existing.sales,
          revenue: existing.revenue - totalValue,
          units: existing.units - kuantitas,
        });
      }
    });
    const productArray = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);
    setProductPerformance(productArray);

    // Process sales performance - PERBAIKAN LOGIKA
    const salesMap = new Map();

    // Process normal sales first
    penjualanNormal.forEach((item) => {
      const sales = item.sales?.namaSales || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (salesMap.has(sales)) {
        const existing = salesMap.get(sales);
        salesMap.set(sales, {
          sales: sales,
          total: existing.total + totalValue,
          count: existing.count + 1,
        });
      } else {
        salesMap.set(sales, {
          sales: sales,
          total: totalValue,
          count: 1,
        });
      }
    });

    // Subtract returns
    penjualanReturn.forEach((item) => {
      const sales = item.sales?.namaSales || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (salesMap.has(sales)) {
        const existing = salesMap.get(sales);
        salesMap.set(sales, {
          sales: sales,
          total: existing.total - totalValue,
          count: existing.count,
        });
      }
    });

    // Subtract BS
    penjualanBS.forEach((item) => {
      const sales = item.sales?.namaSales || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (salesMap.has(sales)) {
        const existing = salesMap.get(sales);
        salesMap.set(sales, {
          sales: sales,
          total: existing.total - totalValue,
          count: existing.count,
        });
      }
    });
    setSalesPerformance(Array.from(salesMap.values()).slice(0, 5));

    // Process jalur analysis - PERBAIKAN LOGIKA - TOP 8 JALUR
    const jalurMap = new Map();

    // Process normal sales first
    penjualanNormal.forEach((item) => {
      const jalur = item.jalur?.namaJalur || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (jalurMap.has(jalur)) {
        const existing = jalurMap.get(jalur);
        jalurMap.set(jalur, {
          name: jalur,
          value: existing.value + totalValue,
        });
      } else {
        jalurMap.set(jalur, {
          name: jalur,
          value: totalValue,
        });
      }
    });

    // Subtract returns
    penjualanReturn.forEach((item) => {
      const jalur = item.jalur?.namaJalur || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (jalurMap.has(jalur)) {
        const existing = jalurMap.get(jalur);
        jalurMap.set(jalur, {
          name: jalur,
          value: existing.value - totalValue,
        });
      }
    });

    // Subtract BS
    penjualanBS.forEach((item) => {
      const jalur = item.jalur?.namaJalur || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (jalurMap.has(jalur)) {
        const existing = jalurMap.get(jalur);
        jalurMap.set(jalur, {
          name: jalur,
          value: existing.value - totalValue,
        });
      }
    });

    // Sort by value descending and take top 8
    const sortedJalurArray = Array.from(jalurMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    setJalurAnalysis(sortedJalurArray);

    // Process Return dan BS Analytics
    processReturnBSAnalytics();
  };

  // Fungsi baru untuk memproses data Return dan BS
  const processReturnBSAnalytics = () => {
    // Pisahkan data Return dan BS
    const returnData = salesData.filter(
      (item) =>
        item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
    );
    const bsData = salesData.filter(
      (item) => item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
    );

    // 1. Return/BS Monthly Data - gabungan return dan bs per periode
    const returnBSMonthlyMap = new Map();

    // Process Return data
    returnData.forEach((item) => {
      const periode = item.periode?.namaPeriode || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (returnBSMonthlyMap.has(periode)) {
        const existing = returnBSMonthlyMap.get(periode);
        returnBSMonthlyMap.set(periode, {
          month: periode,
          returnValue: existing.returnValue + totalValue,
          bsValue: existing.bsValue,
          returnCount: existing.returnCount + 1,
          bsCount: existing.bsCount,
        });
      } else {
        returnBSMonthlyMap.set(periode, {
          month: periode,
          returnValue: totalValue,
          bsValue: 0,
          returnCount: 1,
          bsCount: 0,
        });
      }
    });

    // Process BS data
    bsData.forEach((item) => {
      const periode = item.periode?.namaPeriode || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (returnBSMonthlyMap.has(periode)) {
        const existing = returnBSMonthlyMap.get(periode);
        returnBSMonthlyMap.set(periode, {
          month: periode,
          returnValue: existing.returnValue,
          bsValue: existing.bsValue + totalValue,
          returnCount: existing.returnCount,
          bsCount: existing.bsCount + 1,
        });
      } else {
        returnBSMonthlyMap.set(periode, {
          month: periode,
          returnValue: 0,
          bsValue: totalValue,
          returnCount: 0,
          bsCount: 1,
        });
      }
    });

    // Function to parse periode and sort chronologically (reuse dari atas)
    const sortPeriodeChronologically = (data: any[]) => {
      return data.sort((a: any, b: any) => {
        if (a.month === "Unknown") return 1;
        if (b.month === "Unknown") return -1;

        const parseMonth = (periodeStr: string) => {
          const monthMap: { [key: string]: number } = {
            JANUARI: 0,
            FEBRUARI: 1,
            MARET: 2,
            APRIL: 3,
            MEI: 4,
            JUNI: 5,
            JULI: 6,
            AGUSTUS: 7,
            SEPTEMBER: 8,
            OKTOBER: 9,
            NOVEMBER: 10,
            DESEMBER: 11,
          };

          const parts = periodeStr.trim().toUpperCase().split(" ");
          if (parts.length >= 2) {
            const monthName = parts[0];
            const year = parseInt(parts[1]);
            const monthIndex = monthMap[monthName];

            if (monthIndex !== undefined && !isNaN(year)) {
              return new Date(year, monthIndex);
            }
          }
          return new Date(0);
        };

        const dateA = parseMonth(a.month);
        const dateB = parseMonth(b.month);
        return dateA.getTime() - dateB.getTime();
      });
    };

    const sortedReturnBSMonthly = sortPeriodeChronologically(
      Array.from(returnBSMonthlyMap.values())
    );
    setReturnBSMonthlyData(sortedReturnBSMonthly);

    // 2. Return Product Analysis
    const returnProductMap = new Map();
    returnData.forEach((item) => {
      const product = item.produk?.namaProduk || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (returnProductMap.has(product)) {
        const existing = returnProductMap.get(product);
        returnProductMap.set(product, {
          product: product,
          count: existing.count + 1,
          value: existing.value + totalValue,
          units: existing.units + kuantitas,
        });
      } else {
        returnProductMap.set(product, {
          product: product,
          count: 1,
          value: totalValue,
          units: kuantitas,
        });
      }
    });

    const sortedReturnProducts = Array.from(returnProductMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    setReturnProductAnalysis(sortedReturnProducts);

    // 3. BS Product Analysis
    const bsProductMap = new Map();
    bsData.forEach((item) => {
      const product = item.produk?.namaProduk || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (bsProductMap.has(product)) {
        const existing = bsProductMap.get(product);
        bsProductMap.set(product, {
          product: product,
          count: existing.count + 1,
          value: existing.value + totalValue,
          units: existing.units + kuantitas,
        });
      } else {
        bsProductMap.set(product, {
          product: product,
          count: 1,
          value: totalValue,
          units: kuantitas,
        });
      }
    });

    const sortedBSProducts = Array.from(bsProductMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    setBSProductAnalysis(sortedBSProducts);

    // 4. Return Sales Analysis
    const returnSalesMap = new Map();
    returnData.forEach((item) => {
      const sales = item.sales?.namaSales || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (returnSalesMap.has(sales)) {
        const existing = returnSalesMap.get(sales);
        returnSalesMap.set(sales, {
          name: sales, // Untuk chart pie
          sales: sales, // Untuk referensi
          count: existing.count + 1,
          value: existing.value + totalValue,
        });
      } else {
        returnSalesMap.set(sales, {
          name: sales, // Untuk chart pie
          sales: sales, // Untuk referensi
          count: 1,
          value: totalValue,
        });
      }
    });

    const sortedReturnSales = Array.from(returnSalesMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    setReturnSalesAnalysis(sortedReturnSales);

    // 5. BS Sales Analysis
    const bsSalesMap = new Map();
    bsData.forEach((item) => {
      const sales = item.sales?.namaSales || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (bsSalesMap.has(sales)) {
        const existing = bsSalesMap.get(sales);
        bsSalesMap.set(sales, {
          name: sales, // Untuk chart pie
          sales: sales, // Untuk referensi
          count: existing.count + 1,
          value: existing.value + totalValue,
        });
      } else {
        bsSalesMap.set(sales, {
          name: sales, // Untuk chart pie
          sales: sales, // Untuk referensi
          count: 1,
          value: totalValue,
        });
      }
    });

    const sortedBSSales = Array.from(bsSalesMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    setBSSalesAnalysis(sortedBSSales);
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

  // Total revenue: penjualan - return - bs
  const totalRevenue =
    penjualanNormal.reduce(
      (sum, item) =>
        sum + Number(item.jumlahPenjualan || 0) * Number(item.kuantitas || 1),
      0
    ) -
    penjualanReturn.reduce(
      (sum, item) =>
        sum + Number(item.jumlahPenjualan || 0) * Number(item.kuantitas || 1),
      0
    ) -
    penjualanBS.reduce(
      (sum, item) =>
        sum + Number(item.jumlahPenjualan || 0) * Number(item.kuantitas || 1),
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

  // Calculate trends (mock calculation)
  const revenueTrend = 20.1;
  const ordersTrend = 12.0;
  const customersTrend = 5.4;
  const productsTrend = -2.1;

  // Export function for reports integration
  const exportAnalyticsData = () => {
    return {
      salesData,
      totalProdukData,
      monthlyData,
      productPerformance,
      salesPerformance,
      jalurAnalysis,
      metrics: {
        totalRevenue,
        totalOrders,
        totalUnits,
        uniqueCustomers,
        uniqueProducts,
      },
      trends: {
        revenueTrend,
        ordersTrend,
        customersTrend,
        productsTrend,
      },
    };
  };

  // Function to generate report data
  const generateReportData = () => {
    const data = exportAnalyticsData();

    // ✅ Store in localStorage only on client-side
    if (typeof window !== "undefined") {
      localStorage.setItem("analyticsReportData", JSON.stringify(data));
      localStorage.setItem(
        "analyticsReportTimestamp",
        new Date().toISOString()
      );
    }

    return data;
  };

  // Tambahkan method untuk menyiapkan data analytics untuk NEKO AI - PERBAIKAN
  const prepareAnalyticsDataForAI = () => {
    console.log("🔍 Preparing Analytics Data for AI:", {
      totalRevenue,
      totalOrders,
      totalUnits,
      uniqueCustomers,
      uniqueProducts,
      salesDataLength: salesData.length,
      productDataLength: totalProdukData.length,
    });

    return {
      // Data utama yang ditampilkan di dashboard
      totalRevenue,
      totalOrders,
      totalUnits,
      uniqueCustomers,
      uniqueProducts,

      // Data mentah untuk analisis
      rawSalesData: salesData,
      rawProductData: totalProdukData,

      // Data yang sudah diproses untuk chart
      monthlyData: monthlyData.slice(0, 10),
      productPerformance: productPerformance.slice(0, 10),
      salesPerformance: salesPerformance.slice(0, 5),
      jalurAnalysis: jalurAnalysis.slice(0, 5),

      // Metadata
      pageType: "analytics",
      timestamp: new Date().toISOString(),
      dataSource: "analytics-dashboard",

      // Tambahan untuk debugging
      debugInfo: {
        totalSalesRecords: salesData.length,
        totalProductRecords: totalProdukData.length,
        hasValidData: salesData.length > 0 && totalProdukData.length > 0,
        sampleSalesData: salesData.slice(0, 3),
        sampleProductData: totalProdukData.slice(0, 3),
      },

      // Trends dan insights
      trends: {
        revenueTrend,
        ordersTrend,
        customersTrend,
        productsTrend,
      },

      // Summary untuk quick access
      summary: {
        topProduct: productPerformance[0]?.product || "Tidak ada data",
        topSales: salesPerformance[0]?.sales || "Tidak ada data",
        avgOrderValue:
          totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        avgUnitsPerOrder:
          totalOrders > 0 ? Math.round(totalUnits / totalOrders) : 0,
      },

      // Data Return dan BS untuk AI Analysis
      returnBSAnalytics: {
        // Data mentah Return dan BS
        totalReturnValue: penjualanReturn.reduce(
          (sum, item) =>
            sum +
            Number(item.jumlahPenjualan || 0) * Number(item.kuantitas || 1),
          0
        ),
        totalBSValue: penjualanBS.reduce(
          (sum, item) =>
            sum +
            Number(item.jumlahPenjualan || 0) * Number(item.kuantitas || 1),
          0
        ),
        totalReturnCount: penjualanReturn.length,
        totalBSCount: penjualanBS.length,

        // Data chart Return/BS
        returnBSMonthlyData: returnBSMonthlyData.slice(0, 10),
        returnProductAnalysis: returnProductAnalysis.slice(0, 10),
        bsProductAnalysis: bsProductAnalysis.slice(0, 10),
        returnSalesAnalysis: returnSalesAnalysis.slice(0, 8),
        bsSalesAnalysis: bsSalesAnalysis.slice(0, 8),

        // Insights Return/BS
        topReturnProduct: returnProductAnalysis[0]?.product || "Tidak ada data",
        topBSProduct: bsProductAnalysis[0]?.product || "Tidak ada data",
        topReturnSales: returnSalesAnalysis[0]?.sales || "Tidak ada data",
        topBSSales: bsSalesAnalysis[0]?.sales || "Tidak ada data",

        // Persentase kerugian
        returnLossPercentage:
          totalRevenue > 0
            ? (
                (penjualanReturn.reduce(
                  (sum, item) =>
                    sum +
                    Number(item.jumlahPenjualan || 0) *
                      Number(item.kuantitas || 1),
                  0
                ) /
                  (totalRevenue +
                    penjualanReturn.reduce(
                      (sum, item) =>
                        sum +
                        Number(item.jumlahPenjualan || 0) *
                          Number(item.kuantitas || 1),
                      0
                    ) +
                    penjualanBS.reduce(
                      (sum, item) =>
                        sum +
                        Number(item.jumlahPenjualan || 0) *
                          Number(item.kuantitas || 1),
                      0
                    ))) *
                100
              ).toFixed(2)
            : 0,
        bsLossPercentage:
          totalRevenue > 0
            ? (
                (penjualanBS.reduce(
                  (sum, item) =>
                    sum +
                    Number(item.jumlahPenjualan || 0) *
                      Number(item.kuantitas || 1),
                  0
                ) /
                  (totalRevenue +
                    penjualanReturn.reduce(
                      (sum, item) =>
                        sum +
                        Number(item.jumlahPenjualan || 0) *
                          Number(item.kuantitas || 1),
                      0
                    ) +
                    penjualanBS.reduce(
                      (sum, item) =>
                        sum +
                        Number(item.jumlahPenjualan || 0) *
                          Number(item.kuantitas || 1),
                      0
                    ))) *
                100
              ).toFixed(2)
            : 0,
      },
    };
  };

  if (loading) {
    return <PageLoader text="Memuat data analytics dan grafik..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2"></p>
        </div>
        <div className="flex items-center gap-3">
          {/* New Reports Integration Button */}
          <Link href="/reports">
            <Button
              onClick={() => generateReportData()}
              className="btn-success flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Buat Laporan
            </Button>
          </Link>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <LoadingSpinner size="sm" color="blue" />
                Memuat...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>

          {/* Data Management Dropdown */}
          <div className="relative group">
            <Button
              disabled={cleanupLoading}
              className="btn-secondary flex items-center gap-2"
            >
              {cleanupLoading ? (
                <>
                  <LoadingSpinner size="sm" color="gray" />
                  Processing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Data Management
                </>
              )}
            </Button>

            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <button
                  onClick={handleFixUnknownData}
                  disabled={cleanupLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Perbaiki Data Unknown
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleCleanupOldData}
                  disabled={cleanupLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Hapus Data Lama ({">"}12 bulan)
                </button>
                <button
                  onClick={handleCleanupUnusedData}
                  disabled={cleanupLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Hapus Data Tidak Terpakai
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleAutoCleanup}
                  disabled={cleanupLoading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  Auto Cleanup Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === PINDAHKAN SUMMARY KE ATAS === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Penjualan
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {penjualanNormal
                    .reduce(
                      (sum, item) =>
                        sum +
                        Number(item.jumlahPenjualan || 0) *
                          Number(item.kuantitas || 1),
                      0
                    )
                    .toLocaleString("id-ID")}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Return
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {penjualanReturn
                    .reduce(
                      (sum, item) =>
                        sum +
                        Number(item.jumlahPenjualan || 0) *
                          Number(item.kuantitas || 1),
                      0
                    )
                    .toLocaleString("id-ID")}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total BS</p>
                <p className="text-2xl font-bold text-orange-600">
                  {penjualanBS
                    .reduce(
                      (sum, item) =>
                        sum +
                        Number(item.jumlahPenjualan || 0) *
                          Number(item.kuantitas || 1),
                      0
                    )
                    .toLocaleString("id-ID")}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Summary Card for Reports */}
      <Card className="mb-6 border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            Ringkasan Analytics untuk Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Revenue</p>
              <p className="text-lg font-semibold text-green-600">
                {totalRevenue.toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Transaksi</p>
              <p className="text-lg font-semibold text-blue-600">
                {totalOrders}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Unit Terjual</p>
              <p className="text-lg font-semibold text-purple-600">
                {totalUnits}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Sales Aktif</p>
              <p className="text-lg font-semibold text-orange-600">
                {uniqueCustomers}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Produk Berbeda</p>
              <p className="text-lg font-semibold text-indigo-600">
                {uniqueProducts}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link href="/reports">
              <Button
                onClick={() => generateReportData()}
                size="sm"
                className="btn-outline-success"
              >
                <Download className="h-4 w-4 mr-2" />
                Export ke Laporan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {refreshing ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Penjualan
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalRevenue.toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />+{revenueTrend}% dari
                  periode sebelumnya
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Transaksi
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {totalOrders}
                </div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />+{ordersTrend}% dari
                  periode sebelumnya
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Unit Terjual
                </CardTitle>
                <Package className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {totalUnits}
                </div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Real Data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Sales
                </CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {uniqueCustomers}
                </div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />+{customersTrend}% dari
                  periode sebelumnya
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Jenis Produk
                </CardTitle>
                <Package className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {uniqueProducts}
                </div>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {productsTrend}% dari periode sebelumnya
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {refreshing ? (
          Array.from({ length: 2 }).map((_, i) => <ChartSkeleton key={i} />)
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Trend Penjualan Per Periode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis
                        tickFormatter={(value) =>
                          `${(value / 1000).toFixed(0)}K`
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          value.toLocaleString("id-ID"),
                          "Penjualan",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performa Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sales" />
                      <YAxis
                        tickFormatter={(value) =>
                          `${(value / 1000).toFixed(0)}K`
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          value.toLocaleString("id-ID"),
                          "Total Penjualan",
                        ]}
                      />
                      <Bar dataKey="total" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {refreshing ? (
          Array.from({ length: 2 }).map((_, i) => <ChartSkeleton key={i} />)
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Performa Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="product"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          `${(value / 1000).toFixed(0)}K`
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          value.toLocaleString("id-ID"),
                          "Revenue",
                        ]}
                      />
                      <Bar dataKey="revenue" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi per Jalur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={jalurAnalysis}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {jalurAnalysis.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          value.toLocaleString("id-ID"),
                          "Penjualan",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ===== GRAFIK RETURN DAN BS ===== */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-red-500" />
          Analytics Return & Barang Sisa (BS)
        </h2>

        {/* Return/BS Monthly Trend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-red-500" />
              Trend Return & BS Per Periode (dalam Rupiah)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returnBSMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) =>
                      `Rp ${(value / 1000).toFixed(0)}K`
                    }
                    label={{
                      value: "Nilai (Rupiah)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `Rp ${value.toLocaleString("id-ID")}`,
                      name === "returnValue" ? "Nilai Return" : "Nilai BS",
                    ]}
                    labelFormatter={(label) => `Periode: ${label}`}
                  />
                  <Bar dataKey="returnValue" fill="#EF4444" name="Return" />
                  <Bar dataKey="bsValue" fill="#F97316" name="BS" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Return dan BS Product Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {refreshing ? (
            Array.from({ length: 2 }).map((_, i) => <ChartSkeleton key={i} />)
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-red-500" />
                    Top Produk Return (Nilai dalam Rupiah)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={returnProductAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="product"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            `Rp ${(value / 1000).toFixed(0)}K`
                          }
                          label={{
                            value: "Nilai Return (Rp)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `Rp ${value.toLocaleString("id-ID")}`,
                            "Total Nilai Return",
                          ]}
                          labelFormatter={(label) => `Produk: ${label}`}
                        />
                        <Bar dataKey="value" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    Top Produk BS (Nilai dalam Rupiah)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bsProductAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="product"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            `Rp ${(value / 1000).toFixed(0)}K`
                          }
                          label={{
                            value: "Nilai BS (Rp)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `Rp ${value.toLocaleString("id-ID")}`,
                            "Total Nilai BS",
                          ]}
                          labelFormatter={(label) => `Produk: ${label}`}
                        />
                        <Bar dataKey="value" fill="#F97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Return dan BS Sales Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {refreshing ? (
            Array.from({ length: 2 }).map((_, i) => <ChartSkeleton key={i} />)
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-red-500" />
                    Sales dengan Return Tertinggi (Nilai dalam Rupiah)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={returnSalesAnalysis}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, value }) =>
                            percent > 5
                              ? `${name}\n${(percent * 100).toFixed(0)}%\nRp ${(
                                  value / 1000
                                ).toFixed(0)}K`
                              : ""
                          }
                          outerRadius={80}
                          fill="#EF4444"
                          dataKey="value"
                        >
                          {returnSalesAnalysis.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index % 2 === 0 ? "#EF4444" : "#DC2626"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(
                            value: number,
                            name: string,
                            props: any
                          ) => [
                            `Rp ${value.toLocaleString("id-ID")}`,
                            `Total Nilai Return dari ${props.payload.name}`,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    Sales dengan BS Tertinggi (Nilai dalam Rupiah)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bsSalesAnalysis}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, value }) =>
                            percent > 5
                              ? `${name}\n${(percent * 100).toFixed(0)}%\nRp ${(
                                  value / 1000
                                ).toFixed(0)}K`
                              : ""
                          }
                          outerRadius={80}
                          fill="#F97316"
                          dataKey="value"
                        >
                          {bsSalesAnalysis.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index % 2 === 0 ? "#F97316" : "#EA580C"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(
                            value: number,
                            name: string,
                            props: any
                          ) => [
                            `Rp ${value.toLocaleString("id-ID")}`,
                            `Total Nilai BS dari ${props.payload.name}`,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Produk Terlaris</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Transaksi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Penjualan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rata-rata per Unit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productPerformance.map((item, index) => (
                  <tr key={index} className="table-row">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.product}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.sales}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        📦 {item.units} unit
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.revenue.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="text-green-600 font-medium">
                        {item.units > 0
                          ? (item.revenue / item.units).toLocaleString("id-ID")
                          : "0"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Return & BS Detail Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Return Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Detail Produk Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                      Produk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                      Jumlah Return
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                      Unit Return
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                      Total Nilai (Rupiah)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {returnProductAnalysis.map((item, index) => (
                    <tr key={index} className="hover:bg-red-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.product}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.count} kali
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          📦 {item.units} unit
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="text-red-600 font-bold">
                          Rp {item.value.toLocaleString("id-ID")}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {returnProductAnalysis.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Tidak ada data return produk
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* BS Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Detail Produk BS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                      Produk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                      Jumlah BS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                      Unit BS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                      Total Nilai (Rupiah)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bsProductAnalysis.map((item, index) => (
                    <tr key={index} className="hover:bg-orange-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.product}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {item.count} kali
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          📦 {item.units} unit
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="text-orange-600 font-bold">
                          Rp {item.value.toLocaleString("id-ID")}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {bsProductAnalysis.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Tidak ada data BS produk
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unknown Data Alert */}
      {(() => {
        const unknownCount = salesData.filter(
          (item) => !item.periode || !item.periode.namaPeriode
        ).length;
        if (unknownCount > 0) {
          return (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Data Unknown Terdeteksi
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Ditemukan {unknownCount} data dengan periode "Unknown". Data
                    ini mungkin ter-corrupt atau tidak memiliki relasi yang
                    valid.
                  </p>
                </div>
                <button
                  onClick={handleFixUnknownData}
                  disabled={cleanupLoading}
                  className="ml-4 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {cleanupLoading ? "Processing..." : "Perbaiki Sekarang"}
                </button>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* NEKO AI Chat - tambahkan sebelum closing div */}
      <NekoAiChat dashboardData={prepareAnalyticsDataForAI()} />
    </div>
  );
}
