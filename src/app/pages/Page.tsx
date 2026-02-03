"use client";

import { SetStateAction, useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { apiService, PenjualanData, ProdukData } from "@/app/services/api";
import { sweetAlert } from "@/app/utils/sweetAlert";
import {
  LoadingSpinner,
  PageLoader,
  TableSkeleton,
} from "@/app/components/ui/LoadingSpinner";
import { authService } from "@/app/services/authService";
import NekoAiChat from "@/app/components/NekoAiChat";
import * as XLSX from "xlsx";

export default function SalesListPage() {
  const [salesData, setSalesData] = useState<PenjualanData[]>([]);
  const [produkList, setProdukList] = useState<ProdukData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"penjualan" | "return">(
    "penjualan"
  );

  // Tambahkan state untuk filter periode
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [periodeList, setPeriodeList] = useState<any[]>([]);

  // Tambahkan state untuk mode filter (periode/tanggal)
  const [filterMode, setFilterMode] = useState<"periode" | "tanggal">(
    "periode"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateLoading, setDateLoading] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    const cleanupAuth = () => {
      try {
        const token = localStorage.getItem("authToken");
        const user = localStorage.getItem("currentUser");

        if (!token || !user) {
          // ✅ JANGAN REDIRECT, CUMA LOG WARNING
          console.warn("No token or user data found");
          return false;
        }

        // ✅ RETURN TRUE AGAR LOAD DATA
        console.warn("Auth check completed");
        return true;
      } catch (error) {
        console.warn("Auth cleanup error:", error);
        return false;
      }
    };

    // ✅ SELALU LOAD DATA, TIDAK PERLU CEK CLEANUP
    loadData();
  }, []);

  useEffect(() => {
    // Jika mode filter berubah ke periode, reset data ke default
    if (filterMode === "periode") {
      loadData();
    }
    // Jika mode tanggal, kosongkan filter periode
    if (filterMode === "tanggal") {
      setSelectedPeriodId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        penjualanData,
        produkData,
        totalMinggu,
        salesListData,
        periodeData,
      ] = await Promise.all([
        apiService.getAllPenjualan(),
        apiService.getAllProduk(),
        apiService.getTotalPenjualanPerMinggu(),
        apiService.getAllSales(),
        apiService.getAllPeriode(),
      ]);

      setSalesData(penjualanData);
      setProdukList(produkData);

      // PERBAIKAN: Sort periode berdasarkan tanggal terbaru atau ID terbesar
      // Add interface for periode data
      interface PeriodeData {
        id: number;
        namaPeriode: string;
        createdAt?: string;
      }

      const sortedPeriode: PeriodeData[] = periodeData.sort(
        (a: PeriodeData, b: PeriodeData) => {
          // Jika ada createdAt, sort berdasarkan tanggal
          if (a.createdAt && b.createdAt) {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
          // Jika tidak ada, sort berdasarkan ID terbesar (asumsi ID terbesar = periode terbaru)
          return (b.id || 0) - (a.id || 0);
        }
      );

      setPeriodeList(sortedPeriode);

      // PERBAIKAN: Set default ke null (Semua Periode) agar user bisa melihat semua data
      // User dapat memilih periode spesifik jika diperlukan
      if (!selectedPeriodId) {
        setSelectedPeriodId(null); // null = Semua Periode
        console.log(
          `Default: Menampilkan SEMUA periode (${sortedPeriode.length} periode tersedia)`
        );
      }

      setError(null);
    } catch (err) {
      setError("Gagal memuat data");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    sweetAlert.toast.info("Memuat ulang data...");

    try {
      await loadData();
      sweetAlert.toast.success("Data berhasil dimuat ulang");
    } catch (error) {
      sweetAlert.toast.error("Gagal memuat ulang data");
    } finally {
      setRefreshing(false);
    }
  };

  // Pisahkan data penjualan dan return/BS
  const penjualanData = salesData.filter((item) => {
    return (
      !item.tipeTransaksi ||
      item.tipeTransaksi === "" ||
      (typeof item.tipeTransaksi === "string" &&
        item.tipeTransaksi?.toUpperCase() === "PENJUALAN")
    );
  });
  const returnData = salesData.filter((item) => {
    return (
      item.tipeTransaksi &&
      item.tipeTransaksi !== "" &&
      typeof item.tipeTransaksi === "string" &&
      item.tipeTransaksi?.toUpperCase() !== "PENJUALAN"
    );
  });

  // Ganti filteredData menjadi tergantung tab aktif
  const baseData = activeTab === "penjualan" ? penjualanData : returnData;

  // Step 1: Filter by search term
  const afterSearchFilter = baseData.filter(
    (item) =>
      item.sales?.namaSales?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.produk?.namaProduk
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.jalur?.namaJalur?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Step 2: Filter by product
  const afterProductFilter = afterSearchFilter.filter((item) => {
    if (filterProduct === "all") return true;
    return item.produk?.id === Number(filterProduct);
  });

  // Step 3: Filter by periode
  const afterPeriodeFilter = afterProductFilter.filter((item) => {
    if (filterMode === "periode") {
      // Jika selectedPeriodId adalah null atau "all", tampilkan semua data
      if (!selectedPeriodId || selectedPeriodId === null) {
        return true; // Tampilkan semua periode
      }
      // Filter berdasarkan periode yang dipilih
      return item.periode?.id === selectedPeriodId;
    }
    // Jika mode tanggal, tidak filter periode
    return true;
  });

  // Step 4: Sort
  const filteredData = afterPeriodeFilter.sort((a, b) => {
    const mingguIdA = a.minggu?.id || 0;
    const mingguIdB = b.minggu?.id || 0;
    if (mingguIdA !== mingguIdB) {
      return mingguIdB - mingguIdA;
    }
    return (b.id || 0) - (a.id || 0);
  });

  // Debug log untuk memastikan sorting benar
  console.log("DEBUG - Hasil Filter:");
  console.log("Filter mode:", filterMode);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleDelete = async (id: number) => {
    const result = await sweetAlert.confirm(
      "Hapus Data Penjualan?",
      "Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?",
      "Ya, Hapus!",
      "Batal"
    );

    if (result.isConfirmed) {
      try {
        sweetAlert.loading(
          "Menghapus Data",
          "Sedang menghapus data penjualan..."
        );

        await apiService.deletePenjualan(id);

        sweetAlert.close();
        await sweetAlert.success(
          "Berhasil!",
          "Data penjualan berhasil dihapus"
        );

        loadData();
      } catch (err) {
        sweetAlert.close();
        sweetAlert.error(
          "Gagal Menghapus",
          "Terjadi kesalahan saat menghapus data. Silakan coba lagi."
        );
      }
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Update prepareSalesListDataForAI untuk angka Romawi
  const prepareSalesListDataForAI = () => ({
    totalSales: salesData.length,
    totalProducts: produkList.length,
    filteredResults: filteredData.length,
    searchTerm,
    filterProduct,
    selectedPeriod: selectedPeriodId
      ? periodeList.find((p) => p.id === selectedPeriodId)?.namaPeriode
      : "Periode Terbaru",
    currentPage,
    totalPages,
    pageType: "salesList",
    recentSales: filteredData.slice(-5),
    topProducts: produkList.slice(0, 5),
    totalRevenue: (() => {
      // Pisahkan data berdasarkan tipeTransaksi
      const penjualanNormal = filteredData.filter(
        (item) =>
          !item.tipeTransaksi ||
          item.tipeTransaksi.toUpperCase() === "PENJUALAN"
      );
      const penjualanReturn = filteredData.filter(
        (item) =>
          item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
      );
      const penjualanBS = filteredData.filter(
        (item) =>
          item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
      );

      return (
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
        }, 0)
      );
    })(),
    periodeList: periodeList,
    sortingInfo: {
      sortedByWeek: true,
      weekOrder: "Minggu V → Minggu I",
      description:
        "Data diurutkan berdasarkan minggu (V-I), input terakhir dulu",
      defaultPeriod: periodeList[0]?.namaPeriode || "Tidak ada periode",
      isLatestPeriod: selectedPeriodId === periodeList[0]?.id,
    },
  });

  // Update exportToExcel untuk export data yang sudah difilter
  const exportToExcel = async () => {
    try {
      setExporting(true);
      sweetAlert.loading("Mengexport Data", "Sedang menyiapkan file Excel...");

      // Data yang akan diexport adalah data yang sudah difilter
      const dataToExport = filteredData;

      if (dataToExport.length === 0) {
        sweetAlert.close();
        sweetAlert.info(
          "Tidak Ada Data",
          "Tidak ada data untuk diexport berdasarkan filter yang dipilih."
        );
        return;
      }

      // PERBAIKAN: Deklarasikan variabel di awal sebelum digunakan
      const selectedPeriodName = selectedPeriodId
        ? periodeList.find((p) => p.id === selectedPeriodId)?.namaPeriode ||
          "Periode Tidak Diketahui"
        : "Semua Periode";

      const selectedProductName =
        filterProduct === "all"
          ? "Semua Produk"
          : produkList.find((p) => p.id === Number(filterProduct))
              ?.namaProduk || "Produk Tidak Diketahui";

      // Prepare Excel data dengan header yang lebih informatif
      const excelData = [
        [
          "PERIODE",
          "SALES",
          "PRODUK",
          "KUANTITAS",
          "JALUR",
          "HARI",
          "MINGGU",
          "TANGGAL TRANSAKSI", // Tambahkan kolom tanggal transaksi
          "HARGA PER UNIT",
          "TOTAL PENJUALAN",
          "KETERANGAN",
          "", // Spacing column
          "RINGKASAN PENJUALAN", // Summary header starts at column L (index 11)
        ],
        ...dataToExport.map((sale) => [
          sale.periode?.namaPeriode || "-",
          sale.sales?.namaSales || "-",
          sale.produk?.namaProduk || "-",
          Number(sale.kuantitas || 1),
          sale.jalur?.namaJalur || "-",
          sale.hari?.namaHari || "-",
          sale.minggu?.namaMinggu || "-",
          sale.tanggalTransaksi
            ? new Date(sale.tanggalTransaksi).toLocaleDateString("id-ID")
            : "-", // Isi tanggal transaksi
          Number(sale.jumlahPenjualan || 0),
          Number(sale.kuantitas || 1) * Number(sale.jumlahPenjualan || 0),
          sale.keterangan || "-",
          "", // Spacing
          "", // Summary column akan diisi terpisah
        ]),
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths - tambah kolom untuk summary
      const colWidths = [
        { wch: 15 }, // PERIODE
        { wch: 20 }, // SALES
        { wch: 25 }, // PRODUK
        { wch: 12 }, // KUANTITAS
        { wch: 15 }, // JALUR
        { wch: 12 }, // HARI
        { wch: 12 }, // MINGGU
        { wch: 18 }, // TANGGAL TRANSAKSI
        { wch: 18 }, // HARGA PER UNIT
        { wch: 20 }, // TOTAL PENJUALAN
        { wch: 30 }, // KETERANGAN
        { wch: 3 }, // Spacing
        { wch: 25 }, // RINGKASAN SALES
        { wch: 15 }, // TOTAL KUANTITAS
        { wch: 20 }, // TOTAL PENDAPATAN
        { wch: 18 }, // RATA-RATA
        { wch: 15 }, // JUMLAH TRANSAKSI
      ];
      ws["!cols"] = colWidths;

      // Style header data utama
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      const headerCells = [
        "A1",
        "B1",
        "C1",
        "D1",
        "E1",
        "F1",
        "G1",
        "H1",
        "I1",
        "J1",
        "K1",
      ];
      headerCells.forEach((cell) => {
        if (!ws[cell]) ws[cell] = {};
        ws[cell].s = headerStyle;
      });

      // Style data rows utama
      for (let row = 2; row <= dataToExport.length + 1; row++) {
        const isEvenRow = row % 2 === 0;
        const rowStyle = {
          fill: { fgColor: { rgb: isEvenRow ? "F8F9FA" : "FFFFFF" } },
          border: {
            top: { style: "thin", color: { rgb: "E5E5E5" } },
            bottom: { style: "thin", color: { rgb: "E5E5E5" } },
            left: { style: "thin", color: { rgb: "E5E5E5" } },
            right: { style: "thin", color: { rgb: "E5E5E5" } },
          },
          alignment: { horizontal: "left", vertical: "center" },
        };

        ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"].forEach(
          (col) => {
            const cellRef = col + row;
            if (!ws[cellRef]) ws[cellRef] = {};
            ws[cellRef].s = rowStyle;
          }
        );

        // Format numeric columns
        const quantityCell = "D" + row;
        const hargaCell = "I" + row;
        const totalCell = "J" + row;
        const keteranganCell = "K" + row;

        if (ws[quantityCell]) {
          ws[quantityCell].s = { ...rowStyle, numFmt: "#,##0" };
        }

        if (ws[hargaCell]) {
          ws[hargaCell].s = { ...rowStyle, numFmt: "#,##0" };
        }

        if (ws[totalCell]) {
          ws[totalCell].s = {
            ...rowStyle,
            numFmt: "#,##0",
            font: { bold: true, color: { rgb: "0F5132" } },
          };
        }

        // Format keterangan column - wrap text
        if (ws[keteranganCell]) {
          ws[keteranganCell].s = {
            ...rowStyle,
            alignment: {
              horizontal: "left",
              vertical: "top",
              wrapText: true,
            },
            font: { size: 9 },
          };
        }
      }

      // Calculate totals per sales
      const salesSummary = (() => {
        const acc: Record<string, { quantity: number; revenue: number }> = {};

        // Pisahkan data berdasarkan tipeTransaksi
        const penjualanNormal = dataToExport.filter(
          (item) =>
            !item.tipeTransaksi ||
            item.tipeTransaksi.toUpperCase() === "PENJUALAN"
        );
        const penjualanReturn = dataToExport.filter(
          (item) =>
            item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
        );
        const penjualanBS = dataToExport.filter(
          (item) =>
            item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
        );

        // Process penjualan normal (ditambahkan)
        penjualanNormal.forEach((sale) => {
          const salesName = sale.sales?.namaSales || "Tidak Diketahui";
          const quantity = Number(sale.kuantitas || 1);
          const revenue = quantity * Number(sale.jumlahPenjualan || 0);

          if (!acc[salesName]) {
            acc[salesName] = { quantity: 0, revenue: 0 };
          }

          acc[salesName].quantity += quantity;
          acc[salesName].revenue += revenue;
        });

        // Process return (dikurangkan)
        penjualanReturn.forEach((sale) => {
          const salesName = sale.sales?.namaSales || "Tidak Diketahui";
          const quantity = Number(sale.kuantitas || 1);
          const revenue = quantity * Number(sale.jumlahPenjualan || 0);

          if (!acc[salesName]) {
            acc[salesName] = { quantity: 0, revenue: 0 };
          }

          acc[salesName].quantity -= quantity;
          acc[salesName].revenue -= revenue;
        });

        // Process BS (dikurangkan)
        penjualanBS.forEach((sale) => {
          const salesName = sale.sales?.namaSales || "Tidak Diketahui";
          const quantity = Number(sale.kuantitas || 1);
          const revenue = quantity * Number(sale.jumlahPenjualan || 0);

          if (!acc[salesName]) {
            acc[salesName] = { quantity: 0, revenue: 0 };
          }

          acc[salesName].quantity -= quantity;
          acc[salesName].revenue -= revenue;
        });

        return acc;
      })();

      // Calculate overall totals
      const totalQuantity = (() => {
        // Pisahkan data berdasarkan tipeTransaksi
        const penjualanNormal = dataToExport.filter(
          (item) =>
            !item.tipeTransaksi ||
            item.tipeTransaksi.toUpperCase() === "PENJUALAN"
        );
        const penjualanReturn = dataToExport.filter(
          (item) =>
            item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
        );
        const penjualanBS = dataToExport.filter(
          (item) =>
            item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
        );

        return (
          penjualanNormal.reduce((sum, item) => {
            return sum + Number(item.kuantitas || 1);
          }, 0) -
          penjualanReturn.reduce((sum, item) => {
            return sum + Number(item.kuantitas || 1);
          }, 0) -
          penjualanBS.reduce((sum, item) => {
            return sum + Number(item.kuantitas || 1);
          }, 0)
        );
      })();

      const totalRevenue = (() => {
        // Pisahkan data berdasarkan tipeTransaksi
        const penjualanNormal = dataToExport.filter(
          (item) =>
            !item.tipeTransaksi ||
            item.tipeTransaksi.toUpperCase() === "PENJUALAN"
        );
        const penjualanReturn = dataToExport.filter(
          (item) =>
            item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "RETURN"
        );
        const penjualanBS = dataToExport.filter(
          (item) =>
            item.tipeTransaksi && item.tipeTransaksi.toUpperCase() === "BS"
        );

        return (
          penjualanNormal.reduce((sum, item) => {
            return (
              sum +
              Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0)
            );
          }, 0) -
          penjualanReturn.reduce((sum, item) => {
            return (
              sum +
              Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0)
            );
          }, 0) -
          penjualanBS.reduce((sum, item) => {
            return (
              sum +
              Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0)
            );
          }, 0)
        );
      })();

      // ===== BAGIAN SUMMARY DI SEBELAH KANAN =====

      // Header tabel summary di row 1 (tanpa header ringkasan)
      const summaryHeaderStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2196F3" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "medium", color: { rgb: "000000" } },
          right: { style: "medium", color: { rgb: "000000" } },
        },
      };

      ws["L1"] = { v: "NAMA SALES", s: summaryHeaderStyle };
      ws["M1"] = { v: "KUANTITAS", s: summaryHeaderStyle };
      ws["N1"] = { v: "PENDAPATAN", s: summaryHeaderStyle };
      ws["O1"] = { v: "RATA-RATA", s: summaryHeaderStyle };
      ws["P1"] = { v: "TRANSAKSI", s: summaryHeaderStyle };

      // Data summary mulai dari row 2
      const sortedSalesEntries = Object.entries(salesSummary).sort(
        ([, a], [, b]) => b.revenue - a.revenue
      );

      sortedSalesEntries.forEach(([salesName, data], index) => {
        const row = index + 2; // Mulai dari row 2
        const isEvenRow = index % 2 === 0;
        const salesTransactions = dataToExport.filter(
          (item) => item.sales?.namaSales === salesName
        );
        const avgPerTransaction =
          salesTransactions.length > 0
            ? data.revenue / salesTransactions.length
            : 0;

        const rowStyle = {
          fill: { fgColor: { rgb: isEvenRow ? "E3F2FD" : "FFFFFF" } },
          border: {
            top: { style: "thin", color: { rgb: "90CAF9" } },
            bottom: { style: "thin", color: { rgb: "90CAF9" } },
            left: { style: "thin", color: { rgb: "90CAF9" } },
            right: { style: "thin", color: { rgb: "90CAF9" } },
          },
          alignment: { horizontal: "left", vertical: "center" },
        };

        ws[`K${row}`] = {
          v: `${index + 1}. ${salesName} (${data.quantity} unit)`,
          s: { ...rowStyle, font: { bold: true } },
        };
        ws[`L${row}`] = {
          v: data.quantity,
          s: {
            ...rowStyle,
            numFmt: "#,##0",
            alignment: { horizontal: "center" },
          },
        };
        ws[`M${row}`] = {
          v: data.revenue,
          s: {
            ...rowStyle,
            numFmt: "#,##0",
            font: { bold: true, color: { rgb: "1B5E20" } },
            alignment: { horizontal: "right" },
          },
        };
        ws[`N${row}`] = {
          v: avgPerTransaction,
          s: {
            ...rowStyle,
            numFmt: "#,##0",
            alignment: { horizontal: "right" },
          },
        };
        ws[`O${row}`] = {
          v: salesTransactions.length,
          s: {
            ...rowStyle,
            numFmt: "#,##0",
            alignment: { horizontal: "center" },
          },
        };
      });

      // Grand total di bawah data summary
      const grandTotalRow = sortedSalesEntries.length + 3; // +1 untuk spacing
      const grandTotalStyle = {
        font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "388E3C" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thick", color: { rgb: "000000" } },
          bottom: { style: "thick", color: { rgb: "000000" } },
          left: { style: "thick", color: { rgb: "000000" } },
          right: { style: "thick", color: { rgb: "000000" } },
        },
      };

      ws[`K${grandTotalRow}`] = { v: "🏆 GRAND TOTAL", s: grandTotalStyle };
      ws[`L${grandTotalRow}`] = {
        v: totalQuantity,
        s: { ...grandTotalStyle, numFmt: "#,##0" },
      };
      ws[`M${grandTotalRow}`] = {
        v: totalRevenue,
        s: { ...grandTotalStyle, numFmt: "#,##0" },
      };
      ws[`N${grandTotalRow}`] = {
        v: dataToExport.length > 0 ? totalRevenue / dataToExport.length : 0,
        s: { ...grandTotalStyle, numFmt: "#,##0" },
      };
      ws[`O${grandTotalRow}`] = {
        v: dataToExport.length,
        s: { ...grandTotalStyle, numFmt: "#,##0" },
      };

      // CEK APAKAH DATA DALAM KONDISI TERFILTER - VERSI LEBIH STRICT
      const hasSearchFilter = searchTerm && searchTerm.trim() !== "";
      const hasProductFilter = filterProduct && filterProduct !== "all";
      const hasPeriodFilter =
        selectedPeriodId !== null && selectedPeriodId !== undefined;
      const hasDataReduction = dataToExport.length < salesData.length;

      const isFiltered =
        hasSearchFilter ||
        hasProductFilter ||
        hasPeriodFilter ||
        hasDataReduction;

      console.log("Debug filter check STRICT:");
      console.log(
        "- hasSearchFilter:",
        hasSearchFilter,
        "(searchTerm:",
        searchTerm,
        ")"
      );
      console.log(
        "- hasProductFilter:",
        hasProductFilter,
        "(filterProduct:",
        filterProduct,
        ")"
      );
      console.log(
        "- hasPeriodFilter:",
        hasPeriodFilter,
        "(selectedPeriodId:",
        selectedPeriodId,
        ")"
      );
      console.log(
        "- hasDataReduction:",
        hasDataReduction,
        "(data:",
        dataToExport.length,
        "vs",
        salesData.length,
        ")"
      );
      console.log("- FINAL isFiltered:", isFiltered);

      // TAMPILKAN SUMMARY SALES HANYA JIKA DATA TERFILTER
      if (isFiltered) {
        // ===== BAGIAN SUMMARY DI SEBELAH KANAN (HANYA UNTUK DATA TERFILTER) =====

        // Header tabel summary di row 1
        const summaryHeaderStyle = {
          font: { bold: true, color: { rgb: "2196F3" } },
          fill: { fgColor: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "000000" } },
            right: { style: "medium", color: { rgb: "000000" } },
          },
        };

        ws["L1"] = { v: "NAMA SALES", s: summaryHeaderStyle };
        ws["M1"] = { v: "KUANTITAS", s: summaryHeaderStyle };
        ws["N1"] = { v: "PENDAPATAN", s: summaryHeaderStyle };
        ws["O1"] = { v: "RATA-RATA", s: summaryHeaderStyle };
        ws["P1"] = { v: "TRANSAKSI", s: summaryHeaderStyle };

        // Data summary mulai dari row 2
        const sortedSalesEntries = Object.entries(salesSummary).sort(
          ([, a], [, b]) => b.revenue - a.revenue
        );

        sortedSalesEntries.forEach(([salesName, data], index) => {
          const row = index + 2; // Mulai dari row 2
          const isEvenRow = index % 2 === 0;
          const salesTransactions = dataToExport.filter(
            (item) => item.sales?.namaSales === salesName
          );
          const avgPerTransaction =
            salesTransactions.length > 0
              ? data.revenue / salesTransactions.length
              : 0;

          const rowStyle = {
            fill: { fgColor: { rgb: isEvenRow ? "E3F2FD" : "FFFFFF" } },
            border: {
              top: { style: "thin", color: { rgb: "90CAF9" } },
              bottom: { style: "thin", color: { rgb: "90CAF9" } },
              left: { style: "thin", color: { rgb: "90CAF9" } },
              right: { style: "thin", color: { rgb: "90CAF9" } },
            },
            alignment: { horizontal: "left", vertical: "center" },
          };

          ws[`L${row}`] = {
            v: `${index + 1}. ${salesName} (${data.quantity} unit)`,
            s: { ...rowStyle, font: { bold: true } },
          };
          ws[`M${row}`] = {
            v: data.quantity,
            s: {
              ...rowStyle,
              numFmt: "#,##0",
              alignment: { horizontal: "center" },
            },
          };
          ws[`N${row}`] = {
            v: data.revenue,
            s: {
              ...rowStyle,
              numFmt: "#,##0",
              font: { bold: true, color: { rgb: "1B5E20" } },
              alignment: { horizontal: "right" },
            },
          };
          ws[`O${row}`] = {
            v: avgPerTransaction,
            s: {
              ...rowStyle,
              numFmt: "#,##0",
              alignment: { horizontal: "right" },
            },
          };
          ws[`P${row}`] = {
            v: salesTransactions.length,
            s: {
              ...rowStyle,
              numFmt: "#,##0",
              alignment: { horizontal: "center" },
            },
          };
        });

        // Grand total di bawah data summary
        const grandTotalRow = sortedSalesEntries.length + 3; // +1 untuk spacing
        const grandTotalStyle = {
          font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "388E3C" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thick", color: { rgb: "000000" } },
            bottom: { style: "thick", color: { rgb: "000000" } },
            left: { style: "thick", color: { rgb: "000000" } },
            right: { style: "thick", color: { rgb: "000000" } },
          },
        };

        ws[`L${grandTotalRow}`] = { v: "🏆 GRAND TOTAL", s: grandTotalStyle };
        ws[`M${grandTotalRow}`] = {
          v: totalQuantity,
          s: { ...grandTotalStyle, numFmt: "#,##0" },
        };
        ws[`N${grandTotalRow}`] = {
          v: totalRevenue,
          s: { ...grandTotalStyle, numFmt: "#,##0" },
        };
        ws[`O${grandTotalRow}`] = {
          v: dataToExport.length > 0 ? totalRevenue / dataToExport.length : 0,
          s: { ...grandTotalStyle, numFmt: "#,##0" },
        };
        ws[`P${grandTotalRow}`] = {
          v: dataToExport.length,
          s: { ...grandTotalStyle, numFmt: "#,##0" },
        };

        // Informasi tambahan di bawah grand total
        const infoStartRow = grandTotalRow + 2;

        // Top performer
        const topSales = sortedSalesEntries[0];
        const avgRevenuePerSales =
          Object.keys(salesSummary).length > 0
            ? totalRevenue / Object.keys(salesSummary).length
            : 0;

        // Header informasi statistik
        ws[`K${infoStartRow}`] = {
          v: "📊 INFORMASI STATISTIK",
          s: {
            font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "FF9800" } },
            alignment: { horizontal: "center" },
            border: {
              top: { style: "medium", color: { rgb: "000000" } },
              bottom: { style: "medium", color: { rgb: "000000" } },
              left: { style: "medium", color: { rgb: "000000" } },
              right: { style: "medium", color: { rgb: "000000" } },
            },
          },
        };

        // Merge header info L:P
        if (!ws["!merges"]) ws["!merges"] = [];
        ws["!merges"].push({
          s: { c: 11, r: infoStartRow - 1 },
          e: { c: 15, r: infoStartRow - 1 },
        });

        // Apply style to merged info header
        ["M", "N", "O", "P"].forEach((col) => {
          ws[`${col}${infoStartRow}`] = {
            v: "",
            s: {
              font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "FF9800" } },
              alignment: { horizontal: "center" },
              border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "medium", color: { rgb: "000000" } },
                right: { style: "medium", color: { rgb: "000000" } },
              },
            },
          };
        });

        // Detail informasi
        const currentInfoRow = infoStartRow + 1;
        const infoStyle = {
          font: { size: 10 },
          alignment: { horizontal: "left" },
        };

        ws[`L${currentInfoRow}`] = {
          v: `🏅 Sales Terbaik: ${topSales ? topSales[0] : "N/A"}`,
          s: { ...infoStyle, font: { bold: true } },
        };
        ws[`L${currentInfoRow + 1}`] = {
          v: `💰 Pendapatan Tertinggi: ${
            topSales ? topSales[1].revenue.toLocaleString("id-ID") : "N/A"
          }`,
          s: { ...infoStyle, font: { bold: true } },
        };
        ws[`L${currentInfoRow + 2}`] = {
          v: `📈 Rata-rata per Sales: ${avgRevenuePerSales.toLocaleString(
            "id-ID"
          )}`,
          s: infoStyle,
        };
        ws[`L${currentInfoRow + 3}`] = {
          v: `👥 Total Sales: ${Object.keys(salesSummary).length} orang`,
          s: infoStyle,
        };
        ws[`L${currentInfoRow + 4}`] = {
          v: `📅 Periode: ${selectedPeriodName}`,
          s: infoStyle,
        };
        ws[`L${currentInfoRow + 5}`] = {
          v: `🏷️ Produk: ${selectedProductName}`,
          s: infoStyle,
        };
        ws[`L${currentInfoRow + 6}`] = {
          v: `🔍 Pencarian: ${searchTerm || "Tidak ada"}`,
          s: infoStyle,
        };
        ws[`L${currentInfoRow + 7}`] = {
          v: `📊 Data Asli: ${salesData.length} transaksi`,
          s: infoStyle,
        };
        ws[`L${currentInfoRow + 8}`] = {
          v: `📋 Data Filter: ${dataToExport.length} transaksi`,
          s: infoStyle,
        };
        ws[`L${currentInfoRow + 9}`] = {
          v: `📅 Export: ${new Date().toLocaleDateString("id-ID")}`,
          s: infoStyle,
        };

        console.log(
          "Data terfilter - menampilkan summary sales + statistik lengkap"
        );
      } else {
        console.log("Data semua - hanya menampilkan tabel transaksi");
      }

      XLSX.utils.book_append_sheet(wb, ws, "Data Penjualan");

      // Generate filename dengan info filter
      const periodeName = selectedPeriodName.replace(/[^a-zA-Z0-9]/g, "");
      const productName = selectedProductName.replace(/[^a-zA-Z0-9]/g, "");
      const searchInfo = searchTerm
        ? `_Pencarian-${searchTerm.replace(/[^a-zA-Z0-9]/g, "")}`
        : "";

      const filename = `Data_Penjualan_${periodeName}_${productName}${searchInfo}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      XLSX.writeFile(wb, filename);

      sweetAlert.close();
      sweetAlert.toast.success(`File Excel berhasil diexport: ${filename}`);
    } catch (error) {
      sweetAlert.close();
      sweetAlert.error(
        "Gagal Export",
        "Terjadi kesalahan saat mengexport data ke Excel."
      );
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <PageLoader text="Memuat daftar penjualan..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button onClick={loadData} className="mt-2 btn-primary">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-all duration-150 ${
            activeTab === "penjualan"
              ? "border-blue-600 text-blue-700 bg-white shadow"
              : "border-transparent text-gray-500 bg-gray-100 hover:bg-white"
          }`}
          onClick={() => setActiveTab("penjualan")}
        >
          Penjualan
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 transition-all duration-150 ${
            activeTab === "return"
              ? "border-blue-600 text-blue-700 bg-white shadow"
              : "border-transparent text-gray-500 bg-gray-100 hover:bg-white"
          }`}
          onClick={() => setActiveTab("return")}
        >
          Return / BS
        </button>
      </div>

      {/* Tombol Export Excel dan Tambah Penjualan */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daftar Penjualan</h1>
          <p className="text-gray-600 mt-2">
            Kelola semua data penjualan Anda ({filteredData.length} dari{" "}
            {salesData.length} total)
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            onClick={exportToExcel}
            disabled={exporting || filteredData.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            title={
              filterMode === "periode"
                ? "Export data sesuai filter periode yang tampil di tabel"
                : "Export data sesuai filter tanggal yang tampil di tabel"
            }
          >
            {exporting ? (
              <>
                <LoadingSpinner size="sm" color="gray" />
                Mengexport...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Excel ({filteredData.length})
                <span className="ml-1 text-xs font-normal bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {filterMode === "periode" ? "Periode" : "Tanggal"}
                </span>
              </>
            )}
          </Button>
          <Link href="/sales/add">
            <Button className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Penjualan
            </Button>
          </Link>
        </div>
      </div>
      {/* Tab Pilihan Filter */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-t-md border-b-2 font-semibold transition-colors duration-150 ${
            filterMode === "periode"
              ? "border-blue-600 text-blue-700 bg-white"
              : "border-transparent text-gray-500 bg-gray-100"
          }`}
          onClick={() => setFilterMode("periode")}
        >
          Periode
        </button>
        <button
          className={`px-4 py-2 rounded-t-md border-b-2 font-semibold transition-colors duration-150 ${
            filterMode === "tanggal"
              ? "border-blue-600 text-blue-700 bg-white"
              : "border-transparent text-gray-500 bg-gray-100"
          }`}
          onClick={() => setFilterMode("tanggal")}
        >
          Tanggal
        </button>
      </div>
      {/* Filter Periode atau Tanggal */}
      {filterMode === "periode" && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-800">
                Filter Data Berdasarkan Periode
              </h3>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-slate-700">
                  Pilih Periode:
                </label>
                <select
                  value={selectedPeriodId || ""}
                  onChange={(e) => {
                    setSelectedPeriodId(
                      e.target.value === "" ? null : Number(e.target.value)
                    );
                    setCurrentPage(1); // Reset ke halaman pertama saat filter berubah
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                >
                  <option value="">📊 Semua Periode</option>
                  {periodeList.map((periode, index) => (
                    <option key={periode.id} value={periode.id}>
                      {periode.namaPeriode}
                      {index === 0 && " 🆕"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span>Data Ditampilkan:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-medium">
                {filteredData.length} dari {salesData.length}
              </span>
              {selectedPeriodId ? (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg font-medium">
                  {periodeList.find((p) => p.id === selectedPeriodId)
                    ?.namaPeriode || "Periode"}
                  {selectedPeriodId === periodeList[0]?.id && " 🆕"}
                </span>
              ) : (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg font-medium">
                  � Semua Periode
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {filterMode === "tanggal" && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Tanggal Mulai:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Tanggal Akhir:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <Button
              onClick={async () => {
                setDateLoading(true);
                try {
                  const data = await apiService.getPenjualanByDateRange(
                    startDate,
                    endDate
                  );
                  setSalesData(data);
                  setCurrentPage(1);
                } catch (err) {
                  sweetAlert.error("Gagal mengambil data berdasarkan tanggal");
                } finally {
                  setDateLoading(false);
                }
              }}
              disabled={!startDate || !endDate || dateLoading}
              className="btn-success"
            >
              {dateLoading ? "Memproses..." : "Ambil Data"}
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Cari sales, produk, atau jalur..."
              className="pl-10 input-field"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset ke halaman pertama saat search berubah
              }}
            />
          </div>

          <Select
            value={filterProduct}
            onValueChange={(value) => {
              setFilterProduct(value);
              setCurrentPage(1); // Reset ke halaman pertama saat filter berubah
            }}
          >
            <SelectTrigger className="input-field bg-white text-black border border-gray-300">
              <SelectValue placeholder="Filter berdasarkan produk" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 shadow-lg">
              <SelectItem
                value="all"
                className="bg-white text-black hover:bg-gray-100"
              >
                Semua Produk
              </SelectItem>
              {produkList.map((produk) => (
                <SelectItem
                  key={produk.id}
                  value={produk.id.toString()}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  {produk.namaProduk}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-success flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <LoadingSpinner size="sm" color="green" />
                Memuat...
              </>
            ) : (
              <>
                <Filter className="h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {refreshing ? (
          <TableSkeleton rows={10} columns={9} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kuantitas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jalur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hari
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Minggu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Penjualan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keterangan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((sale) => (
                  <tr key={sale.id} className="table-row hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-xs font-medium">
                          {sale.periode?.namaPeriode || "-"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {sale.tanggalTransaksi
                            ? new Date(
                                sale.tanggalTransaksi
                              ).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.sales?.namaSales || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.produk?.namaProduk || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          📦 {sale.kuantitas || "1"} unit
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.jalur?.namaJalur || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.hari?.namaHari || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          sale.minggu?.namaMinggu === "I"
                            ? "bg-green-100 text-green-800"
                            : sale.minggu?.namaMinggu === "II"
                            ? "bg-blue-100 text-blue-800"
                            : sale.minggu?.namaMinggu === "III"
                            ? "bg-yellow-100 text-yellow-800"
                            : sale.minggu?.namaMinggu === "IV"
                            ? "bg-orange-100 text-orange-800"
                            : sale.minggu?.namaMinggu === "V"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        Minggu {sale.minggu?.namaMinggu || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>
                        <div className="text-blue-600 font-semibold">
                          Harga per unit:{" "}
                          {sale.jumlahPenjualan?.toLocaleString("id-ID") || "0"}
                        </div>
                        <div className="text-green-600 font-bold text-lg">
                          Total:{" "}
                          {(
                            Number(sale.kuantitas || 1) *
                            Number(sale.jumlahPenjualan || 0)
                          ).toLocaleString("id-ID")}
                        </div>
                        {sale.kuantitas &&
                          sale.jumlahPenjualan &&
                          Number(sale.kuantitas) > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {Number(sale.kuantitas)} ×{" "}
                              {Number(sale.jumlahPenjualan).toLocaleString(
                                "id-ID"
                              )}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.keterangan ? (
                        <div className="max-w-xs">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                            <p className="text-xs text-yellow-800 line-clamp-2">
                              {sale.keterangan}
                            </p>
                            {sale.keterangan.length > 100 && (
                              <button
                                onClick={() => {
                                  sweetAlert.info(
                                    "Keterangan Lengkap",
                                    sale.keterangan
                                  );
                                }}
                                className="text-xs text-yellow-600 hover:text-yellow-800 mt-1 underline"
                              >
                                Lihat selengkapnya
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={
                            // Jika return/BS, arahkan ke edit return/BS
                            sale.tipeTransaksi &&
                            sale.tipeTransaksi !== "" &&
                            sale.tipeTransaksi.toUpperCase() !== "PENJUALAN"
                              ? `/sales/return/edit/${sale.id}`
                              : `/sales/edit/${sale.id}`
                          }
                        >
                          <button
                            className="text-blue-500 hover:text-blue-700"
                            title={
                              sale.tipeTransaksi &&
                              sale.tipeTransaksi !== "" &&
                              sale.tipeTransaksi.toUpperCase() !== "PENJUALAN"
                                ? `Edit ${sale.tipeTransaksi}`
                                : "Edit Penjualan"
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </Button>
            <Button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(startIndex + itemsPerPage, filteredData.length)}
                </span>{" "}
                of <span className="font-medium">{filteredData.length}</span>{" "}
                results
                {selectedPeriodId && (
                  <span className="text-blue-600 font-medium">
                    {" "}
                    (filtered by{" "}
                    {
                      periodeList.find((p) => p.id === selectedPeriodId)
                        ?.namaPeriode
                    }
                    )
                  </span>
                )}
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                {/* Previous Button */}
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* PERBAIKAN: Dynamic pagination numbers */}
                {(() => {
                  const maxVisiblePages = 5;
                  let startPage = 1;
                  let endPage = totalPages;

                  if (totalPages > maxVisiblePages) {
                    const half = Math.floor(maxVisiblePages / 2);

                    if (currentPage <= half) {
                      // Awal: tampilkan 1,2,3,4,5
                      startPage = 1;
                      endPage = maxVisiblePages;
                    } else if (currentPage >= totalPages - half) {
                      // Akhir: tampilkan ..., n-4, n-3, n-2, n-1, n
                      startPage = totalPages - maxVisiblePages + 1;
                      endPage = totalPages;
                    } else {
                      // Tengah: tampilkan current-2, current-1, current, current+1, current+2
                      startPage = currentPage - half;
                      endPage = currentPage + half;
                    }
                  }

                  const pages = [];

                  // First page + ellipsis jika perlu
                  if (startPage > 1) {
                    pages.push(
                      <Button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        1
                      </Button>
                    );

                    if (startPage > 2) {
                      pages.push(
                        <span
                          key="ellipsis-start"
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                  }

                  // Visible page numbers
                  for (let page = startPage; page <= endPage; page++) {
                    if (page === 1 && startPage > 1) continue; // Skip if already added
                    if (page === totalPages && endPage < totalPages) continue; // Skip if will be added later

                    pages.push(
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  }

                  // Ellipsis + last page jika perlu
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span
                          key="ellipsis-end"
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }

                    pages.push(
                      <Button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        {totalPages}
                      </Button>
                    );
                  }

                  return pages;
                })()}

                {/* Next Button */}
                <Button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* NEKO AI Chat */}
      <NekoAiChat dashboardData={prepareSalesListDataForAI()} />
    </div>
  );
}
