"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
import {
  apiService,
  ProdukData,
  SalesData,
  PeriodeData,
  HariData,
  JalurData,
  MingguData,
  PenjualanData,
} from "@/app/services/api";
import { sweetAlert } from "@/app/utils/sweetAlert";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/LoadingSpinner";

interface EditReturnPageProps {
  params: { id: string };
}

export default function EditReturnPage({ params }: EditReturnPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    produkId: "",
    kuantitas: "",
    tanggalTransaksi: "",
    salesId: "",
    periodeId: "",
    hariId: "",
    jalurId: "",
    mingguId: "",
    tipeTransaksi: "RETURN",
    jumlahPenjualan: "",
    keterangan: "",
  });
  const [originalData, setOriginalData] = useState<PenjualanData | null>(null);
  const [produkList, setProdukList] = useState<ProdukData[]>([]);
  const [salesList, setSalesList] = useState<SalesData[]>([]);
  const [periodeList, setPeriodeList] = useState<PeriodeData[]>([]);
  const [hariList, setHariList] = useState<HariData[]>([]);
  const [jalurList, setJalurList] = useState<JalurData[]>([]);
  const [mingguList, setMingguList] = useState<MingguData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setIsLoadingData(true);

      // Load master data dan data existing secara parallel
      const [produk, sales, periode, hari, jalur, minggu, existingData] =
        await Promise.all([
          apiService.getAllProduk(),
          apiService.getAllSales(),
          apiService.getAllPeriode(),
          apiService.getAllHari(),
          apiService.getAllJalur(),
          apiService.getAllMinggu(),
          apiService.getPenjualanById(Number(params.id)),
        ]);

      setProdukList(produk);
      setSalesList(sales);
      setPeriodeList(periode);
      setHariList(hari);
      setJalurList(jalur);
      setMingguList(minggu);
      setOriginalData(existingData);

      // Validasi bahwa data ini adalah return/BS
      if (
        existingData.tipeTransaksi &&
        existingData.tipeTransaksi !== "" &&
        existingData.tipeTransaksi.toUpperCase() !== "PENJUALAN"
      ) {
        // Populate form dengan data existing
        setFormData({
          produkId: existingData.produk?.id?.toString() || "",
          kuantitas: existingData.kuantitas?.toString() || "",
          tanggalTransaksi: existingData.tanggalTransaksi || "",
          salesId: existingData.sales?.id?.toString() || "",
          periodeId: existingData.periode?.id?.toString() || "",
          hariId: existingData.hari?.id?.toString() || "",
          jalurId: existingData.jalur?.id?.toString() || "",
          mingguId: existingData.minggu?.id?.toString() || "",
          tipeTransaksi: existingData.tipeTransaksi || "RETURN",
          jumlahPenjualan: existingData.jumlahPenjualan?.toString() || "",
          keterangan: existingData.keterangan || "",
        });
      } else {
        // Jika bukan return/BS, redirect ke edit penjualan biasa
        sweetAlert.error("Error", "Data ini bukan transaksi return atau BS!");
        router.push(`/sales/edit/${params.id}`);
        return;
      }
    } catch (error) {
      console.error("Error loading data:", error);
      sweetAlert.error(
        "Error",
        "Gagal memuat data. Data mungkin tidak ditemukan."
      );
      router.push("/sales");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        produkId: Number(formData.produkId),
        kuantitas: Number(formData.kuantitas),
        tanggalTransaksi: formData.tanggalTransaksi,
        salesId: Number(formData.salesId),
        periodeId: Number(formData.periodeId),
        hariId: Number(formData.hariId),
        jalurId: Number(formData.jalurId),
        mingguId: Number(formData.mingguId),
        tipeTransaksi: formData.tipeTransaksi,
        jumlahPenjualan: Number(formData.jumlahPenjualan),
        keterangan: formData.keterangan || undefined,
      };

      await apiService.updatePenjualan(Number(params.id), payload);

      const tipeText =
        formData.tipeTransaksi === "RETURN" ? "Return" : "Barang Susut";
      sweetAlert.success(`${tipeText} berhasil diupdate!`);
      router.push("/sales");
    } catch (error) {
      console.error("Error updating return/BS:", error);
      sweetAlert.error("Gagal mengupdate data return/BS");
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayTitle = () => {
    if (!originalData) return "Edit Return/BS";

    switch (originalData.tipeTransaksi?.toUpperCase()) {
      case "RETURN":
        return "Edit Return Produk";
      case "BS":
        return "Edit Barang Susut (BS)";
      default:
        return "Edit Return/BS";
    }
  };

  if (isLoadingData) {
    return <PageLoader text="Memuat data return/BS..." />;
  }

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Card className="bg-white shadow-lg border border-slate-200 p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-2">
            {getDisplayTitle()}
          </CardTitle>
          {originalData && (
            <p className="text-sm text-gray-600">
              ID: #{originalData.id} • Dibuat:{" "}
              {new Date(originalData.tanggalTransaksi || "").toLocaleDateString(
                "id-ID"
              )}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Produk</Label>
              <Select
                value={formData.produkId}
                onValueChange={(val) => handleInputChange("produkId", val)}
              >
                <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {produkList.map((produk) => (
                    <SelectItem
                      key={produk.id}
                      value={produk.id.toString()}
                      className="bg-white hover:bg-slate-100"
                    >
                      {produk.namaProduk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Kuantitas</Label>
              <Input
                type="number"
                min={1}
                value={formData.kuantitas}
                onChange={(e) => handleInputChange("kuantitas", e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Tanggal Transaksi</Label>
              <Input
                type="date"
                value={formData.tanggalTransaksi}
                onChange={(e) =>
                  handleInputChange("tanggalTransaksi", e.target.value)
                }
                required
                className="input-field"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Sales</Label>
              <Select
                value={formData.salesId}
                onValueChange={(val) => handleInputChange("salesId", val)}
              >
                <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                  <SelectValue placeholder="Pilih sales" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {salesList.map((sales) => (
                    <SelectItem
                      key={sales.id}
                      value={sales.id.toString()}
                      className="bg-white hover:bg-slate-100"
                    >
                      {sales.namaSales}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Periode</Label>
              <Select
                value={formData.periodeId}
                onValueChange={(val) => handleInputChange("periodeId", val)}
              >
                <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {periodeList.map((periode) => (
                    <SelectItem
                      key={periode.id}
                      value={periode.id.toString()}
                      className="bg-white hover:bg-slate-100"
                    >
                      {periode.namaPeriode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Hari</Label>
              <Select
                value={formData.hariId}
                onValueChange={(val) => handleInputChange("hariId", val)}
              >
                <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {hariList.map((hari) => (
                    <SelectItem
                      key={hari.id}
                      value={hari.id.toString()}
                      className="bg-white hover:bg-slate-100"
                    >
                      {hari.namaHari}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Jalur</Label>
              <Select
                value={formData.jalurId}
                onValueChange={(val) => handleInputChange("jalurId", val)}
              >
                <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                  <SelectValue placeholder="Pilih jalur" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {jalurList.map((jalur) => (
                    <SelectItem
                      key={jalur.id}
                      value={jalur.id.toString()}
                      className="bg-white hover:bg-slate-100"
                    >
                      {jalur.namaJalur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Minggu</Label>
              <Select
                value={formData.mingguId}
                onValueChange={(val) => handleInputChange("mingguId", val)}
              >
                <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                  <SelectValue placeholder="Pilih minggu" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {mingguList.map((minggu) => (
                    <SelectItem
                      key={minggu.id}
                      value={minggu.id.toString()}
                      className="bg-white hover:bg-slate-100"
                    >
                      {minggu.namaMinggu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Tipe Transaksi</Label>
              <Select
                value={formData.tipeTransaksi}
                onValueChange={(val) => handleInputChange("tipeTransaksi", val)}
              >
                <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                  <SelectValue placeholder="Pilih tipe transaksi" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem
                    value="RETURN"
                    className="bg-white hover:bg-slate-100"
                  >
                    Return
                  </SelectItem>
                  <SelectItem
                    value="BS"
                    className="bg-white hover:bg-slate-100"
                  >
                    Barang Susut (BS)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <Label className="mb-1 font-semibold">Harga per Unit</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={formData.jumlahPenjualan}
                onChange={(e) =>
                  handleInputChange("jumlahPenjualan", e.target.value)
                }
                placeholder="Masukkan harga per unit"
                required
                className="bg-white border-slate-300"
              />
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <Label className="mb-1 font-semibold">
                Keterangan (Opsional)
              </Label>
              <textarea
                value={formData.keterangan}
                onChange={(e) =>
                  handleInputChange("keterangan", e.target.value)
                }
                placeholder="Tambahkan catatan atau keterangan tambahan..."
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/sales")}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? <LoadingSpinner /> : "Update Return/BS"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
