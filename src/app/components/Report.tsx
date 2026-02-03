"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Calendar,
  Filter,
  FileText,
  ChevronDown,
  BarChart3,
  Printer,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { ReportsChart } from "@/app/components/ui/Report-chart";
import {
  apiService,
  PenjualanData,
  TotalProdukData,
  TotalMingguData,
  TotalMingguSalesData,
  SalesData,
  ProdukData, // Tambahkan import ProdukData
} from "@/app/services/api";
import { sweetAlert } from "@/app/utils/sweetAlert";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/LoadingSpinner";
import { ExportService } from "@/app/utils/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import ReactSelect from "react-select";

interface ReportProps {
  analyticsData?: any;
}

export default function ReportsPage({ analyticsData }: ReportProps) {
  const [reportType, setReportType] = useState("product");
  // Ganti dateFrom dan dateTo dengan selectedPeriodId dan selectedYear
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(
    new Date().getFullYear()
  );
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"periode" | "tanggal">("periode");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Data states
  const [salesData, setSalesData] = useState<PenjualanData[]>([]);
  const [totalProdukData, setTotalProdukData] = useState<TotalProdukData[]>([]);
  const [totalMingguData, setTotalMingguData] = useState<TotalMingguData[]>([]);
  const [totalMingguSalesData, setTotalMingguSalesData] = useState<
    TotalMingguSalesData[]
  >([]);
  const [reportData, setReportData] = useState<any[]>([]);

  // Tambahkan state untuk periode dan data terfilter
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<PenjualanData[]>(
    []
  );
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Tambahkan state untuk filter sales dan minggu
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedSalesIds, setSelectedSalesIds] = useState<number[]>([]);
  const [selectedMingguId, setSelectedMingguId] = useState<number | null>(null);
  const [mingguList, setMingguList] = useState<any[]>([]);
  const [salesList, setSalesList] = useState<SalesData[]>([]);

  // Tambahkan state untuk loading dan error khusus filter tanggal
  const [dateLoading, setDateLoading] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Tambahkan state untuk sub-filter tanggal
  const [showDateSubFilters, setShowDateSubFilters] = useState(false);
  const [dateSelectedProductIds, setDateSelectedProductIds] = useState<
    number[]
  >([]);
  const [dateSelectedSalesIds, setDateSelectedSalesIds] = useState<number[]>(
    []
  );

  const [allSalesData, setAllSalesData] = useState<PenjualanData[]>([]);
  const [produkList, setProdukList] = useState<ProdukData[]>([]); // Tambahkan state produkList

  // State untuk mengontrol apakah report di tab tanggal sudah di-generate
  const [dateReportGenerated, setDateReportGenerated] = useState(false);

  // State untuk export column selection
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState({
    product: true,
    quantity: true,
    totalUnits: true,
    revenue: true,
    avgPerUnit: true,
    tipeTransaksi: true,
    percentage: true,
    keterangan: true,
  });

  const showProdukSalesFilter = reportType === "product-sales";

  useEffect(() => {
    if (reportType === "product-sales") {
      setSelectedProductIds([]);
      setSelectedSalesIds([]);
    }
  }, [reportType]);

  // Reset export columns based on report type
  useEffect(() => {
    setSelectedExportColumns({
      product: true,
      quantity: true,
      totalUnits: reportType === "product" || reportType === "product-sales",
      revenue: true,
      avgPerUnit: reportType === "product" || reportType === "product-sales",
      tipeTransaksi: true,
      percentage: true,
      keterangan: true,
    });
  }, [reportType]);

  useEffect(() => {
    loadReportData();
  }, []);

  useEffect(() => {
    // Hanya generate report jika di tab periode, atau di tab tanggal tapi sudah pernah di-generate
    if (
      activeTab === "periode" ||
      (activeTab === "tanggal" && dateReportGenerated)
    ) {
      generateReport();
    }
  }, [
    reportType,
    filteredSalesData, // Ganti salesData dengan filteredSalesData
    totalProdukData,
    totalMingguData,
    totalMingguSalesData,
    activeTab, // tambahkan agar generateReport jalan saat tab berubah
    salesData, // tambahkan agar generateReport jalan saat data baru masuk
    dateReportGenerated, // tambahkan agar generate saat status berubah
  ]);

  // Perbaiki useEffect agar tidak ada setState yang menyebabkan loop
  useEffect(() => {
    if (activeTab === "tanggal") {
      setSelectedProductIds([]);
      setSelectedSalesIds([]);
      // Reset sub-filter tanggal
      setDateSelectedProductIds([]);
      setDateSelectedSalesIds([]);
      setShowDateSubFilters(false);
      // Reset status generate report untuk tab tanggal
      setDateReportGenerated(false);
      // Clear report data saat pindah ke tab tanggal
      setReportData([]);
    }
    if (activeTab === "periode") {
      setSalesData(allSalesData);
      // Set flag bahwa di tab periode selalu generate
      setDateReportGenerated(false);
    }
  }, [activeTab, allSalesData]);

  // Filter data berdasarkan periode, tahun, sales, dan minggu yang dipilih
  useEffect(() => {
    let filtered = salesData;

    if (activeTab === "periode") {
      // Filter berdasarkan tahun
      if (selectedYear) {
        filtered = filtered.filter((item) => {
          const itemYear = new Date(
            item.createdAt || item.updatedAt || ""
          ).getFullYear();
          return (
            itemYear === selectedYear ||
            item.periode?.namaPeriode?.includes(selectedYear.toString())
          );
        });
      }
      // Filter berdasarkan periode (bulan)
      if (selectedPeriodId) {
        filtered = filtered.filter(
          (item) => item.periode?.id === selectedPeriodId
        );
      }
      // Filter produk & sales hanya jika reportType 'product-sales'
      if (reportType === "product-sales") {
        if (selectedProductIds.length > 0) {
          filtered = filtered.filter(
            (item) =>
              item.produk?.id && selectedProductIds.includes(item.produk.id)
          );
        }
        if (selectedSalesIds.length > 0) {
          filtered = filtered.filter(
            (item) => item.sales?.id && selectedSalesIds.includes(item.sales.id)
          );
        }
      }
      // Filter berdasarkan minggu
      if (selectedMingguId) {
        filtered = filtered.filter(
          (item) => item.minggu?.id === selectedMingguId
        );
      }
    }
    // Jika tab tanggal, JANGAN filter tahun, produk, sales, minggu
    // Data akan langsung sesuai hasil API by date range
    setFilteredSalesData(filtered);
  }, [
    reportType,
    selectedPeriodId,
    selectedYear,
    selectedProductIds,
    selectedSalesIds,
    selectedMingguId,
    salesData,
    activeTab,
  ]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [
        penjualanData,
        totalProduk,
        totalMinggu,
        totalMingguSales,
        salesListData,
        periodeData,
        mingguData,
        produkData, // Tambahkan produkData
      ] = await Promise.all([
        apiService.getAllPenjualan(),
        apiService.getTotalPenjualanPerProduk(),
        apiService.getTotalPenjualanPerMinggu(),
        apiService.getTotalPenjualanPerMingguSales(),
        apiService.getAllSales(),
        apiService.getAllPeriode(),
        apiService.getAllMinggu(),
        apiService.getAllProduk(), // Fetch produk asli
      ]);

      setAllSalesData(penjualanData); // simpan semua data penjualan
      setSalesData(penjualanData);
      setTotalProdukData(totalProduk);
      setTotalMingguData(totalMinggu);
      setTotalMingguSalesData(totalMingguSales);
      setSalesList(salesListData);
      setPeriodeList(periodeData);
      setMingguList(mingguData);
      setProdukList(produkData); // Set produkList

      // Debug: Log produk yang di-load
      console.log("📦 Loaded products:", produkData.length, "products");
      console.log(
        "📋 Product list:",
        produkData.map((p) => `${p.id}: ${p.namaProduk}`)
      );

      // Set filtered data awal (semua data)
      setFilteredSalesData(penjualanData);

      // Inisialisasi default state hanya sekali setelah data di-load
      if (periodeData.length > 0) setSelectedPeriodId(periodeData[0].id);
      // Generate available years dari data
      const years = new Set<number>();
      penjualanData.forEach((item) => {
        const itemDate = new Date(item.createdAt || item.updatedAt || "");
        if (!isNaN(itemDate.getTime())) {
          years.add(itemDate.getFullYear());
        }
        // Juga ambil tahun dari nama periode jika ada
        if (item.periode?.namaPeriode) {
          const yearMatch = item.periode.namaPeriode.match(/\d{4}/);
          if (yearMatch) {
            years.add(parseInt(yearMatch[0]));
          }
        }
      });

      const yearArray = Array.from(years).sort((a, b) => b - a); // Urutkan descending
      setAvailableYears(yearArray);

      // Set tahun default ke tahun terbaru jika ada data
      if (yearArray.length > 0) {
        setSelectedYear(yearArray[0]);
      }

      // Set default minggu (minggu pertama)
      if (mingguData.length > 0 && !selectedMingguId) {
        setSelectedMingguId(mingguData[0].id);
      }

      setError(null);
    } catch (err) {
      setError("Gagal memuat data laporan");
      console.error("Error loading report data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update semua generate functions untuk menggunakan filteredSalesData
  const generateReport = () => {
    if (
      !filteredSalesData.length &&
      !totalProdukData.length &&
      !totalMingguData.length
    )
      return;

    switch (reportType) {
      case "product":
        generateProductReport();
        break;
      case "sales":
        generateSalesReport();
        break;
      case "jalur":
        generateJalurReport();
        break;
      case "monthly":
        generateMonthlyReport();
        break;
      case "weekly":
        generateWeeklyReport();
        break;
      case "weekly-sales":
        generateWeeklySalesReport();
        break;
      case "product-sales":
        generateProductSalesReport();
        break;
      default:
        generateProductReport();
    }
  };

  const generateProductReport = () => {
    console.log("🔄 Generating product report with data:", {
      total: filteredSalesData.length,
      activeTab,
      reportType,
    });

    // 🐛 DEBUG: Log sample data untuk cek struktur
    if (filteredSalesData.length > 0) {
      const sample = filteredSalesData[0];
      console.log("🐛 SAMPLE DATA:", {
        id: sample.id,
        produk: sample.produk,
        produkKeys: sample.produk ? Object.keys(sample.produk) : "NULL",
        namaProduk: sample.produk?.namaProduk,
        nama_produk: (sample.produk as any)?.nama_produk,
        nama: (sample.produk as any)?.nama,
      });
    }

    // Jika mode tanggal, tampilkan data per transaksi (tidak di-group)
    if (activeTab === "tanggal") {
      console.log("📋 Generating per-transaction report for date mode");
      const reportArray = filteredSalesData.map((item) => ({
        product:
          item.produk?.namaProduk ||
          item.produk?.nama ||
          (item.produk as any)?.nama_produk ||
          "Unknown",
        quantity: 1,
        totalUnits: Number(item.kuantitas || 1),
        revenue:
          Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0),
        avgPerUnit: Number(item.jumlahPenjualan || 0),
        keterangan: item.keterangan || "-",
        tanggalTransaksi: item.tanggalTransaksi
          ? new Date(item.tanggalTransaksi).toLocaleDateString("id-ID")
          : "-",
        tipeTransaksi: item.tipeTransaksi || "PENJUALAN",
        percentage: 0, // Tidak relevan untuk per transaksi, bisa diisi 0
      }));
      console.log("✅ Generated report array:", reportArray.length, "items");
      setReportData(reportArray);
      return;
    }
    const productMap = new Map();

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

    // Process penjualan normal (ditambahkan)
    penjualanNormal.forEach((item) => {
      const productName =
        item.produk?.namaProduk ||
        item.produk?.nama ||
        (item.produk as any)?.nama_produk ||
        "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (productMap.has(productName)) {
        const existing = productMap.get(productName);
        productMap.set(productName, {
          ...existing,
          quantity: existing.quantity + 1,
          totalUnits: existing.totalUnits + kuantitas,
          revenue: existing.revenue + totalValue,
        });
      } else {
        productMap.set(productName, {
          product: productName,
          quantity: 1,
          totalUnits: kuantitas,
          revenue: totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process return (dikurangkan)
    penjualanReturn.forEach((item) => {
      const productName =
        item.produk?.namaProduk ||
        item.produk?.nama ||
        (item.produk as any)?.nama_produk ||
        "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (productMap.has(productName)) {
        const existing = productMap.get(productName);
        productMap.set(productName, {
          ...existing,
          quantity: existing.quantity,
          totalUnits: existing.totalUnits - kuantitas,
          revenue: existing.revenue - totalValue,
        });
      } else {
        productMap.set(productName, {
          product: productName,
          quantity: 0,
          totalUnits: -kuantitas,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process BS (dikurangkan)
    penjualanBS.forEach((item) => {
      const productName =
        item.produk?.namaProduk ||
        item.produk?.nama ||
        (item.produk as any)?.nama_produk ||
        "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (productMap.has(productName)) {
        const existing = productMap.get(productName);
        productMap.set(productName, {
          ...existing,
          quantity: existing.quantity,
          totalUnits: existing.totalUnits - kuantitas,
          revenue: existing.revenue - totalValue,
        });
      } else {
        productMap.set(productName, {
          product: productName,
          quantity: 0,
          totalUnits: -kuantitas,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    const reportArray = Array.from(productMap.values());
    const totalRevenue = reportArray.reduce(
      (sum, item) => sum + item.revenue,
      0
    );

    reportArray.forEach((item) => {
      item.percentage =
        totalRevenue > 0
          ? Number(((item.revenue / totalRevenue) * 100).toFixed(1))
          : 0;
    });

    reportArray.sort((a, b) => b.revenue - a.revenue);
    setReportData(reportArray);
  };

  const generateSalesReport = () => {
    const salesMap = new Map();

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

    // Process penjualan normal (ditambahkan)
    penjualanNormal.forEach((item) => {
      const salesName = item.sales?.namaSales || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (salesMap.has(salesName)) {
        const existing = salesMap.get(salesName);
        salesMap.set(salesName, {
          ...existing,
          quantity: existing.quantity + 1,
          revenue: existing.revenue + totalValue,
        });
      } else {
        salesMap.set(salesName, {
          product: salesName,
          quantity: 1,
          revenue: totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process return (dikurangkan)
    penjualanReturn.forEach((item) => {
      const salesName = item.sales?.namaSales || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (salesMap.has(salesName)) {
        const existing = salesMap.get(salesName);
        salesMap.set(salesName, {
          ...existing,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
        });
      } else {
        salesMap.set(salesName, {
          product: salesName,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process BS (dikurangkan)
    penjualanBS.forEach((item) => {
      const salesName = item.sales?.namaSales || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (salesMap.has(salesName)) {
        const existing = salesMap.get(salesName);
        salesMap.set(salesName, {
          ...existing,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
        });
      } else {
        salesMap.set(salesName, {
          product: salesName,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    const reportArray = Array.from(salesMap.values());
    const totalRevenue = reportArray.reduce(
      (sum, item) => sum + item.revenue,
      0
    );

    reportArray.forEach((item) => {
      item.percentage =
        totalRevenue > 0
          ? Number(((item.revenue / totalRevenue) * 100).toFixed(1))
          : 0;
    });

    reportArray.sort((a, b) => b.revenue - a.revenue);
    setReportData(reportArray);
  };

  const generateJalurReport = () => {
    const jalurMap = new Map();

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

    // Process penjualan normal (ditambahkan)
    penjualanNormal.forEach((item) => {
      const jalurName = item.jalur?.namaJalur || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (jalurMap.has(jalurName)) {
        const existing = jalurMap.get(jalurName);
        jalurMap.set(jalurName, {
          ...existing,
          quantity: existing.quantity + 1,
          revenue: existing.revenue + totalValue,
        });
      } else {
        jalurMap.set(jalurName, {
          product: jalurName,
          quantity: 1,
          revenue: totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process return (dikurangkan)
    penjualanReturn.forEach((item) => {
      const jalurName = item.jalur?.namaJalur || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (jalurMap.has(jalurName)) {
        const existing = jalurMap.get(jalurName);
        jalurMap.set(jalurName, {
          ...existing,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
        });
      } else {
        jalurMap.set(jalurName, {
          product: jalurName,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process BS (dikurangkan)
    penjualanBS.forEach((item) => {
      const jalurName = item.jalur?.namaJalur || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (jalurMap.has(jalurName)) {
        const existing = jalurMap.get(jalurName);
        jalurMap.set(jalurName, {
          ...existing,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
        });
      } else {
        jalurMap.set(jalurName, {
          product: jalurName,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    const reportArray = Array.from(jalurMap.values());
    const totalRevenue = reportArray.reduce(
      (sum, item) => sum + item.revenue,
      0
    );

    reportArray.forEach((item) => {
      item.percentage =
        totalRevenue > 0
          ? Number(((item.revenue / totalRevenue) * 100).toFixed(1))
          : 0;
    });

    reportArray.sort((a, b) => b.revenue - a.revenue);
    setReportData(reportArray);
  };

  const generateMonthlyReport = () => {
    const monthlyMap = new Map();

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

    // Process penjualan normal (ditambahkan)
    penjualanNormal.forEach((item) => {
      const periode = item.periode?.namaPeriode || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (monthlyMap.has(periode)) {
        const existing = monthlyMap.get(periode);
        monthlyMap.set(periode, {
          ...existing,
          quantity: existing.quantity + 1,
          revenue: existing.revenue + totalValue,
        });
      } else {
        monthlyMap.set(periode, {
          product: periode,
          quantity: 1,
          revenue: totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process return (dikurangkan)
    penjualanReturn.forEach((item) => {
      const periode = item.periode?.namaPeriode || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (monthlyMap.has(periode)) {
        const existing = monthlyMap.get(periode);
        monthlyMap.set(periode, {
          ...existing,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
        });
      } else {
        monthlyMap.set(periode, {
          product: periode,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process BS (dikurangkan)
    penjualanBS.forEach((item) => {
      const periode = item.periode?.namaPeriode || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (monthlyMap.has(periode)) {
        const existing = monthlyMap.get(periode);
        monthlyMap.set(periode, {
          ...existing,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
        });
      } else {
        monthlyMap.set(periode, {
          product: periode,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    const reportArray = Array.from(monthlyMap.values());
    const totalRevenue = reportArray.reduce(
      (sum, item) => sum + item.revenue,
      0
    );

    reportArray.forEach((item) => {
      item.percentage =
        totalRevenue > 0
          ? Number(((item.revenue / totalRevenue) * 100).toFixed(1))
          : 0;
    });

    reportArray.sort((a, b) => b.revenue - a.revenue);
    setReportData(reportArray);
  };

  const generateWeeklyReport = () => {
    const weeklyMap = new Map();

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

    // Process penjualan normal (ditambahkan)
    penjualanNormal.forEach((item) => {
      const minggu = item.minggu?.namaMinggu || "Unknown";
      const sales = item.sales?.namaSales || "Unknown";
      const key = `${minggu} - ${sales}`;
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (weeklyMap.has(key)) {
        const existing = weeklyMap.get(key);
        weeklyMap.set(key, {
          product: key,
          quantity: existing.quantity + 1,
          revenue: existing.revenue + totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      } else {
        weeklyMap.set(key, {
          product: key,
          quantity: 1,
          revenue: totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process return (dikurangkan)
    penjualanReturn.forEach((item) => {
      const minggu = item.minggu?.namaMinggu || "Unknown";
      const sales = item.sales?.namaSales || "Unknown";
      const key = `${minggu} - ${sales}`;
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (weeklyMap.has(key)) {
        const existing = weeklyMap.get(key);
        weeklyMap.set(key, {
          product: key,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      } else {
        weeklyMap.set(key, {
          product: key,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process BS (dikurangkan)
    penjualanBS.forEach((item) => {
      const minggu = item.minggu?.namaMinggu || "Unknown";
      const sales = item.sales?.namaSales || "Unknown";
      const key = `${minggu} - ${sales}`;
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (weeklyMap.has(key)) {
        const existing = weeklyMap.get(key);
        weeklyMap.set(key, {
          product: key,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      } else {
        weeklyMap.set(key, {
          product: key,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    const reportArray = Array.from(weeklyMap.values());
    const totalRevenue = reportArray.reduce(
      (sum, item) => sum + item.revenue,
      0
    );

    reportArray.forEach((item) => {
      item.percentage =
        totalRevenue > 0
          ? Number(((item.revenue / totalRevenue) * 100).toFixed(1))
          : 0;
    });

    reportArray.sort((a, b) => b.revenue - a.revenue);
    setReportData(reportArray);
  };

  const generateWeeklySalesReport = () => {
    const weeklyMap = new Map();

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

    // Process penjualan normal (ditambahkan)
    penjualanNormal.forEach((item) => {
      const minggu = item.minggu?.namaMinggu || "Unknown";
      const sales = item.sales?.namaSales || "Unknown";
      const key = `${minggu} - ${sales}`;
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (weeklyMap.has(key)) {
        const existing = weeklyMap.get(key);
        weeklyMap.set(key, {
          product: key,
          quantity: existing.quantity + 1,
          revenue: existing.revenue + totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      } else {
        weeklyMap.set(key, {
          product: key,
          quantity: 1,
          revenue: totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process return (dikurangkan)
    penjualanReturn.forEach((item) => {
      const minggu = item.minggu?.namaMinggu || "Unknown";
      const sales = item.sales?.namaSales || "Unknown";
      const key = `${minggu} - ${sales}`;
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (weeklyMap.has(key)) {
        const existing = weeklyMap.get(key);
        weeklyMap.set(key, {
          product: key,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      } else {
        weeklyMap.set(key, {
          product: key,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process BS (dikurangkan)
    penjualanBS.forEach((item) => {
      const minggu = item.minggu?.namaMinggu || "Unknown";
      const sales = item.sales?.namaSales || "Unknown";
      const key = `${minggu} - ${sales}`;
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (weeklyMap.has(key)) {
        const existing = weeklyMap.get(key);
        weeklyMap.set(key, {
          product: key,
          quantity: existing.quantity,
          revenue: existing.revenue - totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      } else {
        weeklyMap.set(key, {
          product: key,
          quantity: 0,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    const reportArray = Array.from(weeklyMap.values());
    const totalRevenue = reportArray.reduce(
      (sum, item) => sum + item.revenue,
      0
    );

    reportArray.forEach((item) => {
      item.percentage =
        totalRevenue > 0
          ? Number(((item.revenue / totalRevenue) * 100).toFixed(1))
          : 0;
    });

    // Sorting berdasarkan sales name secara alfabetikal untuk Weekly Sales Report
    // Ekstrak sales name dari "Minggu - Sales" format
    reportArray.sort((a, b) => {
      // Ambil sales name dari "Minggu - Sales" format
      const salesA = a.product.split(" - ")[1] || "";
      const salesB = b.product.split(" - ")[1] || "";

      // Urutkan berdasarkan sales name dulu, lalu revenue
      if (salesA === salesB) {
        return b.revenue - a.revenue; // Jika sales sama, urutkan berdasarkan revenue tertinggi
      }
      return salesA.localeCompare(salesB); // Urutkan berdasarkan nama sales alfabetikal
    });

    setReportData(reportArray);
  };

  const generateProductSalesReport = () => {
    const map = new Map();

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

    // Process penjualan normal (ditambahkan)
    penjualanNormal.forEach((item) => {
      const productName =
        item.produk?.namaProduk ||
        item.produk?.nama ||
        (item.produk as any)?.nama_produk ||
        "Unknown";
      const salesName =
        item.sales?.namaSales ||
        item.sales?.nama ||
        (item.sales as any)?.nama_sales ||
        "Unknown";
      const key = `${productName} - ${salesName}`;
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (map.has(key)) {
        const existing = map.get(key);
        map.set(key, {
          ...existing,
          quantity: existing.quantity + 1,
          totalUnits: existing.totalUnits + kuantitas,
          revenue: existing.revenue + totalValue,
        });
      } else {
        map.set(key, {
          product: key,
          quantity: 1,
          totalUnits: kuantitas,
          revenue: totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process return (dikurangkan)
    penjualanReturn.forEach((item) => {
      const productName =
        item.produk?.namaProduk ||
        item.produk?.nama ||
        (item.produk as any)?.nama_produk ||
        "Unknown";
      const salesName =
        item.sales?.namaSales ||
        item.sales?.nama ||
        (item.sales as any)?.nama_sales ||
        "Unknown";
      const key = `${productName} - ${salesName}`;
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (map.has(key)) {
        const existing = map.get(key);
        map.set(key, {
          ...existing,
          quantity: existing.quantity,
          totalUnits: existing.totalUnits - kuantitas,
          revenue: existing.revenue - totalValue,
        });
      } else {
        map.set(key, {
          product: key,
          quantity: 0,
          totalUnits: -kuantitas,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    // Process BS (dikurangkan)
    penjualanBS.forEach((item) => {
      const productName =
        item.produk?.namaProduk ||
        item.produk?.nama ||
        (item.produk as any)?.nama_produk ||
        "Unknown";
      const salesName =
        item.sales?.namaSales ||
        item.sales?.nama ||
        (item.sales as any)?.nama_sales ||
        "Unknown";
      const key = `${productName} - ${salesName}`;
      const kuantitas = Number(item.kuantitas || 1);
      const hargaPerUnit = Number(item.jumlahPenjualan || 0);
      const totalValue = kuantitas * hargaPerUnit;

      if (map.has(key)) {
        const existing = map.get(key);
        map.set(key, {
          ...existing,
          quantity: existing.quantity,
          totalUnits: existing.totalUnits - kuantitas,
          revenue: existing.revenue - totalValue,
        });
      } else {
        map.set(key, {
          product: key,
          quantity: 0,
          totalUnits: -kuantitas,
          revenue: -totalValue,
          percentage: 0,
          keterangan: item.keterangan || "-",
        });
      }
    });

    const reportArray = Array.from(map.values());
    const totalRevenue = reportArray.reduce(
      (sum, item) => sum + item.revenue,
      0
    );
    reportArray.forEach((item) => {
      item.percentage =
        totalRevenue > 0
          ? Number(((item.revenue / totalRevenue) * 100).toFixed(1))
          : 0;
    });

    // Sorting berdasarkan sales name secara alfabetikal
    // Ekstrak sales name dari product key untuk sorting
    reportArray.sort((a, b) => {
      // Ambil sales name dari "Product - Sales" format
      const salesA = a.product.split(" - ")[1] || "";
      const salesB = b.product.split(" - ")[1] || "";

      // Urutkan berdasarkan sales name dulu, lalu revenue
      if (salesA === salesB) {
        return b.revenue - a.revenue; // Jika sales sama, urutkan berdasarkan revenue tertinggi
      }
      return salesA.localeCompare(salesB); // Urutkan berdasarkan nama sales alfabetikal
    });

    setReportData(reportArray);
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (!reportData.length) {
      sweetAlert.toast.warning("Tidak ada data untuk diexport");
      return;
    }

    setIsExporting(true);

    const formatName = format === "excel" ? "Excel" : "PDF";
    sweetAlert.loading(
      `Mengexport Laporan ${formatName}`,
      `Sedang memproses laporan ${formatName}...`
    );

    try {
      const summary = {
        totalRevenue,
        totalQuantity,
      };

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update export dengan periode info yang lebih clean
      let exportFileName = "";
      let exportPeriodInfo = "";

      if (activeTab === "tanggal") {
        exportFileName = `Laporan_${reportType}_${startDate}_sd_${endDate}`;
        exportPeriodInfo = `${startDate} s/d ${endDate}`;
      } else {
        const selectedPeriodeName = selectedPeriodId
          ? periodeList.find((p) => p.id === selectedPeriodId)?.namaPeriode
          : "Semua Periode";
        const selectedSalesName =
          selectedSalesIds.length > 0
            ? salesList
                .filter((s) => selectedSalesIds.includes(s.id))
                .map((s) => s.namaSales)
                .join(", ")
            : "Semua Sales";
        const selectedMingguName = selectedMingguId
          ? mingguList.find((m) => m.id === selectedMingguId)?.namaMinggu
          : "Semua Minggu";

        exportFileName = `Laporan_${reportType}_${selectedPeriodeName}_${selectedYear}`;
        exportPeriodInfo = `${selectedPeriodeName} - ${selectedSalesName} - ${selectedMingguName} - ${
          selectedYear || "Semua Tahun"
        }`;
      }

      // Data Return/BS - TIDAK di-group agar tetap individual
      const returnBsData = filteredSalesData.filter(
        (item) =>
          item.tipeTransaksi &&
          ["RETURN", "BS"].includes(item.tipeTransaksi.toUpperCase())
      );

      console.log("📦 Return/BS data for export:", {
        total: returnBsData.length,
        return: returnBsData.filter(
          (item) => item.tipeTransaksi?.toUpperCase() === "RETURN"
        ).length,
        bs: returnBsData.filter(
          (item) => item.tipeTransaksi?.toUpperCase() === "BS"
        ).length,
        data: returnBsData.map((item) => ({
          produk:
            item.produk?.namaProduk ||
            item.produk?.nama ||
            (item.produk as any)?.nama_produk,
          sales:
            item.sales?.namaSales ||
            item.sales?.nama ||
            (item.sales as any)?.nama_sales,
          qty: item.kuantitas,
          tipe: item.tipeTransaksi,
          tanggal: item.tanggalTransaksi,
        })),
      });

      // Tidak perlu grouping - kirim data langsung agar semua transaksi muncul
      const individualReturnBs = returnBsData.map((item) => ({
        produk: item.produk,
        sales: item.sales,
        kuantitas: Number(item.kuantitas) || 0,
        nominal: Number(item.jumlahPenjualan) || 0,
        tipeTransaksi: item.tipeTransaksi,
        tanggalTransaksi: item.tanggalTransaksi,
        keterangan: item.keterangan,
        product: item.produk?.namaProduk || "-",
        salesName: item.sales?.namaSales || "-",
        revenue:
          (Number(item.kuantitas) || 0) * (Number(item.jumlahPenjualan) || 0),
      }));

      if (format === "excel") {
        ExportService.exportToExcel(
          reportData,
          reportType,
          exportPeriodInfo,
          exportPeriodInfo,
          summary
        );
      } else {
        console.log("📤 Sending data to PDF export:", {
          reportData: reportData.length,
          returnBsData: individualReturnBs.length,
          returnBsDetails: individualReturnBs.map((item) => ({
            produk: item.product,
            sales: item.salesName,
            qty: item.kuantitas,
            nominal: item.nominal,
            tipe: item.tipeTransaksi,
            tanggal: item.tanggalTransaksi,
          })),
        });

        ExportService.exportToPDF(
          reportData,
          reportType,
          exportPeriodInfo,
          exportPeriodInfo,
          summary,
          individualReturnBs, // Data return/BS individual
          selectedExportColumns // Kolom yang dipilih untuk export
        );
      }

      sweetAlert.close();
      await sweetAlert.success(
        `Export ${formatName} Berhasil!`,
        `Laporan ${formatName} berhasil didownload`
      );
    } catch (error) {
      sweetAlert.close();
      await sweetAlert.error(
        `Export ${formatName} Gagal!`,
        `Terjadi kesalahan saat mengexport laporan ${formatName}`
      );
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    sweetAlert.toast.info("Memproses laporan...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      generateReport();
      sweetAlert.toast.success("Laporan berhasil diproses");
    } catch (error) {
      sweetAlert.toast.error("Gagal memproses laporan");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printable-report");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");

    if (printWindow) {
      const selectedPeriodeName = selectedPeriodId
        ? periodeList.find((p) => p.id === selectedPeriodId)?.namaPeriode
        : "Semua Periode";

      const selectedSalesName =
        selectedSalesIds.length > 0
          ? salesList
              .filter((s) => selectedSalesIds.includes(s.id))
              .map((s) => s.namaSales)
              .join(", ")
          : "Semua Sales";

      const selectedMingguName = selectedMingguId
        ? mingguList.find((m) => m.id === selectedMingguId)?.namaMinggu
        : "Semua Minggu";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Laporan Penjualan PERUSAHAAN</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .print-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
            .summary-title { font-size: 14px; color: #666; margin-bottom: 5px; }
            .summary-value { font-size: 24px; font-weight: bold; color: #333; }
            .print-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .print-table th { background-color: #f5f5f5; font-weight: bold; }
            .print-footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            .filter-info { background-color: #f9f9f9; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1 style="margin: 0; font-size: 28px; color: #333;">PERUSAHAAN</h1>
            <h2 style="margin: 10px 0; font-size: 20px; color: #666;">
              Laporan Penjualan ${reportType === "product" && "Per Produk"}
              ${reportType === "sales" && "Per Sales"}
              ${reportType === "jalur" && "Per Jalur"}
              ${reportType === "monthly" && "Per Periode"}
              ${reportType === "weekly" && "Per Minggu"}
              ${reportType === "weekly-sales" && "Per Minggu & Sales"}
            </h2>
            <div class="filter-info">
              <p style="margin: 5px 0; color: #666;">
                <strong>Filter:</strong> Periode: ${selectedPeriodeName} | Sales: ${selectedSalesName} | Minggu: ${selectedMingguName} | Tahun: ${selectedYear}
              </p>
              <p style="margin: 5px 0; color: #666;">
                Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          ${printContent.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const totalRevenue = reportData.reduce((sum, item) => sum + item.revenue, 0);
  const totalQuantity = reportData.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (loading) {
    return <PageLoader text="Memuat data untuk laporan..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button
            onClick={async () => {
              sweetAlert.loading(
                "Memuat Data",
                "Sedang memuat ulang data laporan..."
              );
              await loadReportData();
              sweetAlert.close();
            }}
            className="mt-2 btn-primary"
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1>
        <p className="text-gray-600 mt-2">
          Analisis dan laporan data penjualan real-time
        </p>
      </div>

      {/* Tabs for filter mode */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-t-md border-b-2 font-semibold transition-colors duration-150 ${
            activeTab === "periode"
              ? "border-blue-600 text-blue-700 bg-white"
              : "border-transparent text-gray-500 bg-gray-100"
          }`}
          onClick={() => setActiveTab("periode")}
        >
          Periode
        </button>
        <button
          className={`px-4 py-2 rounded-t-md border-b-2 font-semibold transition-colors duration-150 ${
            activeTab === "tanggal"
              ? "border-blue-600 text-blue-700 bg-white"
              : "border-transparent text-gray-500 bg-gray-100"
          }`}
          onClick={() => setActiveTab("tanggal")}
        >
          Tanggal
        </button>
      </div>

      {/* Report Filters - UPDATED */}
      {activeTab === "periode" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan
              {generating && <LoadingSpinner size="sm" color="blue" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <Label
                  htmlFor="reportType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Jenis Laporan
                </Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                    <SelectItem
                      value="product"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Produk
                    </SelectItem>
                    <SelectItem
                      value="sales"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Sales
                    </SelectItem>
                    <SelectItem
                      value="jalur"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Jalur
                    </SelectItem>
                    <SelectItem
                      value="monthly"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Periode
                    </SelectItem>
                    <SelectItem
                      value="weekly"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Minggu
                    </SelectItem>
                    <SelectItem
                      value="weekly-sales"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Minggu & Sales
                    </SelectItem>
                    <SelectItem
                      value="product-sales"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Produk & Sales
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Tahun */}
              <div>
                <Label
                  htmlFor="selectedYear"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tahun
                </Label>
                <Select
                  value={selectedYear?.toString() || "all"}
                  onValueChange={(value) =>
                    setSelectedYear(
                      value === "all" ? null : Number(value)
                    ) as any
                  }
                >
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                    <SelectItem
                      value="all"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Semua Tahun
                    </SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem
                        key={year}
                        value={year.toString()}
                        className="hover:bg-gray-100 cursor-pointer"
                      >
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Periode (Bulan) */}
              <div>
                <Label
                  htmlFor="selectedPeriod"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Periode (Bulan)
                </Label>
                <Select
                  value={selectedPeriodId?.toString() || "all"}
                  onValueChange={(value) =>
                    setSelectedPeriodId(value === "all" ? null : Number(value))
                  }
                >
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                    <SelectItem
                      value="all"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Semua Bulan
                    </SelectItem>
                    {periodeList.map((periode) => (
                      <SelectItem
                        key={periode.id}
                        value={periode.id.toString()}
                        className="hover:bg-gray-100 cursor-pointer"
                      >
                        {periode.namaPeriode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showProdukSalesFilter && (
                <>
                  {/* Filter Produk Multi-Select */}
                  <div>
                    <Label
                      htmlFor="selectedProducts"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Produk
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          id="selectAllProducts"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            selectedProductIds.length === produkList.length &&
                            produkList.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(
                                produkList.map((p) => p.id)
                              );
                            } else {
                              setSelectedProductIds([]);
                            }
                          }}
                        />
                        <label
                          htmlFor="selectAllProducts"
                          className="text-sm text-gray-600 cursor-pointer"
                        >
                          Pilih Semua Produk ({produkList.length})
                        </label>
                      </div>
                      <ReactSelect
                        isMulti
                        options={produkList
                          .sort((a, b) =>
                            a.namaProduk.localeCompare(b.namaProduk)
                          )
                          .map((produk) => ({
                            value: produk.id,
                            label: produk.namaProduk,
                          }))}
                        value={produkList
                          .filter((produk) =>
                            selectedProductIds.includes(produk.id)
                          )
                          .sort((a, b) =>
                            a.namaProduk.localeCompare(b.namaProduk)
                          )
                          .map((produk) => ({
                            value: produk.id,
                            label: produk.namaProduk,
                          }))}
                        onChange={(selected) =>
                          setSelectedProductIds(
                            selected.map((item) => item.value)
                          )
                        }
                        placeholder="Pilih Produk..."
                        classNamePrefix="react-select"
                        className="min-w-[180px]"
                      />
                    </div>
                  </div>
                  {/* Filter Sales Multi-Select */}
                  <div>
                    <Label
                      htmlFor="selectedSales"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Sales
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          id="selectAllSales"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            selectedSalesIds.length === salesList.length &&
                            salesList.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSalesIds(salesList.map((s) => s.id));
                            } else {
                              setSelectedSalesIds([]);
                            }
                          }}
                        />
                        <label
                          htmlFor="selectAllSales"
                          className="text-sm text-gray-600 cursor-pointer"
                        >
                          Pilih Semua Sales ({salesList.length})
                        </label>
                      </div>
                      <ReactSelect
                        isMulti
                        options={salesList
                          .sort((a, b) =>
                            a.namaSales.localeCompare(b.namaSales)
                          )
                          .map((sales) => ({
                            value: sales.id,
                            label: sales.namaSales,
                          }))}
                        value={salesList
                          .filter((sales) =>
                            selectedSalesIds.includes(sales.id)
                          )
                          .sort((a, b) =>
                            a.namaSales.localeCompare(b.namaSales)
                          )
                          .map((sales) => ({
                            value: sales.id,
                            label: sales.namaSales,
                          }))}
                        onChange={(selected) =>
                          setSelectedSalesIds(
                            selected.map((item) => item.value)
                          )
                        }
                        placeholder="Pilih Sales..."
                        classNamePrefix="react-select"
                        className="min-w-[180px]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Filter Minggu */}
              <div>
                <Label
                  htmlFor="selectedMinggu"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Minggu
                </Label>
                <Select
                  value={selectedMingguId?.toString() || "all"}
                  onValueChange={(value) =>
                    setSelectedMingguId(value === "all" ? null : Number(value))
                  }
                >
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                    <SelectItem
                      value="all"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Semua Minggu
                    </SelectItem>
                    {mingguList.map((minggu) => (
                      <SelectItem
                        key={minggu.id}
                        value={minggu.id.toString()}
                        className="hover:bg-gray-100 cursor-pointer"
                      >
                        {minggu.namaMinggu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="btn-success w-full flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <LoadingSpinner size="sm" color="green" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Generate Laporan
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Filter Status */}
            <div className="mt-4 flex items-center justify-between bg-slate-50 rounded-lg p-3">
              <div className="flex items-center space-x-4 text-sm text-slate-600">
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
                {selectedSalesIds.length > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg font-medium">
                    {salesList
                      .filter((s) => selectedSalesIds.includes(s.id))
                      .map((s) => s.namaSales)
                      .join(", ")}
                  </span>
                )}
                {selectedProductIds.length > 0 && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg font-medium">
                    {produkList
                      .filter((p) => selectedProductIds.includes(p.id))
                      .map((p) => p.namaProduk)
                      .join(", ")}
                  </span>
                )}
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg font-medium">
                  Tahun {selectedYear}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {activeTab === "tanggal" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan By Tanggal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tambahkan dropdown Jenis Laporan di tab tanggal */}
              <div>
                <Label
                  htmlFor="reportTypeTanggal"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Jenis Laporan
                </Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                    <SelectItem
                      value="product"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Produk
                    </SelectItem>
                    <SelectItem
                      value="sales"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Sales
                    </SelectItem>
                    <SelectItem
                      value="jalur"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Jalur
                    </SelectItem>
                    <SelectItem
                      value="monthly"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Periode
                    </SelectItem>
                    <SelectItem
                      value="weekly"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Minggu
                    </SelectItem>
                    <SelectItem
                      value="weekly-sales"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Minggu & Sales
                    </SelectItem>
                    <SelectItem
                      value="product-sales"
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      Per Produk & Sales
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Tanggal Mulai */}
              <div>
                <Label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tanggal Mulai
                </Label>
                <input
                  type="date"
                  id="startDate"
                  className="input-field w-full"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              {/* Tanggal Akhir */}
              <div>
                <Label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tanggal Akhir
                </Label>
                <input
                  type="date"
                  id="endDate"
                  className="input-field w-full"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Toggle untuk Sub-Filter */}
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDateSubFilters(!showDateSubFilters)}
                className="flex items-center gap-2 text-sm"
              >
                <Filter className="h-4 w-4" />
                {showDateSubFilters ? "Sembunyikan" : "Tampilkan"} Filter
                Tambahan
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showDateSubFilters ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>

            {/* Sub-Filter Produk & Sales */}
            {showDateSubFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Filter Tambahan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filter Produk Multi-Select */}
                  <div>
                    <Label
                      htmlFor="dateSelectedProducts"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Produk
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          id="selectAllDateProducts"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            dateSelectedProductIds.length ===
                              produkList.length && produkList.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDateSelectedProductIds(
                                produkList.map((p) => p.id)
                              );
                            } else {
                              setDateSelectedProductIds([]);
                            }
                          }}
                        />
                        <label
                          htmlFor="selectAllDateProducts"
                          className="text-sm text-gray-600 cursor-pointer"
                        >
                          Pilih Semua Produk ({produkList.length})
                        </label>
                      </div>
                      <ReactSelect
                        isMulti
                        options={produkList
                          .sort((a, b) =>
                            a.namaProduk.localeCompare(b.namaProduk)
                          )
                          .map((produk) => ({
                            value: produk.id,
                            label: produk.namaProduk,
                          }))}
                        value={produkList
                          .filter((produk) =>
                            dateSelectedProductIds.includes(produk.id)
                          )
                          .sort((a, b) =>
                            a.namaProduk.localeCompare(b.namaProduk)
                          )
                          .map((produk) => ({
                            value: produk.id,
                            label: produk.namaProduk,
                          }))}
                        onChange={(selected) =>
                          setDateSelectedProductIds(
                            selected.map((item) => item.value)
                          )
                        }
                        placeholder="Pilih Produk..."
                        classNamePrefix="react-select"
                        className="min-w-[180px]"
                      />
                    </div>
                  </div>
                  {/* Filter Sales Multi-Select */}
                  <div>
                    <Label
                      htmlFor="dateSelectedSales"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Sales
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          id="selectAllDateSales"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={
                            dateSelectedSalesIds.length === salesList.length &&
                            salesList.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDateSelectedSalesIds(
                                salesList.map((s) => s.id)
                              );
                            } else {
                              setDateSelectedSalesIds([]);
                            }
                          }}
                        />
                        <label
                          htmlFor="selectAllDateSales"
                          className="text-sm text-gray-600 cursor-pointer"
                        >
                          Pilih Semua Sales ({salesList.length})
                        </label>
                      </div>
                      <ReactSelect
                        isMulti
                        options={salesList
                          .sort((a, b) =>
                            a.namaSales.localeCompare(b.namaSales)
                          )
                          .map((sales) => ({
                            value: sales.id,
                            label: sales.namaSales,
                          }))}
                        value={salesList
                          .filter((sales) =>
                            dateSelectedSalesIds.includes(sales.id)
                          )
                          .sort((a, b) =>
                            a.namaSales.localeCompare(b.namaSales)
                          )
                          .map((sales) => ({
                            value: sales.id,
                            label: sales.namaSales,
                          }))}
                        onChange={(selected) =>
                          setDateSelectedSalesIds(
                            selected.map((item) => item.value)
                          )
                        }
                        placeholder="Pilih Sales..."
                        classNamePrefix="react-select"
                        className="min-w-[180px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-end mt-4">
              <Button
                className="btn-success w-full flex items-center gap-2"
                disabled={!startDate || !endDate || dateLoading}
                onClick={async () => {
                  setDateLoading(true);
                  setDateError(null);
                  try {
                    console.log("🔍 Fetching data for date range:", {
                      startDate,
                      endDate,
                    });
                    const data = await apiService.getPenjualanByDateRange(
                      startDate,
                      endDate
                    );
                    console.log("📊 Raw data from API:", data);
                    console.log("📈 Data count by type:", {
                      total: data.length,
                      penjualan: data.filter(
                        (item) =>
                          !item.tipeTransaksi ||
                          item.tipeTransaksi.toUpperCase() === "PENJUALAN"
                      ).length,
                      return: data.filter(
                        (item) =>
                          item.tipeTransaksi &&
                          item.tipeTransaksi.toUpperCase() === "RETURN"
                      ).length,
                      bs: data.filter(
                        (item) =>
                          item.tipeTransaksi &&
                          item.tipeTransaksi.toUpperCase() === "BS"
                      ).length,
                    });

                    // Filter data berdasarkan sub-filter jika ada
                    let filteredData = data;

                    if (dateSelectedProductIds.length > 0) {
                      filteredData = filteredData.filter(
                        (item) =>
                          item.produk?.id &&
                          dateSelectedProductIds.includes(item.produk.id)
                      );
                      console.log(
                        "🔍 After product filter:",
                        filteredData.length
                      );
                    }

                    if (dateSelectedSalesIds.length > 0) {
                      filteredData = filteredData.filter(
                        (item) =>
                          item.sales?.id &&
                          dateSelectedSalesIds.includes(item.sales.id)
                      );
                      console.log(
                        "🔍 After sales filter:",
                        filteredData.length
                      );
                    }

                    console.log("✅ Final filtered data:", filteredData.length);
                    setSalesData(filteredData);
                    setFilteredSalesData(filteredData);

                    // Set flag bahwa report sudah di-generate untuk tab tanggal
                    setDateReportGenerated(true);

                    // Generate report akan otomatis dipanggil karena useEffect
                  } catch (err) {
                    console.error("❌ Error fetching date range data:", err);
                    setDateError("Gagal mengambil data laporan by tanggal");
                  } finally {
                    setDateLoading(false);
                  }
                }}
              >
                {dateLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="green" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Generate Laporan
                  </>
                )}
              </Button>
            </div>
            {dateError && <div className="text-red-600 mt-2">{dateError}</div>}

            {/* Filter Status untuk Tab Tanggal */}
            <div className="mt-4 flex items-center justify-between bg-slate-50 rounded-lg p-3">
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <span>Data Ditampilkan:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-medium">
                  {filteredSalesData.length} transaksi
                </span>
                {startDate && endDate && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg font-medium">
                    {startDate} s/d {endDate}
                  </span>
                )}
                {dateSelectedProductIds.length > 0 && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg font-medium">
                    {produkList
                      .filter((p) => dateSelectedProductIds.includes(p.id))
                      .map((p) => p.namaProduk)
                      .join(", ")}
                  </span>
                )}
                {dateSelectedSalesIds.length > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg font-medium">
                    {salesList
                      .filter((s) => dateSelectedSalesIds.includes(s.id))
                      .map((s) => s.namaSales)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Penjualan
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredSalesData
                    .filter(
                      (item) =>
                        !item.tipeTransaksi ||
                        item.tipeTransaksi.toUpperCase() === "PENJUALAN"
                    )
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
                  -
                  {filteredSalesData
                    .filter(
                      (item) =>
                        item.tipeTransaksi &&
                        item.tipeTransaksi.toUpperCase() === "RETURN"
                    )
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
                  -
                  {filteredSalesData
                    .filter(
                      (item) =>
                        item.tipeTransaksi &&
                        item.tipeTransaksi.toUpperCase() === "BS"
                    )
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Report Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {reportType === "product" && "Grafik Penjualan Per Produk"}
              {reportType === "sales" && "Grafik Penjualan Per Sales"}
              {reportType === "jalur" && "Grafik Penjualan Per Jalur"}
              {reportType === "monthly" && "Grafik Penjualan Per Periode"}
              {reportType === "weekly" && "Grafik Penjualan Per Minggu"}
              {reportType === "weekly-sales" &&
                "Grafik Penjualan Per Minggu & Sales"}
              {reportType === "product-sales" &&
                "Grafik Penjualan Per Produk & Sales"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="h-80 flex items-center justify-center">
                <LoadingSpinner
                  size="lg"
                  color="blue"
                  text="Memproses grafik..."
                />
              </div>
            ) : activeTab === "tanggal" && !dateReportGenerated ? (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Grafik Belum Tersedia
                  </h3>
                  <p className="text-gray-500">
                    Silakan pilih tanggal dan klik "Generate Laporan" untuk
                    melihat grafik
                  </p>
                </div>
              </div>
            ) : (
              <ReportsChart data={reportData} />
            )}
          </CardContent>
        </Card>

        {/* Report Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {reportType === "product" && "Laporan Penjualan Per Produk"}
              {reportType === "sales" && "Laporan Penjualan Per Sales"}
              {reportType === "jalur" && "Laporan Penjualan Per Jalur"}
              {reportType === "monthly" && "Laporan Penjualan Per Periode"}
              {reportType === "weekly" && "Laporan Penjualan Per Minggu"}
              {reportType === "weekly-sales" &&
                "Laporan Penjualan Per Minggu & Sales"}
              {reportType === "product-sales" &&
                "Laporan Penjualan Per Produk & Sales"}
            </CardTitle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isExporting || generating || !reportData.length}
                  className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <LoadingSpinner size="sm" color="green" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export
                      <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white border border-gray-200 shadow-lg rounded-md p-1"
              >
                <DropdownMenuItem
                  onClick={() => setShowExportModal(true)}
                  disabled={isExporting || generating || !reportData.length}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-sm transition-colors"
                >
                  <FileText className="h-4 w-4 text-red-600" />
                  <span className="text-gray-900">Pilih Kolom PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="h-80 flex items-center justify-center">
                <LoadingSpinner
                  size="lg"
                  color="blue"
                  text="Memproses tabel..."
                />
              </div>
            ) : activeTab === "tanggal" && !dateReportGenerated ? (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Tabel Laporan Belum Tersedia
                  </h3>
                  <p className="text-gray-500">
                    Silakan pilih tanggal dan klik "Generate Laporan" untuk
                    melihat data tabel
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {reportType === "product" && "Produk"}
                        {reportType === "sales" && "Sales"}
                        {reportType === "jalur" && "Jalur"}
                        {reportType === "monthly" && "Periode"}
                        {reportType === "weekly" && "Minggu"}
                        {reportType === "weekly-sales" && "Minggu & Sales"}
                        {reportType === "product-sales" && "Produk & Sales"}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Transaksi
                      </th>
                      {(reportType === "product" ||
                        reportType === "product-sales") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Unit
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Penjualan
                      </th>
                      {(reportType === "product" ||
                        reportType === "product-sales") && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Avg/Unit
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipe Transaksi
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((item, index) => (
                      <tr key={index} className="table-row">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.product}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        {(reportType === "product" ||
                          reportType === "product-sales") && (
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              📦 {item.totalUnits || 0} unit
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.revenue.toLocaleString("id-ID")}
                        </td>
                        {(reportType === "product" ||
                          reportType === "product-sales") && (
                          <td className="px-4 py-3 text-sm text-green-600 font-medium">
                            {item.totalUnits > 0
                              ? (item.revenue / item.totalUnits).toLocaleString(
                                  "id-ID"
                                )
                              : "0"}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.tipeTransaksi || "PENJUALAN"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">
                              {item.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Integration Status */}
      {analyticsData && (
        <Card className="border-l-4 border-l-blue-500 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Data Analytics Terintegrasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Data Penjualan</p>
                <p className="text-lg font-semibold text-blue-600">
                  {analyticsData.salesData?.length || 0} records
                </p>
              </div>
              <div>
                <p className="text-gray-600">Produk Terlaris</p>
                <p className="text-lg font-semibold text-green-600">
                  {analyticsData.productPerformance?.length || 0} items
                </p>
              </div>
              <div>
                <p className="text-gray-600">Performa Sales</p>
                <p className="text-lg font-semibold text-purple-600">
                  {analyticsData.salesPerformance?.length || 0} sales
                </p>
              </div>
              <div>
                <p className="text-gray-600">Jalur Distribusi</p>
                <p className="text-lg font-semibold text-orange-600">
                  {analyticsData.jalurAnalysis?.length || 0} jalur
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BS and Return Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ringkasan Return & Barang Susut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Return Summary */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Jumlah Return
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {
                      filteredSalesData.filter(
                        (item) =>
                          item.tipeTransaksi &&
                          item.tipeTransaksi.toUpperCase() === "RETURN"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-red-500">transaksi</p>
                </div>
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">↩️</span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Total Unit Return
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredSalesData
                      .filter(
                        (item) =>
                          item.tipeTransaksi &&
                          item.tipeTransaksi.toUpperCase() === "RETURN"
                      )
                      .reduce(
                        (sum, item) => sum + Number(item.kuantitas || 1),
                        0
                      )}
                  </p>
                  <p className="text-xs text-red-500">unit</p>
                </div>
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">📦</span>
                </div>
              </div>
            </div>

            {/* BS Summary */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    Jumlah BS
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {
                      filteredSalesData.filter(
                        (item) =>
                          item.tipeTransaksi &&
                          item.tipeTransaksi.toUpperCase() === "BS"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-orange-500">transaksi</p>
                </div>
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-lg">⚠️</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    Total Unit BS
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredSalesData
                      .filter(
                        (item) =>
                          item.tipeTransaksi &&
                          item.tipeTransaksi.toUpperCase() === "BS"
                      )
                      .reduce(
                        (sum, item) => sum + Number(item.kuantitas || 1),
                        0
                      )}
                  </p>
                  <p className="text-xs text-orange-500">unit</p>
                </div>
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-lg">📦</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BS and Return Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Return Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <FileText className="h-5 w-5" />
              Data Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const returnData = filteredSalesData.filter(
                (item) =>
                  item.tipeTransaksi &&
                  item.tipeTransaksi.toUpperCase() === "RETURN"
              );

              if (returnData.length === 0) {
                return (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-gray-500">Tidak ada data return</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                          Produk
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                          Sales
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                          Harga
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {returnData.map((item, index) => (
                        <tr key={index} className="hover:bg-red-25">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.produk?.namaProduk || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.sales?.namaSales || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              {item.kuantitas || 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {Number(item.jumlahPenjualan || 0).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-red-600">
                            {(
                              Number(item.jumlahPenjualan || 0) *
                              Number(item.kuantitas || 1)
                            ).toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.tanggalTransaksi
                              ? new Date(
                                  item.tanggalTransaksi
                                ).toLocaleDateString("id-ID")
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.keterangan || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-red-50">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-sm font-semibold text-red-700"
                        >
                          Total Return:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-red-600">
                          {returnData
                            .reduce(
                              (sum, item) =>
                                sum +
                                Number(item.jumlahPenjualan || 0) *
                                  Number(item.kuantitas || 1),
                              0
                            )
                            .toLocaleString("id-ID")}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* BS Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <FileText className="h-5 w-5" />
              Data Barang Susut (BS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const bsData = filteredSalesData.filter(
                (item) =>
                  item.tipeTransaksi &&
                  item.tipeTransaksi.toUpperCase() === "BS"
              );

              if (bsData.length === 0) {
                return (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-gray-500">Tidak ada data barang susut</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                          Produk
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                          Sales
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                          Harga
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bsData.map((item, index) => (
                        <tr key={index} className="hover:bg-orange-25">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.produk?.namaProduk || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.sales?.namaSales || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              {item.kuantitas || 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {Number(item.jumlahPenjualan || 0).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-orange-600">
                            {(
                              Number(item.jumlahPenjualan || 0) *
                              Number(item.kuantitas || 1)
                            ).toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.tanggalTransaksi
                              ? new Date(
                                  item.tanggalTransaksi
                                ).toLocaleDateString("id-ID")
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.keterangan || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-orange-50">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-sm font-semibold text-orange-700"
                        >
                          Total BS:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-orange-600">
                          {bsData
                            .reduce(
                              (sum, item) =>
                                sum +
                                Number(item.jumlahPenjualan || 0) *
                                  Number(item.kuantitas || 1),
                              0
                            )
                            .toLocaleString("id-ID")}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Printable Report Content */}
      <div id="printable-report" style={{ display: "none" }}>
        <div className="print-header">
          <h1 style={{ margin: 0, fontSize: "28px", color: "#333" }}>
            PERUSAHAAN
          </h1>
          <h2 style={{ margin: "10px 0", fontSize: "20px", color: "#666" }}>
            Laporan Penjualan {reportType === "product" && "Per Produk"}
            {reportType === "sales" && "Per Sales"}
            {reportType === "jalur" && "Per Jalur"}
            {reportType === "monthly" && "Per Periode"}
            {reportType === "weekly" && "Per Minggu"}
            {reportType === "weekly-sales" && "Per Minggu & Sales"}
            {reportType === "product-sales" && "Per Produk & Sales"}
          </h2>
          <div
            style={{
              background: "#f9f9f9",
              padding: "10px",
              marginBottom: "20px",
              borderRadius: "5px",
            }}
          >
            <p style={{ margin: "5px 0", color: "#666" }}>
              <strong>Filter:</strong> Periode:{" "}
              {selectedPeriodId
                ? periodeList.find((p) => p.id === selectedPeriodId)
                    ?.namaPeriode
                : "Semua Periode"}{" "}
              | Sales:{" "}
              {selectedSalesIds.length > 0
                ? salesList
                    .filter((s) => selectedSalesIds.includes(s.id))
                    .map((s) => s.namaSales)
                    .join(", ")
                : "Semua Sales"}{" "}
              | Minggu:{" "}
              {selectedMingguId
                ? mingguList.find((m) => m.id === selectedMingguId)?.namaMinggu
                : "Semua Minggu"}{" "}
              | Tahun {selectedYear}
            </p>
            <p style={{ margin: "5px 0", color: "#666" }}>
              Dicetak pada:{" "}
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="print-summary">
          <div className="summary-card">
            <div className="summary-title">Total Penjualan</div>
            <div className="summary-value" style={{ color: "#059669" }}>
              Rp {totalRevenue.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-title">Total Transaksi</div>
            <div className="summary-value" style={{ color: "#2563eb" }}>
              {totalQuantity} Transaksi
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-title">Rata-rata per Transaksi</div>
            <div className="summary-value" style={{ color: "#7c3aed" }}>
              Rp{" "}
              {totalQuantity > 0
                ? Math.round(totalRevenue / totalQuantity).toLocaleString(
                    "id-ID"
                  )
                : "0"}
            </div>
          </div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>
                {reportType === "product" && "Produk"}
                {reportType === "sales" && "Sales"}
                {reportType === "jalur" && "Jalur"}
                {reportType === "monthly" && "Periode"}
                {reportType === "weekly" && "Minggu"}
                {reportType === "weekly-sales" && "Minggu & Sales"}
                {reportType === "product-sales" && "Produk & Sales"}
              </th>
              <th>Transaksi</th>
              {(reportType === "product" || reportType === "product-sales") && (
                <th>Total Unit</th>
              )}
              {(reportType === "product" || reportType === "product-sales") && (
                <th>Avg/Unit</th>
              )}
              <th>Total Penjualan</th>
              <th>Persentase</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((item, index) => (
              <tr key={index}>
                <td>{item.product}</td>
                <td>{item.quantity}</td>
                {(reportType === "product" ||
                  reportType === "product-sales") && (
                  <td>{item.totalUnits || 0} unit</td>
                )}
                {(reportType === "product" ||
                  reportType === "product-sales") && (
                  <td>
                    {item.totalUnits > 0
                      ? (item.revenue / item.totalUnits).toLocaleString("id-ID")
                      : "0"}
                  </td>
                )}
                <td>Rp {item.revenue.toLocaleString("id-ID")}</td>
                <td>{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-footer">
          <p>Laporan ini digenerate secara otomatis oleh sistem PERUSAHAAN</p>
          <p>© 2024 PERUSAHAAN - Semua hak dilindungi</p>
        </div>
      </div>

      {/* Report Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Preview Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">
              Laporan Penjualan PERUSAHAAN
            </h2>
            {analyticsData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-green-600">
                      Total Revenue
                    </h3>
                    <p className="text-2xl font-bold">
                      {analyticsData.metrics?.totalRevenue?.toLocaleString(
                        "id-ID"
                      ) || "0"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-blue-600">
                      Total Transaksi
                    </h3>
                    <p className="text-2xl font-bold">
                      {analyticsData.metrics?.totalOrders || "0"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-purple-600">
                      Unit Terjual
                    </h3>
                    <p className="text-2xl font-bold">
                      {analyticsData.metrics?.totalUnits || "0"}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-orange-600">
                      Sales Aktif
                    </h3>
                    <p className="text-2xl font-bold">
                      {analyticsData.metrics?.uniqueCustomers || "0"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Data analytics tidak tersedia. Silakan ambil data dari Analytics
                Dashboard.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Column Selection Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pilih Kolom untuk Export PDF
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="export-product"
                  checked={selectedExportColumns.product}
                  onChange={(e) =>
                    setSelectedExportColumns((prev) => ({
                      ...prev,
                      product: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="export-product"
                  className="text-sm font-medium text-gray-700"
                >
                  {reportType === "product" && "Produk"}
                  {reportType === "sales" && "Sales"}
                  {reportType === "jalur" && "Jalur"}
                  {reportType === "monthly" && "Periode"}
                  {reportType === "weekly" && "Minggu"}
                  {reportType === "weekly-sales" && "Minggu & Sales"}
                  {reportType === "product-sales" && "Produk & Sales"}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="export-quantity"
                  checked={selectedExportColumns.quantity}
                  onChange={(e) =>
                    setSelectedExportColumns((prev) => ({
                      ...prev,
                      quantity: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="export-quantity"
                  className="text-sm font-medium text-gray-700"
                >
                  Jumlah Transaksi
                </label>
              </div>

              {(reportType === "product" || reportType === "product-sales") && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="export-totalUnits"
                    checked={selectedExportColumns.totalUnits}
                    onChange={(e) =>
                      setSelectedExportColumns((prev) => ({
                        ...prev,
                        totalUnits: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="export-totalUnits"
                    className="text-sm font-medium text-gray-700"
                  >
                    Total Unit
                  </label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="export-revenue"
                  checked={selectedExportColumns.revenue}
                  onChange={(e) =>
                    setSelectedExportColumns((prev) => ({
                      ...prev,
                      revenue: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="export-revenue"
                  className="text-sm font-medium text-gray-700"
                >
                  Total Penjualan
                </label>
              </div>

              {(reportType === "product" || reportType === "product-sales") && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="export-avgPerUnit"
                    checked={selectedExportColumns.avgPerUnit}
                    onChange={(e) =>
                      setSelectedExportColumns((prev) => ({
                        ...prev,
                        avgPerUnit: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="export-avgPerUnit"
                    className="text-sm font-medium text-gray-700"
                  >
                    Harga per Unit
                  </label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="export-tipeTransaksi"
                  checked={selectedExportColumns.tipeTransaksi}
                  onChange={(e) =>
                    setSelectedExportColumns((prev) => ({
                      ...prev,
                      tipeTransaksi: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="export-tipeTransaksi"
                  className="text-sm font-medium text-gray-700"
                >
                  Tipe Transaksi
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="export-percentage"
                  checked={selectedExportColumns.percentage}
                  onChange={(e) =>
                    setSelectedExportColumns((prev) => ({
                      ...prev,
                      percentage: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="export-percentage"
                  className="text-sm font-medium text-gray-700"
                >
                  Persentase (%)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="export-keterangan"
                  checked={selectedExportColumns.keterangan}
                  onChange={(e) =>
                    setSelectedExportColumns((prev) => ({
                      ...prev,
                      keterangan: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="export-keterangan"
                  className="text-sm font-medium text-gray-700"
                >
                  Keterangan
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedExportColumns({
                      product: true,
                      quantity: true,
                      totalUnits: true,
                      revenue: true,
                      avgPerUnit: true,
                      tipeTransaksi: true,
                      percentage: true,
                      keterangan: true,
                    });
                  }}
                  className="text-xs"
                >
                  Pilih Semua
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedExportColumns({
                      product: false,
                      quantity: false,
                      totalUnits: false,
                      revenue: false,
                      avgPerUnit: false,
                      tipeTransaksi: false,
                      percentage: false,
                      keterangan: false,
                    });
                  }}
                  className="text-xs"
                >
                  Kosongkan
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  className="text-sm"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => {
                    const hasSelectedColumns = Object.values(
                      selectedExportColumns
                    ).some((v) => v);
                    if (!hasSelectedColumns) {
                      sweetAlert.toast.warning(
                        "Pilih minimal satu kolom untuk export"
                      );
                      return;
                    }
                    handleExport("pdf");
                    setShowExportModal(false);
                  }}
                  disabled={Object.values(selectedExportColumns).every(
                    (v) => !v
                  )}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
