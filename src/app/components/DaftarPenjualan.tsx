"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  Download,
  AlertTriangle,
  Database,
  FileText,
  Shield,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { sweetAlert } from "@/app/utils/sweetAlert";
import { apiService, PenjualanData } from "@/app/services/api";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

export default function DaftarPenjualan() {
  const [penjualanData, setPenjualanData] = useState<PenjualanData[]>([]);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    // Load initial data
    loadPenjualanData();
  }, []);

  const loadPenjualanData = async () => {
    try {
      const data = await apiService.getAllPenjualan();

      // Sort by periode: extract year and month, then sort properly
      const sortedData = data.sort((a, b) => {
        const periodeA = a.periode?.nama_periode || "";
        const periodeB = b.periode?.nama_periode || "";

        // Parse periode format: "BULAN TAHUN" or "Bulan Tahun"
        const parseMonthYear = (periode: string) => {
          const parts = periode.trim().split(" ");
          if (parts.length < 2) return { year: 0, month: 0 };

          const year = parseInt(parts[1]) || 0;
          const monthName = parts[0].toLowerCase();

          const monthMap: { [key: string]: number } = {
            januari: 1,
            februari: 2,
            maret: 3,
            april: 4,
            mei: 5,
            juni: 6,
            juli: 7,
            agustus: 8,
            september: 9,
            oktober: 10,
            november: 11,
            desember: 12,
          };

          return { year, month: monthMap[monthName] || 0 };
        };

        const dateA = parseMonthYear(periodeA);
        const dateB = parseMonthYear(periodeB);

        // Sort by year descending, then month descending
        if (dateB.year !== dateA.year) {
          return dateB.year - dateA.year;
        }
        return dateB.month - dateA.month;
      });

      setPenjualanData(sortedData);
    } catch (error) {
      // Error handling without console output
    }
  };

  const handleBackupData = async () => {
    try {
      setBackupLoading(true);
      sweetAlert.toast.info("Memulai backup data...");

      const blob = await apiService.exportAllPenjualan();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-penjualan-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      sweetAlert.toast.success("Backup data berhasil diunduh!");
    } catch (error) {
      sweetAlert.toast.error("Gagal membuat backup data");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    // First confirmation - Backup warning
    const backupWarning = await sweetAlert.confirm(
      "⚠️ Peringatan Penting!",
      `🚨 Anda akan menghapus SEMUA data penjualan!\n\n📋 Sangat disarankan untuk:\n• Buat backup terlebih dahulu\n• Pastikan data sudah tidak diperlukan\n• Koordinasi dengan tim terkait\n\nApakah Anda sudah membuat backup data?`
    );

    if (!backupWarning.isConfirmed) {
      // Offer to create backup
      const offerBackup = await sweetAlert.confirm(
        "Buat Backup Sekarang?",
        "Kami dapat membantu Anda membuat backup data sebelum menghapus."
      );

      if (offerBackup.isConfirmed) {
        await handleBackupData();
        return; // Stop here, let user manually continue after backup
      }
      return; // User cancelled
    }

    // Second confirmation - Final warning
    const finalConfirmation = await sweetAlert.confirm(
      "🔥 KONFIRMASI AKHIR",
      "PERHATIAN!\n\nTindakan ini akan:\n❌ Menghapus SEMUA data penjualan\n❌ Tidak dapat dikembalikan\n❌ Mempengaruhi laporan dan analitik\n\nApakah Anda yakin ingin melanjutkan?"
    );

    if (finalConfirmation.isConfirmed) {
      try {
        setDeleteAllLoading(true);
        sweetAlert.toast.info("Menghapus semua data penjualan...");

        const result = await apiService.deleteAllPenjualan();

        sweetAlert.toast.success(
          `Berhasil menghapus ${result.deletedCount || 0} data penjualan`
        );

        // Reload data
        await loadPenjualanData();

        // Show completion message
        await sweetAlert.success(
          "✅ Selesai!",
          `Semua data penjualan telah dihapus. Total: ${
            result.deletedCount || 0
          } records.`
        );
      } catch (error) {
        sweetAlert.toast.error("Gagal menghapus semua data");
      } finally {
        setDeleteAllLoading(false);
      }
    }
  };

  const handleEdit = (item: PenjualanData) => {
    // Add your edit logic here
  };

  const handleDelete = async (id: number) => {
    try {
      const confirmed = await sweetAlert.confirm(
        "Hapus Data Penjualan",
        "Apakah Anda yakin ingin menghapus data ini?"
      );

      if (confirmed.isConfirmed) {
        await apiService.deletePenjualan(id);
        sweetAlert.toast.success("Data berhasil dihapus");
        await loadPenjualanData();
      }
    } catch (error) {
      sweetAlert.toast.error("Gagal menghapus data");
    }
  };

  return (
    <div className="p-6">
      {/* Header dengan tombol aksi */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Penjualan</h1>
          <p className="text-gray-600 mt-1">Kelola data penjualan PERUSAHAAN</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Backup Button */}
          <Button
            onClick={handleBackupData}
            disabled={backupLoading}
            className="btn-secondary flex items-center gap-2"
          >
            {backupLoading ? (
              <>
                <LoadingSpinner size="sm" color="gray" />
                Backup...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Backup Data
              </>
            )}
          </Button>

          {/* Danger Zone Dropdown */}
          <div className="relative group">
            <Button
              disabled={deleteAllLoading}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              {deleteAllLoading ? (
                <>
                  <LoadingSpinner size="sm" color="gray" />
                  Menghapus...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </>
              )}
            </Button>

            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-red-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <div className="px-4 py-2 text-xs text-red-600 font-semibold border-b border-red-100">
                  ⚠️ TINDAKAN BERBAHAYA
                </div>
                <button
                  onClick={handleDeleteAllData}
                  disabled={deleteAllLoading}
                  className="w-full text-left px-4 py-3 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="font-medium">Hapus Semua Data</div>
                    <div className="text-xs text-red-500">
                      Tidak dapat dikembalikan
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-yellow-800 font-semibold">Tips Keamanan Data</h3>
          <p className="text-yellow-700 text-sm mt-1">
            Selalu buat backup data secara berkala. Gunakan tombol "Backup Data"
            untuk mengunduh semua data dalam format JSON.
          </p>
        </div>
      </div>

      {/* Table and content for displaying sales data */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Produk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jumlah
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Satuan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Harga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {penjualanData.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(item.tanggal).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.nama_produk}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.jumlah}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.harga_satuan.toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.total_harga.toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(item)}
                      className="btn-primary"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      className="btn-danger"
                    >
                      Hapus
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
