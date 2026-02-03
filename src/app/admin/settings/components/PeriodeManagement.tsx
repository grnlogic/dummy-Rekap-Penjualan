"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  Save,
  X,
  Clock,
  CalendarDays,
} from "lucide-react";
import {
  apiService,
  PeriodeData,
  MingguData,
  HariData,
} from "@/app/services/api"; // Import API service dan interfaces

export default function PeriodeManagement() {
  const [activeTab, setActiveTab] = useState("periode");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  // State untuk Periode
  const [periodeList, setPeriodeList] = useState<PeriodeData[]>([]);
  const [editingPeriode, setEditingPeriode] = useState<PeriodeData | null>(
    null
  );

  // State untuk Minggu
  const [mingguList, setMingguList] = useState<MingguData[]>([]);
  const [editingMinggu, setEditingMinggu] = useState<MingguData | null>(null);

  // State untuk Hari
  const [hariList, setHariList] = useState<HariData[]>([]);
  const [editingHari, setEditingHari] = useState<HariData | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
  });

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPeriode(), fetchMinggu(), fetchHari()]);
    } catch (error) {
      // Error handling without console output
    } finally {
      setLoading(false);
    }
  };

  // Fetch periode data
  const fetchPeriode = async () => {
    try {
      const data = await apiService.getAllPeriode();

      // Remove duplicates berdasarkan namaPeriode
      const uniquePeriode = data.filter(
        (periode, index, self) =>
          index === self.findIndex((p) => p.namaPeriode === periode.namaPeriode)
      );

      setPeriodeList(uniquePeriode);
    } catch (error) {
      setPeriodeList([]);
    }
  };

  // Fetch minggu data
  const fetchMinggu = async () => {
    try {
      const data = await apiService.getAllMinggu();

      // Remove duplicates berdasarkan namaMinggu
      const uniqueMinggu = data.filter(
        (minggu, index, self) =>
          index === self.findIndex((m) => m.namaMinggu === minggu.namaMinggu)
      );

      setMingguList(uniqueMinggu);
    } catch (error) {
      setMingguList([]);
    }
  };

  // Fetch hari data
  const fetchHari = async () => {
    try {
      const data = await apiService.getAllHari();

      // Remove duplicates berdasarkan namaHari
      const uniqueHari = data.filter(
        (hari, index, self) =>
          index === self.findIndex((h) => h.namaHari === hari.namaHari)
      );

      setHariList(uniqueHari);
    } catch (error) {
      setHariList([]);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validasi input kosong
      if (!formData.nama.trim()) {
        alert("Nama tidak boleh kosong!");
        setLoading(false);
        return;
      }

      if (activeTab === "periode") {
        if (editingPeriode) {
          await apiService.updatePeriode(editingPeriode.id, {
            namaPeriode: formData.nama.trim(),
          });
        } else {
          await apiService.createPeriode({
            namaPeriode: formData.nama.trim(),
          });
        }
        await fetchPeriode();
      } else if (activeTab === "minggu") {
        if (editingMinggu) {
          await apiService.updateMinggu(editingMinggu.id, {
            namaMinggu: formData.nama.trim(),
          });
        } else {
          await apiService.createMinggu({
            namaMinggu: formData.nama.trim(),
          });
        }
        await fetchMinggu();
      } else if (activeTab === "hari") {
        if (editingHari) {
          await apiService.updateHari(editingHari.id, {
            namaHari: formData.nama.trim(),
          });
        } else {
          await apiService.createHari({
            namaHari: formData.nama.trim(),
          });
        }
        await fetchHari();
      }

      handleCancel();
      alert(
        `${activeTab} berhasil ${
          editingPeriode || editingMinggu || editingHari
            ? "diupdate"
            : "ditambahkan"
        }!`
      );
    } catch (error: any) {
      alert(
        "Terjadi kesalahan saat menyimpan data: " +
          (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus ${activeTab} "${nama}"?`)) return;

    try {
      if (activeTab === "periode") {
        await apiService.deletePeriode(id);
        await fetchPeriode();
      } else if (activeTab === "minggu") {
        await apiService.deleteMinggu(id);
        await fetchMinggu();
      } else if (activeTab === "hari") {
        await apiService.deleteHari(id);
        await fetchHari();
      }

      alert(`${activeTab} berhasil dihapus!`);
    } catch (error) {
      alert(`Gagal menghapus ${activeTab}`);
    }
  };

  // Handle edit
  const handleEdit = (item: any) => {
    if (activeTab === "periode") {
      setEditingPeriode(item);
      setFormData({
        nama: item.namaPeriode || "",
      });
    } else if (activeTab === "minggu") {
      setEditingMinggu(item);
      setFormData({
        nama: item.namaMinggu || "",
      });
    } else if (activeTab === "hari") {
      setEditingHari(item);
      setFormData({
        nama: item.namaHari || "",
      });
    }
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingPeriode(null);
    setEditingMinggu(null);
    setEditingHari(null);
    setFormData({
      nama: "",
    });
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case "periode":
        return periodeList.filter((item) =>
          item.namaPeriode?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      case "minggu":
        return mingguList.filter((item) =>
          item.namaMinggu?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      case "hari":
        return hariList.filter((item) =>
          item.namaHari?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      default:
        return [];
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Calendar className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Kelola Periode & Waktu
            </h2>
            <p className="text-sm text-gray-600">
              Atur periode, minggu, dan hari
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah {activeTab}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {["periode", "minggu", "hari"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Cari ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingPeriode || editingMinggu || editingHari
                    ? `Edit ${activeTab}`
                    : `Tambah ${activeTab} Baru`}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama {activeTab} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) =>
                      setFormData({ ...formData, nama: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={`Masukkan nama ${activeTab}`}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? "Menyimpan..." : "Simpan"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Data List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : currentData.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchTerm
                ? `Tidak ada ${activeTab} yang ditemukan`
                : `Belum ada data ${activeTab}`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <CalendarDays className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {activeTab === "periode"
                              ? item.namaPeriode
                              : activeTab === "minggu"
                              ? item.namaMinggu
                              : item.namaHari}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              item.id,
                              activeTab === "periode"
                                ? item.namaPeriode
                                : activeTab === "minggu"
                                ? item.namaMinggu
                                : item.namaHari
                            )
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
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
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        Total: {currentData.length} {activeTab}
        {searchTerm && ` (filtered)`}
      </div>
    </div>
  );
}
