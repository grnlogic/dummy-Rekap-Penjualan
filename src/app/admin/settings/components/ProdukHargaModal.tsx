import React, { useState } from "react";
import { ProdukData, ProdukHargaData } from "@/app/services/api";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { X, Plus, Save, Trash2, Edit } from "lucide-react";
import { apiService } from "@/app/services/api";

interface ProdukHargaModalProps {
  open: boolean;
  onClose: () => void;
  produk: ProdukData | null;
  hargaList: ProdukHargaData[];
  onRefresh: () => void;
}

const TIPE_HARGA_OPTIONS = [
  { value: "STANDAR", label: "Standar" },
  { value: "SALES", label: "Sales" },
  { value: "MOTORIS", label: "Motoris" },
  { value: "PASAR", label: "Pasar" },
  { value: "LAIN-LAIN", label: "Lain-lain" },
];

export default function ProdukHargaModal({
  open,
  onClose,
  produk,
  hargaList,
  onRefresh,
}: ProdukHargaModalProps) {
  const [form, setForm] = useState({
    tipeHarga: "",
    harga: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open || !produk) return null;

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (harga: ProdukHargaData) => {
    setEditingId(harga.id);
    setForm({ tipeHarga: harga.tipeHarga, harga: harga.harga.toString() });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ tipeHarga: "", harga: "" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus harga ini?")) return;
    setLoading(true);
    try {
      await apiService.deleteProdukHarga(id);
      onRefresh();
    } catch (e) {
      alert("Gagal menghapus harga");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipeHarga || !form.harga) {
      alert("Tipe harga dan nominal wajib diisi!");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        produkId: produk?.id,
        tipeHarga: form.tipeHarga,
        harga: Number(form.harga),
      };
      console.log("[ProdukHargaModal] Payload yang dikirim:", payload);
      if (editingId) {
        await apiService.updateProdukHarga(editingId, payload);
      } else {
        await apiService.createProdukHarga(payload);
      }
      onRefresh();
      handleCancelEdit();
    } catch (e) {
      alert("Gagal menyimpan harga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Kelola Harga - {produk.namaProduk}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {/* Daftar harga */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Daftar Harga</h4>
            {hargaList.length === 0 ? (
              <div className="text-gray-500 italic">Belum ada harga</div>
            ) : (
              <div className="space-y-2">
                {hargaList.map((harga) => (
                  <div
                    key={harga.id}
                    className="flex items-center gap-2 border rounded px-3 py-2"
                  >
                    <span className="flex-1">
                      <b>
                        {TIPE_HARGA_OPTIONS.find(
                          (opt) => opt.value === harga.tipeHarga
                        )?.label || harga.tipeHarga}
                      </b>
                      : {harga.hargaFormatted}
                    </span>
                    <button
                      onClick={() => handleEdit(harga)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(harga.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form tambah/edit harga */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <select
                name="tipeHarga"
                value={form.tipeHarga}
                onChange={handleInput}
                className="border rounded px-2 py-1 flex-1"
                disabled={!!editingId}
              >
                <option value="">-- Pilih Tipe Harga --</option>
                {TIPE_HARGA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Input
                name="harga"
                type="number"
                min="0"
                step="100"
                value={form.harga}
                onChange={handleInput}
                placeholder="Nominal harga"
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                <Save className="h-4 w-4 mr-1" />
                {editingId ? "Update Harga" : "Tambah Harga"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1"
                >
                  Batal
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
