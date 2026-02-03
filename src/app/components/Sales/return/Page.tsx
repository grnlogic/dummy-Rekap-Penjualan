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
} from "@/app/services/api";
import { sweetAlert } from "@/app/utils/sweetAlert";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

export default function ReturnSalesPage() {
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
  const [produkList, setProdukList] = useState<ProdukData[]>([]);
  const [salesList, setSalesList] = useState<SalesData[]>([]);
  const [periodeList, setPeriodeList] = useState<PeriodeData[]>([]);
  const [hariList, setHariList] = useState<HariData[]>([]);
  const [jalurList, setJalurList] = useState<JalurData[]>([]);
  const [mingguList, setMingguList] = useState<MingguData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setIsLoading(true);
      const [produk, sales, periode, hari, jalur, minggu] = await Promise.all([
        apiService.getAllProduk(),
        apiService.getAllSales(),
        apiService.getAllPeriode(),
        apiService.getAllHari(),
        apiService.getAllJalur(),
        apiService.getAllMinggu(),
      ]);
      setProdukList(produk);
      setSalesList(sales);
      setPeriodeList(periode);
      setHariList(hari);
      setJalurList(jalur);
      setMingguList(minggu);
    } catch (error) {
      sweetAlert.toast.error("Gagal memuat data master");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getProductPrice = (produkId: string): number => {
    const hargaData: Record<string, number> = {
      "1": 8000,
      "2": 4000,
      "3": 8000,
      "4": 8000,
      "5": 4000,
      "6": 4000,
      "7": 6700,
      "8": 8000,
      "9": 8000,
      "10": 3000,
      "11": 8000,
      "12": 7000,
      "13": 6800,
      "14": 6700,
      "15": 8000,
    };
    return hargaData[produkId] || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        jumlahPenjualan: Number(formData.jumlahPenjualan),
        keterangan: formData.keterangan || undefined,
      };
      await apiService.createPenjualan(payload);
      sweetAlert.success("Return berhasil disimpan!");
      router.push("/sales");
    } catch (error) {
      sweetAlert.error("Gagal menyimpan return");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Card className="bg-white shadow-lg border border-slate-200 p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-2">
            Form Return Produk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-semibold">Produk</Label>
              <Select
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
              <Select onValueChange={(val) => handleInputChange("hariId", val)}>
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
              <Label className="mb-1 font-semibold">Keterangan (Opsional)</Label>
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
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2"
            >
              {isLoading ? <LoadingSpinner /> : "Simpan Return"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
