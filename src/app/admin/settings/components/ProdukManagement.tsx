"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Save,
  X,
  Tag,
  DollarSign,
  Settings,
} from "lucide-react";
import { apiService, ProdukData, ProdukHargaData } from "@/app/services/api"; // Import API service

export default function ProdukManagement() {
  const [produkList, setProdukList] = useState<ProdukData[]>([]);
  const [produkHargaList, setProdukHargaList] = useState<ProdukHargaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduk, setEditingProduk] = useState<ProdukData | null>(null);
  const [formData, setFormData] = useState({
    namaProduk: "",
  });

  // Fetch produk data menggunakan apiService
  const fetchProduk = async () => {
    try {
      setLoading(true);
      const [produkData, hargaData] = await Promise.all([
        apiService.getAllProduk(),
        apiService.getAllProdukHarga(),
      ]);

      // Remove duplicates berdasarkan namaProduk
      const uniqueProduk = produkData.filter(
        (produk, index, self) =>
          index === self.findIndex((p) => p.namaProduk === produk.namaProduk)
      );

      setProdukList(uniqueProduk);
      setProdukHargaList(hargaData);
    } catch (error) {
      setProdukList([]);
      setProdukHargaList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduk();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validasi input kosong
      if (!formData.namaProduk.trim()) {
        alert("Nama produk tidak boleh kosong!");
        setLoading(false);
        return;
      }

      if (editingProduk) {
        // Update produk
        console.log("[ProdukManagement] Update produk:", {
          id: editingProduk.id,
          namaProduk: formData.namaProduk.trim(),
        });
        const response = await apiService.updateProduk(editingProduk.id, {
          namaProduk: formData.namaProduk.trim(),
        });
        console.log("[ProdukManagement] Response update:", response);
      } else {
        // Create new produk
        console.log("[ProdukManagement] Create produk:", {
          namaProduk: formData.namaProduk.trim(),
        });
        const response = await apiService.createProduk({
          namaProduk: formData.namaProduk.trim(),
        });
        console.log("[ProdukManagement] Response create:", response);
      }

      await fetchProduk(); // Refresh data
      handleCancel();
      alert(
        editingProduk
          ? "Produk berhasil diupdate!"
          : "Produk berhasil ditambahkan!"
      );
    } catch (error: any) {
      // Handle specific error messages
      if (error.message && error.message.includes("sudah ada")) {
        alert("Produk dengan nama tersebut sudah ada! Gunakan nama lain.");
      } else if (error.status === 409) {
        alert("Data duplikat! Produk dengan nama tersebut sudah ada.");
      } else {
        alert(
          "Terjadi kesalahan saat menyimpan data: " +
            (error.message || "Unknown error")
        );
      }
      console.error("[ProdukManagement] Error submit:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus produk "${nama}"?`)) return;

    try {
      await apiService.deleteProduk(id);
      await fetchProduk(); // Refresh data
      alert("Produk berhasil dihapus!");
    } catch (error) {
      alert("Gagal menghapus produk");
    }
  };

  // Handle edit
  const handleEdit = (produk: ProdukData) => {
    setEditingProduk(produk);
    setFormData({
      namaProduk: produk.namaProduk || "",
    });
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingProduk(null);
    setFormData({
      namaProduk: "",
    });
  };

  // Handle manage harga
  const handleManageHarga = (produk: ProdukData) => {
    // TODO: Implement harga management modal
    alert(
      `Kelola harga untuk produk: ${produk.namaProduk}\n\nFitur ini akan segera tersedia!`
    );
  };

  // Helper functions untuk harga
  const getProdukHarga = (produkId: number): ProdukHargaData[] => {
    return produkHargaList.filter((harga) => harga.produkId === produkId);
  };

  const getStandarHarga = (produkId: number): string => {
    const hargaData = produkHargaList.find(
      (harga) => harga.produkId === produkId && harga.tipeHarga === "STANDAR"
    );
    return hargaData ? hargaData.hargaFormatted : "Belum diatur";
  };

  const getHargaCount = (produkId: number): number => {
    return produkHargaList.filter((harga) => harga.produkId === produkId)
      .length;
  };

  // Filter produk based on search
  const filteredProduk = produkList.filter((produk) =>
    produk.namaProduk?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Kelola Produk & Harga
            </h2>
            <p className="text-sm text-gray-600">
              Tambah, edit, atau hapus data produk dan kelola harga
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  {editingProduk ? "Edit Produk" : "Tambah Produk Baru"}
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
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaProduk}
                    onChange={(e) =>
                      setFormData({ ...formData, namaProduk: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Masukkan nama produk"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
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

      {/* Produk List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : filteredProduk.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchTerm
                ? "Tidak ada produk yang ditemukan"
                : "Belum ada data produk"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga Standar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe Harga
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
                {filteredProduk.map((produk) => (
                  <tr key={produk.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {produk.namaProduk}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{produk.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getStandarHarga(produk.id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getProdukHarga(produk.id).length === 0 ? (
                          <span className="text-gray-500 italic">
                            Belum ada harga
                          </span>
                        ) : (
                          getProdukHarga(produk.id).map((harga) => (
                            <span
                              key={harga.tipeHarga}
                              className="text-sm flex items-center gap-2"
                            >
                              <span>
                                {harga.tipeHargaDescription}:{" "}
                                <b>{harga.hargaFormatted}</b>
                              </span>
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleManageHarga(produk)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Kelola Harga"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(produk.id, produk.namaProduk)
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
        <div className="flex items-center justify-between">
          <div>
            Total: {filteredProduk.length} produk
            {searchTerm && ` (filtered from ${produkList.length})`}
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-100 rounded-full"></span>
              <span>Harga Standar</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-blue-100 rounded-full"></span>
              <span>Harga Sales</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-purple-100 rounded-full"></span>
              <span>Harga Motoris</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-orange-100 rounded-full"></span>
              <span>Harga Pasar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
