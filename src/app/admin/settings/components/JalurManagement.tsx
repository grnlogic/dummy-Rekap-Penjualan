"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Route,
  Save,
  X,
  MapPin,
  Truck,
} from "lucide-react";
import { apiService, JalurData } from "@/app/services/api"; // Import API service dan interface

export default function JalurManagement() {
  const [jalurList, setJalurList] = useState<JalurData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJalur, setEditingJalur] = useState<JalurData | null>(null);
  const [formData, setFormData] = useState({
    namaJalur: "",
  });

  // Fetch jalur data menggunakan apiService
  const fetchJalur = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllJalur(); // Gunakan API service

      // Remove duplicates berdasarkan namaJalur
      const uniqueJalur = data.filter(
        (jalur, index, self) =>
          index === self.findIndex((j) => j.namaJalur === jalur.namaJalur)
      );

      setJalurList(uniqueJalur);
    } catch (error) {
      setJalurList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJalur();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validasi input kosong
      if (!formData.namaJalur.trim()) {
        alert("Nama jalur tidak boleh kosong!");
        setLoading(false);
        return;
      }

      if (editingJalur) {
        // Update jalur - menggunakan API yang benar
        await apiService.updateJalur(editingJalur.id, {
          namaJalur: formData.namaJalur.trim(),
        });
      } else {
        // Create new jalur - menggunakan API yang benar
        await apiService.createJalur({
          namaJalur: formData.namaJalur.trim(),
        });
      }

      await fetchJalur(); // Refresh data
      handleCancel();
      alert(
        editingJalur
          ? "Jalur berhasil diupdate!"
          : "Jalur berhasil ditambahkan!"
      );
    } catch (error: any) {
      // Handle specific error messages
      if (error.message && error.message.includes("sudah ada")) {
        alert("Jalur dengan nama tersebut sudah ada! Gunakan nama lain.");
      } else if (error.status === 409) {
        alert("Data duplikat! Jalur dengan nama tersebut sudah ada.");
      } else {
        alert(
          "Terjadi kesalahan saat menyimpan data: " +
            (error.message || "Unknown error")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus jalur "${nama}"?`)) return;

    try {
      // Menggunakan API jalur yang benar
      await apiService.deleteJalur(id);
      await fetchJalur(); // Refresh data
      alert("Jalur berhasil dihapus!");
    } catch (error) {
      alert("Gagal menghapus jalur");
    }
  };

  // Handle edit
  const handleEdit = (jalur: JalurData) => {
    setEditingJalur(jalur);
    setFormData({
      namaJalur: jalur.namaJalur || "",
    });
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingJalur(null);
    setFormData({
      namaJalur: "",
    });
  };

  // Filter jalur based on search
  const filteredJalur = jalurList.filter((jalur) =>
    jalur.namaJalur?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Route className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Kelola Jalur Distribusi
            </h2>
            <p className="text-sm text-gray-600">
              Tambah, edit, atau hapus jalur distribusi
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Jalur</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari jalur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  {editingJalur ? "Edit Jalur" : "Tambah Jalur Baru"}
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
                    Nama Jalur *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaJalur}
                    onChange={(e) =>
                      setFormData({ ...formData, namaJalur: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Masukkan nama jalur"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
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

      {/* Jalur List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : filteredJalur.length === 0 ? (
          <div className="p-8 text-center">
            <Route className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchTerm
                ? "Tidak ada jalur yang ditemukan"
                : "Belum ada data jalur"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jalur Distribusi
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
                {filteredJalur.map((jalur) => (
                  <tr key={jalur.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Truck className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {jalur.namaJalur}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{jalur.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(jalur)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(jalur.id, jalur.namaJalur)
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
        Total: {filteredJalur.length} jalur
        {searchTerm && ` (filtered from ${jalurList.length})`}
      </div>
    </div>
  );
}
