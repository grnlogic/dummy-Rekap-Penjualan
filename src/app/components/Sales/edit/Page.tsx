"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  User,
  Calendar,
  MapPin,
  Package,
  Clock,
  Hash,
  CalendarDays,
} from "lucide-react";
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
  PenjualanRequest,
} from "@/app/services/api";
import { sweetAlert } from "@/app/utils/sweetAlert";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/LoadingSpinner";
import {
  removeDuplicatesByName,
  sortHariData,
  sortMingguData,
  getCachedFilteredData,
} from "@/app/lib/utils";

export default function EditSalesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const [formData, setFormData] = useState({
    periodeId: "",
    salesId: "",
    hariId: "",
    jalurId: "",
    produkId: "",
    mingguId: "",
    jumlahPenjualan: "",
    kuantitas: "",
    tanggalTransaksi: "",
    keterangan: "",
  });

  // Master data states
  const [produkList, setProdukList] = useState<ProdukData[]>([]);
  const [salesList, setSalesList] = useState<SalesData[]>([]);
  const [periodeList, setPeriodeList] = useState<PeriodeData[]>([]);
  const [hariList, setHariList] = useState<HariData[]>([]);
  const [jalurList, setJalurList] = useState<JalurData[]>([]);
  const [mingguList, setMingguList] = useState<MingguData[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ambil ID dari multiple sources untuk memastikan dapat nilai
    let id: string | undefined;

    if (params?.id) {
      id = params.id;
    } else if (routeParams?.id) {
      id = Array.isArray(routeParams.id) ? routeParams.id[0] : routeParams.id;
    }

    if (!id || id === "undefined" || id === "" || isNaN(Number(id))) {
      sweetAlert.error("Error", "ID penjualan tidak valid");
      router.push("/sales");
      return;
    }

    loadData(id);
  }, [params, routeParams, router]);

  const loadData = async (id: string) => {
    try {
      setIsLoading(true);

      // Convert dan validasi ID
      const numericId = Number(id);
      if (!numericId || isNaN(numericId) || numericId <= 0) {
        throw new Error(`Invalid ID: ${id}`);
      }

      sweetAlert.toast.info("Memuat data penjualan...");

      const [penjualanData, produk, sales, periode, hari, jalur, minggu] =
        await Promise.all([
          apiService.getPenjualanById(numericId),
          apiService.getAllProduk(),
          apiService.getAllSales(),
          apiService.getAllPeriode(),
          apiService.getAllHari(),
          apiService.getAllJalur(),
          apiService.getAllMinggu(),
        ]);

      // Validasi data yang diterima
      if (!penjualanData || !penjualanData.id) {
        throw new Error("Data penjualan tidak ditemukan");
      }

      // Set form data from existing penjualan
      setFormData({
        periodeId: penjualanData.periode?.id?.toString() || "",
        salesId: penjualanData.sales?.id?.toString() || "",
        hariId: penjualanData.hari?.id?.toString() || "",
        jalurId: penjualanData.jalur?.id?.toString() || "no-jalur",
        produkId: penjualanData.produk?.id?.toString() || "",
        mingguId: penjualanData.minggu?.id?.toString() || "",
        jumlahPenjualan: penjualanData.jumlahPenjualan?.toString() || "",
        kuantitas: penjualanData.kuantitas?.toString() || "1",
        tanggalTransaksi: penjualanData.tanggalTransaksi || "",
        keterangan: penjualanData.keterangan || "",
      });

      // Gunakan utility functions untuk filter dan sort data
      setProdukList(
        getCachedFilteredData("produk-edit", produk, (data) =>
          removeDuplicatesByName(data, "namaProduk")
        )
      );

      setSalesList(
        getCachedFilteredData("sales-edit", sales, (data) =>
          removeDuplicatesByName(data, "namaSales")
        )
      );

      setPeriodeList(
        getCachedFilteredData("periode-edit", periode, (data) =>
          removeDuplicatesByName(data, "namaPeriode")
        )
      );

      setHariList(
        getCachedFilteredData("hari-edit", hari, (data) =>
          sortHariData(removeDuplicatesByName(data, "namaHari"))
        )
      );

      setJalurList(
        getCachedFilteredData("jalur-edit", jalur, (data) =>
          removeDuplicatesByName(data, "namaJalur")
        )
      );

      setMingguList(
        getCachedFilteredData("minggu-edit", minggu, (data) =>
          sortMingguData(removeDuplicatesByName(data, "namaMinggu"))
        )
      );

      sweetAlert.toast.success("Data berhasil dimuat tanpa duplikasi");
    } catch (error) {
      sweetAlert.toast.error("Gagal memuat data");

      // Redirect jika data tidak ditemukan
      if (error instanceof Error && error.message.includes("tidak ditemukan")) {
        setTimeout(() => {
          router.push("/sales");
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.periodeId) newErrors.periodeId = "Periode harus dipilih";
    if (!formData.salesId) newErrors.salesId = "Sales harus dipilih";
    if (!formData.hariId) newErrors.hariId = "Hari harus dipilih";
    // Remove jalur validation - make it optional
    // if (!formData.jalurId) newErrors.jalurId = "Jalur harus dipilih";
    if (!formData.produkId) newErrors.produkId = "Produk harus dipilih";
    if (!formData.mingguId) newErrors.mingguId = "Minggu harus dipilih";
    if (!formData.kuantitas || Number(formData.kuantitas) <= 0) {
      newErrors.kuantitas = "Kuantitas harus lebih dari 0";
    }
    if (!formData.jumlahPenjualan || Number(formData.jumlahPenjualan) <= 0) {
      newErrors.jumlahPenjualan = "Jumlah penjualan harus lebih dari 0";
    }

    // Tidak ada validasi tipeHarga di sini

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Ambil ID dari multiple sources
    let id: string | undefined;
    if (params?.id) {
      id = params.id;
    } else if (routeParams?.id) {
      id = Array.isArray(routeParams.id) ? routeParams.id[0] : routeParams.id;
    }

    const numericId = Number(id);
    if (!numericId || isNaN(numericId)) {
      sweetAlert.error("Error", "ID penjualan tidak valid");
      return;
    }

    setIsSubmitting(true);

    try {
      sweetAlert.loading(
        "Mengupdate Data",
        "Sedang mengupdate data penjualan..."
      );

      const penjualanData: PenjualanRequest = {
        periodeId: Number(formData.periodeId),
        salesId: Number(formData.salesId),
        hariId: Number(formData.hariId),
        jalurId:
          formData.jalurId && formData.jalurId !== "no-jalur"
            ? Number(formData.jalurId)
            : undefined,
        produkId: Number(formData.produkId),
        mingguId: Number(formData.mingguId),
        jumlahPenjualan: Number(formData.jumlahPenjualan),
        kuantitas: Number(formData.kuantitas),
        tanggalTransaksi: formData.tanggalTransaksi || undefined,
        keterangan: formData.keterangan || undefined,
      };

      await apiService.updatePenjualan(numericId, penjualanData);

      sweetAlert.close();
      await sweetAlert.success("Berhasil!", "Data penjualan berhasil diupdate");

      router.push("/sales");
    } catch (error) {
      sweetAlert.close();
      sweetAlert.error(
        "Gagal Mengupdate",
        "Terjadi kesalahan saat mengupdate data penjualan. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Early return check yang lebih robust
  const currentId =
    params?.id ||
    (Array.isArray(routeParams?.id) ? routeParams.id[0] : routeParams?.id);

  if (!currentId || currentId === "undefined" || isNaN(Number(currentId))) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            ID penjualan tidak valid: {currentId}. Mengarahkan kembali...
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader text="Memuat data penjualan untuk diedit..." />;
  }

  // Tambahkan fungsi untuk mencegah scroll pada input number
  const preventScrollOnNumberInput = (
    e: React.WheelEvent<HTMLInputElement>
  ) => {
    e.currentTarget.blur();
    e.preventDefault();
  };

  const getProductPrice = (produkId: string): number => {
    const hargaData: Record<string, number> = {
      // Berdasarkan ID produk dari database yang sebenarnya
      "1": 8000, // PLATINUM 0.6 KUNING
      "2": 4000, // DELUXE KUNING
      "3": 8000, // 98 MERAH
      "4": 8000, // 0.6 HITAM
      "5": 4000, // 98 KUNING ISI 10
      "6": 4000, // DELUXE HITAM
      "7": 6700, // ROKOK PRIMAVERA (HARGA SALES)
      "8": 8000, // PREMIUM 0.6 KUNING
      "9": 8000, // 0.6 KUNING SPECIAL
      "10": 3000, // 98 KUNING ISI 20
      "11": 8000, // DELUXE MERAH
      "12": 7000, // ROKOK PRIMAVERA (HARGA MOTORIS)
      "13": 6800, // ROKOK PRIMAVERA (HARGA PASAR)
    };

    return hargaData[produkId] || 0;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/sales"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Penjualan
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Edit Penjualan #{currentId}
        </h1>
        <p className="text-gray-600 mt-2">
          Ubah informasi penjualan yang sudah ada
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
          <CardTitle className="text-xl text-orange-800 flex items-center">
            {isSubmitting && <LoadingSpinner size="sm" color="red" />}
            <span className={isSubmitting ? "ml-2" : ""}>
              Form Edit Penjualan
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informasi Periode & Sales */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Informasi Periode & Sales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Periode */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Periode Laporan *
                  </Label>
                  <Select
                    value={formData.periodeId}
                    onValueChange={(value: string) =>
                      handleInputChange("periodeId", value)
                    }
                  >
                    <SelectTrigger
                      className={`h-11 bg-white border-2 shadow-sm ${
                        errors.periodeId
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-orange-400 focus:border-orange-500"
                      }`}
                    >
                      <SelectValue placeholder="-- Pilih Periode --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
                      {periodeList.map((periode) => (
                        <SelectItem
                          key={`periode-edit-${periode.id}-${periode.namaPeriode}`}
                          value={periode.id.toString()}
                          className="bg-white hover:bg-orange-50 focus:bg-orange-50 px-3 py-2 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-gray-900">
                              {periode.namaPeriode}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.periodeId && (
                    <p className="text-red-500 text-sm flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.periodeId}
                    </p>
                  )}
                </div>

                {/* Sales */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Nama Sales *
                  </Label>
                  <Select
                    value={formData.salesId}
                    onValueChange={(value: string) =>
                      handleInputChange("salesId", value)
                    }
                  >
                    <SelectTrigger
                      className={`h-11 bg-white border-2 shadow-sm ${
                        errors.salesId
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-orange-400 focus:border-orange-500"
                      }`}
                    >
                      <SelectValue placeholder="-- Pilih Sales --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
                      {salesList.map((sales) => (
                        <SelectItem
                          key={`sales-edit-${sales.id}-${sales.namaSales}`}
                          value={sales.id.toString()}
                          className="bg-white hover:bg-orange-50 focus:bg-orange-50 px-3 py-2 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-gray-900">
                              {sales.namaSales}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.salesId && (
                    <p className="text-red-500 text-sm flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.salesId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Informasi Waktu */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                Informasi Waktu
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hari */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Hari *
                  </Label>
                  <Select
                    value={formData.hariId}
                    onValueChange={(value: string) =>
                      handleInputChange("hariId", value)
                    }
                  >
                    <SelectTrigger
                      className={`h-11 bg-white border-2 shadow-sm ${
                        errors.hariId
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-orange-400 focus:border-orange-500"
                      }`}
                    >
                      <SelectValue placeholder="-- Pilih Hari --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
                      {hariList.map((hari) => (
                        <SelectItem
                          key={`hari-edit-${hari.id}-${hari.namaHari}`}
                          value={hari.id.toString()}
                          className="bg-white hover:bg-orange-50 focus:bg-orange-50 px-3 py-2 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            {hari.namaHari}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.hariId && (
                    <p className="text-red-500 text-sm flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.hariId}
                    </p>
                  )}
                </div>

                {/* Minggu */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <Hash className="h-4 w-4 mr-1" />
                    Minggu *
                  </Label>
                  <Select
                    value={formData.mingguId}
                    onValueChange={(value: string) =>
                      handleInputChange("mingguId", value)
                    }
                  >
                    <SelectTrigger
                      className={`h-11 bg-white border-2 shadow-sm ${
                        errors.mingguId
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-orange-400 focus:border-orange-500"
                      }`}
                    >
                      <SelectValue placeholder="-- Pilih Minggu --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
                      {mingguList.map((minggu) => (
                        <SelectItem
                          key={`minggu-edit-${minggu.id}-${minggu.namaMinggu}`}
                          value={minggu.id.toString()}
                          className="bg-white hover:bg-orange-50 focus:bg-orange-50 px-3 py-2 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 mr-2 text-gray-500" />
                            {minggu.namaMinggu}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.mingguId && (
                    <p className="text-red-500 text-sm flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.mingguId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tanggal Transaksi */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
                Tanggal Transaksi
              </h3>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  Tanggal Transaksi (Opsional)
                </Label>
                <Input
                  type="date"
                  value={formData.tanggalTransaksi}
                  onChange={(e) =>
                    handleInputChange("tanggalTransaksi", e.target.value)
                  }
                  className={`h-11 bg-white border-2 ${
                    errors.tanggalTransaksi
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:border-orange-400 focus:border-orange-500"
                  }`}
                />
                <p className="text-blue-600 text-xs">
                  💡 Kosongkan untuk menggunakan tanggal hari ini, atau pilih
                  tanggal manual
                </p>
              </div>
            </div>

            {/* Informasi Lokasi & Produk */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                Informasi Lokasi & Produk
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Jalur */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Jalur Distribusi (Opsional)
                  </Label>
                  <Select
                    value={formData.jalurId}
                    onValueChange={(value: string) =>
                      handleInputChange("jalurId", value)
                    }
                  >
                    <SelectTrigger
                      className={`h-11 bg-white border-2 shadow-sm ${
                        errors.jalurId
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-orange-400 focus:border-orange-500"
                      }`}
                    >
                      <SelectValue placeholder="-- Pilih Jalur (Kosong jika ke Pasar) --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
                      <SelectItem
                        value="no-jalur"
                        className="bg-white hover:bg-orange-50 focus:bg-orange-50 px-3 py-2 cursor-pointer"
                      >
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-900 italic">
                            Tidak ada jalur (Pasar langsung)
                          </span>
                        </div>
                      </SelectItem>
                      {jalurList.map((jalur) => (
                        <SelectItem
                          key={`jalur-edit-${jalur.id}-${jalur.namaJalur}`}
                          value={jalur.id.toString()}
                          className="bg-white hover:bg-orange-50 focus:bg-orange-50 px-3 py-2 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            {jalur.namaJalur}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jalurId && (
                    <p className="text-red-500 text-sm flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.jalurId}
                    </p>
                  )}
                  <p className="text-blue-600 text-xs">
                    💡 Kosongkan jika penjualan langsung ke pasar tanpa jalur
                    khusus
                  </p>
                </div>

                {/* Produk */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    Jenis Produk *
                  </Label>
                  <Select
                    value={formData.produkId}
                    onValueChange={(value: string) =>
                      handleInputChange("produkId", value)
                    }
                  >
                    <SelectTrigger
                      className={`h-11 bg-white border-2 shadow-sm ${
                        errors.produkId
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-orange-400 focus:border-orange-500"
                      }`}
                    >
                      <SelectValue placeholder="-- Pilih Produk PERUSAHAAN --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
                      {produkList.map((produk) => (
                        <SelectItem
                          key={`produk-edit-${produk.id}-${produk.namaProduk}`}
                          value={produk.id.toString()}
                          className="bg-white hover:bg-orange-50 focus:bg-orange-50 px-3 py-2 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="font-medium">
                              {produk.namaProduk}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.produkId && (
                    <p className="text-red-500 text-sm flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.produkId}
                    </p>
                  )}
                </div>

                {/* Kuantitas */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <Hash className="h-4 w-4 mr-1" />
                    Kuantitas Diambil *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Contoh: 30"
                    value={formData.kuantitas}
                    onChange={(e) =>
                      handleInputChange("kuantitas", e.target.value)
                    }
                    onWheel={preventScrollOnNumberInput}
                    onFocus={(e) =>
                      e.target.addEventListener(
                        "wheel",
                        preventScrollOnNumberInput as any,
                        { passive: false }
                      )
                    }
                    onBlur={(e) =>
                      e.target.removeEventListener(
                        "wheel",
                        preventScrollOnNumberInput as any
                      )
                    }
                    className={`h-11 ${
                      errors.kuantitas
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  {formData.kuantitas && Number(formData.kuantitas) > 0 && (
                    <p className="text-blue-600 text-sm">
                      📦 {Number(formData.kuantitas)} unit/bungkus
                    </p>
                  )}
                  {errors.kuantitas && (
                    <p className="text-red-500 text-sm flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      {errors.kuantitas}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Jumlah Penjualan */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                💰 Jumlah Penjualan
              </h3>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Jumlah Penjualan (dalam Rupiah) *
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Masukkan jumlah penjualan (contoh: 150000)"
                  value={formData.jumlahPenjualan}
                  onChange={(e) =>
                    handleInputChange("jumlahPenjualan", e.target.value)
                  }
                  onWheel={preventScrollOnNumberInput}
                  onFocus={(e) =>
                    e.target.addEventListener(
                      "wheel",
                      preventScrollOnNumberInput as any,
                      { passive: false }
                    )
                  }
                  onBlur={(e) =>
                    e.target.removeEventListener(
                      "wheel",
                      preventScrollOnNumberInput as any
                    )
                  }
                  className={`h-12 text-lg ${
                    errors.jumlahPenjualan
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                />
                {formData.jumlahPenjualan &&
                  Number(formData.jumlahPenjualan) > 0 && (
                    <p className="text-green-600 text-sm">
                      💰{" "}
                      {Number(formData.jumlahPenjualan).toLocaleString(
                        "id-ID",
                        { style: "currency", currency: "IDR" }
                      )}
                    </p>
                  )}

                {/* Per Unit Price Calculation */}
                {formData.kuantitas &&
                  formData.jumlahPenjualan &&
                  Number(formData.kuantitas) > 0 &&
                  Number(formData.jumlahPenjualan) > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        💡 Harga per unit:{" "}
                        <span className="font-semibold">
                          {(
                            Number(formData.jumlahPenjualan) /
                            Number(formData.kuantitas)
                          ).toLocaleString("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          })}
                        </span>
                      </p>
                    </div>
                  )}

                {errors.jumlahPenjualan && (
                  <p className="text-red-500 text-sm flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    {errors.jumlahPenjualan}
                  </p>
                )}
              </div>
            </div>

            {/* Keterangan */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📝</span>
                Keterangan (Opsional)
              </h3>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Catatan Tambahan
                </Label>
                <textarea
                  value={formData.keterangan}
                  onChange={(e) =>
                    handleInputChange("keterangan", e.target.value)
                  }
                  placeholder="Tambahkan catatan atau keterangan tambahan..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-md hover:border-blue-400 focus:border-blue-500 focus:outline-none resize-none"
                />
                <p className="text-blue-600 text-xs">
                  💡 Tambahkan catatan khusus untuk transaksi ini
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 text-lg flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 relative overflow-hidden"
              >
                {isSubmitting ? (
                  <>
                    <div className="absolute inset-0 bg-orange-700 animate-pulse"></div>
                    <LoadingSpinner size="sm" color="red" />
                    <span className="relative z-10">Mengupdate...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Update Penjualan
                  </>
                )}
              </Button>

              <Link href="/sales" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-lg flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                  <X className="h-5 w-5" />
                  Batal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
