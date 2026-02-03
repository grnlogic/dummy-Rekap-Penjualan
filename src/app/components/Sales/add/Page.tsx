"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  User,
  Calendar,
  MapPin,
  Package,
  Clock,
  Hash,
  CalendarDays,
  DollarSign,
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
  PenjualanRequest,
  ProdukHargaData,
} from "@/app/services/api";
import { sweetAlert } from "@/app/utils/sweetAlert";
import { LoadingSpinner, PageLoader } from "@/app/components/ui/LoadingSpinner";
import {
  removeDuplicatesByName,
  sortHariData,
  sortMingguData,
  getCachedFilteredData,
} from "@/app/lib/utils";

interface ProductItem {
  id: string;
  produkId: string;
  tipeHarga?: string; // Tambahan untuk tipe harga
  jumlahPenjualan: string;
  kuantitas: string;
  inputMode: "auto" | "manual";
  isAdjusted?: boolean; // Tambahkan ini untuk track apakah harga sudah di-adjust
}

export default function AddSalesPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    periodeId: "",
    salesId: "",
    hariId: "",
    jalurId: "",
    mingguId: "",
    tanggalTransaksi: "",
    keterangan: "",
  });

  // Array untuk multiple products
  const [productItems, setProductItems] = useState<ProductItem[]>([
    {
      id: "1",
      produkId: "",
      tipeHarga: "",
      jumlahPenjualan: "",
      kuantitas: "",
      inputMode: "auto",
    },
  ]);

  // Master data states
  const [produkList, setProdukList] = useState<ProdukData[]>([]);
  const [salesList, setSalesList] = useState<SalesData[]>([]);
  const [periodeList, setPeriodeList] = useState<PeriodeData[]>([]);
  const [hariList, setHariList] = useState<HariData[]>([]);
  const [jalurList, setJalurList] = useState<JalurData[]>([]);
  const [mingguList, setMingguList] = useState<MingguData[]>([]);
  const [produkHargaList, setProdukHargaList] = useState<ProdukHargaData[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);

  useEffect(() => {
    loadMasterData();
  }, []);

  // Tambahkan useEffect untuk mengisi otomatis harga satuan setiap kali produk dipilih
  React.useEffect(() => {
    // Skip jika produkHargaList belum dimuat
    if (produkHargaList.length === 0) {
      return;
    }

    setProductItems((prev) =>
      prev.map((item) => {
        if (
          item.inputMode === "auto" &&
          item.produkId &&
          (item.jumlahPenjualan === undefined || item.jumlahPenjualan === "")
        ) {
          const hargaDefault = getProductPrice(item.produkId);
          if (hargaDefault && hargaDefault > 0) {
            return { ...item, jumlahPenjualan: hargaDefault.toString() };
          }
        }
        return item;
      })
    );
  }, [productItems.map((item) => item.produkId).join(","), produkHargaList]);

  const loadMasterData = async () => {
    try {
      setIsLoadingMasterData(true);

      // Show loading toast
      sweetAlert.toast.info("Memuat data master...");

      const [produk, sales, periode, hari, jalur, minggu, produkHarga] =
        await Promise.all([
          apiService.getAllProduk(),
          apiService.getAllSales(),
          apiService.getAllPeriode(),
          apiService.getAllHari(),
          apiService.getAllJalur(),
          apiService.getAllMinggu(),
          apiService.getAllProdukHarga(),
        ]);

      // Gunakan utility functions untuk filter dan sort data
      // PERBAIKAN: Hapus duplikasi berdasarkan ID, bukan nama, agar semua produk muncul
      // TIDAK PAKAI CACHE untuk produk agar selalu fresh dari database
      const uniqueProdukById = produk.filter(
        (item, index, self) => index === self.findIndex((p) => p.id === item.id)
      );
      const filteredProduk = uniqueProdukById.sort((a, b) =>
        (a.namaProduk || "").localeCompare(b.namaProduk || "", "id", {
          sensitivity: "base",
          numeric: true,
        })
      );

      const filteredSales = getCachedFilteredData("sales-add", sales, (data) =>
        removeDuplicatesByName(data, "namaSales")
      );

      const filteredPeriode = getCachedFilteredData(
        "periode-add",
        periode,
        (data) => removeDuplicatesByName(data, "namaPeriode")
      );

      const filteredHari = getCachedFilteredData("hari-add", hari, (data) =>
        sortHariData(removeDuplicatesByName(data, "namaHari"))
      );

      const filteredJalur = getCachedFilteredData("jalur-add", jalur, (data) =>
        removeDuplicatesByName(data, "namaJalur")
      );

      const filteredMinggu = getCachedFilteredData(
        "minggu-add",
        minggu,
        (data) => sortMingguData(removeDuplicatesByName(data, "namaMinggu"))
      );

      setProdukList(filteredProduk);
      setSalesList(filteredSales);
      setPeriodeList(filteredPeriode);
      setHariList(filteredHari);
      setJalurList(filteredJalur);
      setMingguList(filteredMinggu);
      setProdukHargaList(produkHarga);

      console.log("✅ Data master berhasil dimuat:");
      console.log("📦 Produk:", filteredProduk.length);
      console.log("💰 Produk Harga:", produkHarga.length);
      console.log("💰 Detail Produk Harga:", produkHarga);

      sweetAlert.toast.success("Data master berhasil dimuat tanpa duplikasi");
    } catch (error) {
      sweetAlert.toast.error("Gagal memuat data master");
    } finally {
      setIsLoadingMasterData(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle product item changes
  const handleProductItemChange = (
    id: string,
    field: string,
    value: string
  ) => {
    console.log(
      `🔄 handleProductItemChange: id=${id}, field=${field}, value=${value}`
    );

    setProductItems((prev) => {
      const newItems = prev.map((item) => {
        if (item.id === id) {
          // Jika produkId berubah, set harga otomatis
          if (field === "produkId") {
            console.log(`🔍 Produk dipilih: ${value}`);
            const hargaDefault = getProductPrice(value);
            console.log(`💰 Harga default: ${hargaDefault}`);
            return {
              ...item,
              produkId: value,
              jumlahPenjualan: hargaDefault ? hargaDefault.toString() : "",
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      });
      console.log(`📊 Updated productItems:`, newItems);
      return newItems;
    });

    // Clear errors for this product item
    const errorKey = `${field}_${id}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  // Add new product item
  const addProductItem = () => {
    const newId = Date.now().toString();
    setProductItems((prev) => [
      ...prev,
      {
        id: newId,
        produkId: "",
        tipeHarga: "",
        jumlahPenjualan: "",
        kuantitas: "",
        inputMode: "auto",
        isAdjusted: false,
      },
    ]);
  };

  // Remove product item
  const removeProductItem = (id: string) => {
    if (productItems.length > 1) {
      setProductItems((prev) => prev.filter((item) => item.id !== id));

      // Clear errors for removed item
      setErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (key.endsWith(`_${id}`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate basic form data
    if (!formData.periodeId) newErrors.periodeId = "Periode harus dipilih";
    if (!formData.salesId) newErrors.salesId = "Sales harus dipilih";
    if (!formData.hariId) newErrors.hariId = "Hari harus dipilih";
    // Remove jalur validation - make it optional
    // if (!formData.jalurId) newErrors.jalurId = "Jalur harus dipilih";
    if (!formData.mingguId) newErrors.mingguId = "Minggu harus dipilih";
    if (!formData.tanggalTransaksi)
      newErrors.tanggalTransaksi = "Tanggal Transaksi harus diisi";

    // Validate product items - HANYA CEK DUPLIKASI DALAM FORM YANG SAMA
    const usedProducts = new Set();

    productItems.forEach((item, index) => {
      if (!item.produkId) {
        newErrors[`produkId_${item.id}`] = `Produk #${index + 1} harus dipilih`;
      } else if (usedProducts.has(item.produkId)) {
        newErrors[`produkId_${item.id}`] = `Produk #${
          index + 1
        } sudah dipilih sebelumnya dalam form ini`;
      } else {
        usedProducts.add(item.produkId);
      }

      if (!item.kuantitas || Number(item.kuantitas) <= 0) {
        newErrors[`kuantitas_${item.id}`] = `Kuantitas #${
          index + 1
        } harus lebih dari 0`;
      }

      if (!item.jumlahPenjualan || Number(item.jumlahPenjualan) <= 0) {
        newErrors[`jumlahPenjualan_${item.id}`] = `Harga per unit #${
          index + 1
        } harus lebih dari 0`;
      }

      // HAPUS validasi tipeHarga
      // if (!item.tipeHarga) {
      //   newErrors[`tipeHarga_${item.id}`] = `Tipe harga #${index + 1} harus dipilih`;
      // }
    });

    // Check if at least one product is added
    if (productItems.length === 0) {
      newErrors.general = "Minimal harus ada satu produk";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      sweetAlert.error(
        "Validasi Gagal",
        "Silakan perbaiki kesalahan pada form"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      sweetAlert.loading(
        "Menyimpan Data",
        "Sedang menyimpan data penjualan..."
      );

      // Process each product item as separate penjualan record
      const penjualanPromises = productItems.map(async (item) => {
        // Ambil harga dari produk+tipeHarga
        let harga = 0;
        if (item.tipeHarga) {
          harga = getProductPriceByTipe(item.produkId, item.tipeHarga);
        } else {
          harga = Number(item.jumlahPenjualan);
        }
        const penjualanData: PenjualanRequest = {
          periodeId: Number(formData.periodeId),
          salesId: Number(formData.salesId),
          hariId: Number(formData.hariId),
          jalurId:
            formData.jalurId && formData.jalurId !== "no-jalur"
              ? Number(formData.jalurId)
              : undefined,
          produkId: Number(item.produkId),
          mingguId: Number(formData.mingguId),
          jumlahPenjualan: harga,
          kuantitas: Number(item.kuantitas) || 1,
          tanggalTransaksi: formData.tanggalTransaksi || undefined,
          keterangan: formData.keterangan || undefined,
        };

        return apiService.createPenjualan(penjualanData);
      });

      await Promise.all(penjualanPromises);

      sweetAlert.close();
      await sweetAlert.success(
        "Berhasil!",
        `${productItems.length} produk penjualan berhasil disimpan`
      );

      router.push("/sales");
    } catch (error) {
      sweetAlert.close();
      sweetAlert.error(
        "Gagal Menyimpan",
        "Terjadi kesalahan saat menyimpan data penjualan. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const totalPenjualan = productItems.reduce((sum, item) => {
    return sum + (Number(item.jumlahPenjualan) || 0);
  }, 0);

  const totalKuantitas = productItems.reduce((sum, item) => {
    return sum + (Number(item.kuantitas) || 0);
  }, 0);

  const getProductPrice = (produkId: string): number => {
    // Validasi input
    if (!produkId || produkId === "") {
      console.log("❌ getProductPrice: produkId kosong");
      return 0;
    }

    console.log(`🔍 getProductPrice: Mencari harga untuk produkId=${produkId}`);
    console.log(`📊 Total produkHargaList: ${produkHargaList.length} items`);

    // Cari harga dari database berdasarkan produk ID
    const hargaData = produkHargaList.find(
      (harga) =>
        harga?.produkId?.toString() === produkId &&
        harga.tipeHarga === "STANDAR"
    );

    if (hargaData) {
      console.log(`✅ Harga ditemukan: ${hargaData.harga} (STANDAR)`);
      return hargaData.harga;
    }

    console.log(`⚠️ Harga STANDAR tidak ditemukan, mencoba harga pertama...`);

    // Jika tidak ada STANDAR, ambil harga pertama yang tersedia untuk produk ini
    const anyHarga = produkHargaList.find(
      (harga) => harga?.produkId?.toString() === produkId
    );

    if (anyHarga) {
      console.log(
        `✅ Menggunakan harga ${anyHarga.tipeHarga}: ${anyHarga.harga}`
      );
      return anyHarga.harga;
    }

    console.log(`❌ Tidak ada harga di database, menggunakan fallback`);

    // Fallback ke hardcode jika tidak ada di database
    const fallbackHargaData: Record<string, number> = {
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
      "14": 6700, // ROKOK PRIMAVERA (HARGA LAIN LAIN)
      "15": 8000, // PRIMAVERA LAINLAIN
    };

    const harga = fallbackHargaData[produkId] || 0;
    console.log(`🔄 Fallback harga: ${harga}`);
    return harga;
  };

  // Fungsi untuk mendapatkan harga dengan tipe tertentu
  const getProductPriceByTipe = (
    produkId: string,
    tipeHarga: string
  ): number => {
    console.log(
      `🔍 getProductPriceByTipe: produkId=${produkId}, tipeHarga=${tipeHarga}`
    );

    const hargaData = produkHargaList.find(
      (harga) =>
        harga?.produkId?.toString() === produkId &&
        harga.tipeHarga === tipeHarga
    );

    if (hargaData) {
      console.log(`✅ Harga ditemukan: ${hargaData.harga} (${tipeHarga})`);
      return hargaData.harga;
    }

    console.log(
      `⚠️ Harga ${tipeHarga} tidak ditemukan, fallback ke harga standar`
    );
    // Jika tidak ada tipe tertentu, coba harga standar
    return getProductPrice(produkId);
  };

  // Fungsi untuk mendapatkan semua tipe harga untuk produk
  const getProductHargaOptions = (produkId: string): ProdukHargaData[] => {
    return produkHargaList.filter(
      (harga) => harga?.produkId?.toString() === produkId
    );
  };

  // Helper: generate produk list untuk dropdown
  const getProdukDropdownOptions = () => {
    const options: { produkId: string; nama: string; tipeHarga?: string }[] =
      [];
    produkList.forEach((produk) => {
      if (produk?.namaProduk?.toUpperCase() === "ROKOK PRIMAVERA") {
        // Untuk PRIMAVERA, generate satu entry per tipe harga
        const hargaOptions = getProductHargaOptions(produk.id.toString());

        if (hargaOptions.length > 0) {
          // Jika ada data harga, tampilkan per tipe harga
          hargaOptions.forEach((harga) => {
            options.push({
              produkId: produk.id.toString(),
              nama: `${produk.namaProduk} (${harga.tipeHargaDescription})`,
              tipeHarga: harga.tipeHarga,
            });
          });
        } else {
          // Jika tidak ada data harga, tampilkan produk biasa
          options.push({
            produkId: produk.id.toString(),
            nama: produk.namaProduk,
          });
        }
      } else if (produk?.namaProduk) {
        options.push({
          produkId: produk.id.toString(),
          nama: produk.namaProduk,
        });
      }
    });
    return options;
  };

  // Tambahkan fungsi untuk mencegah scroll pada input number
  const preventScrollOnNumberInput = (
    e: React.WheelEvent<HTMLInputElement>
  ) => {
    e.currentTarget.blur();
    e.preventDefault();
  };

  if (isLoadingMasterData) {
    return <PageLoader text="Memuat data master untuk form penjualan..." />;
  }

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
          Tambah Penjualan Baru
        </h1>
        <p className="text-gray-600 mt-2">
          Isi semua informasi penjualan dengan lengkap - Satu sales bisa
          mengambil beberapa produk
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
          <CardTitle className="text-xl text-blue-800 flex items-center">
            {isSubmitting && <LoadingSpinner size="sm" color="blue" />}
            <span className={isSubmitting ? "ml-2" : ""}>
              Form Input Penjualan Multi-Produk
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
                          : "border-gray-300 hover:border-blue-400 focus:border-blue-500"
                      }`}
                    >
                      <SelectValue placeholder="-- Pilih Periode --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 shadow-lg rounded-md z-50">
                      {periodeList.map((periode) => (
                        <SelectItem
                          key={periode.id}
                          value={periode.id.toString()}
                          className="hover:bg-blue-50 cursor-pointer px-3 py-2"
                        >
                          {periode.namaPeriode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.periodeId && (
                    <p className="text-red-500 text-sm">{errors.periodeId}</p>
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
                          : "border-gray-300 hover:border-blue-400 focus:border-blue-500"
                      }`}
                    >
                      <SelectValue placeholder="-- Pilih Sales --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 shadow-lg rounded-md z-50 max-h-60 overflow-y-auto">
                      {salesList.map((sales) => (
                        <SelectItem
                          key={`sales-${sales.id}-${sales.namaSales}`}
                          value={sales.id.toString()}
                          className="hover:bg-blue-50 cursor-pointer px-3 py-2"
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
                    <p className="text-red-500 text-sm">{errors.salesId}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hari */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Hari *
                  </Label>
                  <Select
                    value={formData.hariId}
                    onValueChange={(value: string) =>
                      handleInputChange("hariId", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.hariId ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="-- Pilih Hari --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 shadow-lg rounded-md z-50 max-h-60 overflow-y-auto">
                      {hariList.map((hari) => (
                        <SelectItem
                          key={`hari-${hari.id}-${hari.namaHari}`}
                          value={hari.id.toString()}
                          className="hover:bg-green-50 cursor-pointer px-3 py-2"
                        >
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-gray-900">
                              {hari.namaHari}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.hariId && (
                    <p className="text-red-500 text-sm">{errors.hariId}</p>
                  )}
                </div>

                {/* Minggu */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Minggu *
                  </Label>
                  <Select
                    value={formData.mingguId}
                    onValueChange={(value: string) =>
                      handleInputChange("mingguId", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.mingguId ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="-- Pilih Minggu --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 shadow-lg rounded-md z-50 max-h-60 overflow-y-auto">
                      {mingguList.map((minggu) => (
                        <SelectItem
                          key={`minggu-${minggu.id}-${minggu.namaMinggu}`}
                          value={minggu.id.toString()}
                          className="hover:bg-green-50 cursor-pointer px-3 py-2"
                        >
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-gray-900">
                              {minggu.namaMinggu}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.mingguId && (
                    <p className="text-red-500 text-sm">{errors.mingguId}</p>
                  )}
                </div>

                {/* Jalur */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Jalur Distribusi (Opsional)
                  </Label>
                  <Select
                    value={formData.jalurId}
                    onValueChange={(value: string) =>
                      handleInputChange("jalurId", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.jalurId ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="-- Pilih Jalur (Kosong jika ke Pasar) --" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 shadow-lg rounded-md z-50 max-h-60 overflow-y-auto">
                      <SelectItem
                        value="no-jalur"
                        className="hover:bg-green-50 cursor-pointer px-3 py-2"
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
                          key={`jalur-${jalur.id}-${jalur.namaJalur}`}
                          value={jalur.id.toString()}
                          className="hover:bg-green-50 cursor-pointer px-3 py-2"
                        >
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-gray-900">
                              {jalur.namaJalur}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jalurId && (
                    <p className="text-red-500 text-sm">{errors.jalurId}</p>
                  )}
                  <p className="text-blue-600 text-xs">
                    💡 Kosongkan jika penjualan langsung ke pasar tanpa jalur
                    khusus
                  </p>
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
                  className="h-11 bg-white border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500"
                />
                {errors.tanggalTransaksi && (
                  <p className="text-red-500 text-sm">
                    {errors.tanggalTransaksi}
                  </p>
                )}
                <p className="text-blue-600 text-xs">
                  💡 Kosongkan untuk menggunakan tanggal hari ini, atau pilih
                  tanggal manual
                </p>
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <span className="mr-1">📝</span>
                  Keterangan (Opsional)
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

            {/* Multi-Product Section */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-green-600" />
                  Daftar Produk & Penjualan
                </h3>
                <Button
                  type="button"
                  onClick={addProductItem}
                  className="btn-success flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Produk
                </Button>
              </div>

              <div className="space-y-4">
                {productItems.map((item, index) => {
                  return (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800">
                          Produk #{index + 1}
                        </h4>
                        <div className="flex items-center gap-2">
                          {/* Toggle Mode Input */}
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">
                              Mode:
                            </label>
                            <select
                              value={item.inputMode}
                              onChange={(e) => {
                                const newMode = e.target.value as
                                  | "auto"
                                  | "manual";
                                handleProductItemChange(
                                  item.id,
                                  "inputMode",
                                  newMode
                                );

                                // Jika switch ke auto dan ada produk dipilih, set harga otomatis
                                if (newMode === "auto" && item.produkId) {
                                  const hargaOptions = getProductHargaOptions(
                                    item.produkId
                                  );
                                  let autoPrice = 0;

                                  if (hargaOptions.length > 0) {
                                    const standarHarga = hargaOptions.find(
                                      (h) => h.tipeHarga === "STANDAR"
                                    );
                                    if (standarHarga) {
                                      autoPrice = standarHarga.harga;
                                    } else {
                                      autoPrice = hargaOptions[0].harga;
                                    }
                                  } else {
                                    autoPrice = getProductPrice(item.produkId);
                                  }

                                  handleProductItemChange(
                                    item.id,
                                    "jumlahPenjualan",
                                    autoPrice.toString()
                                  );
                                }

                                // Jika switch ke manual, clear harga untuk input ulang
                                if (newMode === "manual") {
                                  handleProductItemChange(
                                    item.id,
                                    "jumlahPenjualan",
                                    ""
                                  );
                                }
                              }}
                              className="text-xs px-2 py-1 border rounded"
                            >
                              <option value="auto">🤖 Auto</option>
                              <option value="manual">✍️ Manual</option>
                            </select>
                          </div>

                          {productItems.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeProductItem(item.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Produk Selection */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            Jenis Produk *
                          </Label>
                          <Select
                            value={
                              item.produkId +
                              (item.tipeHarga ? `__${item.tipeHarga}` : "")
                            }
                            onValueChange={(value: string) => {
                              // value format: produkId__tipeHarga (untuk PRIMAVERA), produkId (lainnya)
                              const [produkId, tipeHarga] = value.split("__");
                              handleProductItemChange(
                                item.id,
                                "produkId",
                                produkId
                              );
                              if (tipeHarga) {
                                handleProductItemChange(
                                  item.id,
                                  "tipeHarga",
                                  tipeHarga
                                );
                                // Auto set harga
                                const harga = getProductPriceByTipe(
                                  produkId,
                                  tipeHarga
                                );
                                handleProductItemChange(
                                  item.id,
                                  "jumlahPenjualan",
                                  harga.toString()
                                );
                              } else {
                                handleProductItemChange(
                                  item.id,
                                  "tipeHarga",
                                  ""
                                );
                                handleProductItemChange(
                                  item.id,
                                  "jumlahPenjualan",
                                  ""
                                );
                              }
                            }}
                          >
                            <SelectTrigger
                              className={
                                errors[`produkId_${item.id}`]
                                  ? "border-red-500"
                                  : ""
                              }
                            >
                              <SelectValue placeholder="-- Pilih Produk PERUSAHAAN --" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-300 shadow-lg rounded-md z-50 max-h-60 overflow-y-auto">
                              {getProdukDropdownOptions().map((opt) => (
                                <SelectItem
                                  key={
                                    opt.produkId +
                                    (opt.tipeHarga ? `__${opt.tipeHarga}` : "")
                                  }
                                  value={
                                    opt.produkId +
                                    (opt.tipeHarga ? `__${opt.tipeHarga}` : "")
                                  }
                                  className="hover:bg-green-50 cursor-pointer px-3 py-2"
                                >
                                  <div className="flex items-center">
                                    <Package className="h-4 w-4 mr-2 text-gray-500" />
                                    <span className="font-medium text-gray-900">
                                      {opt.nama}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors[`produkId_${item.id}`] && (
                            <p className="text-red-500 text-sm flex items-center">
                              <X className="h-3 w-3 mr-1" />
                              {errors[`produkId_${item.id}`]}
                            </p>
                          )}
                        </div>
                        {/* Dropdown tipe harga */}
                        {/* Hapus dropdown tipe harga khusus PRIMAVERA, karena sudah dipecah di dropdown produk. */}

                        {/* Kuantitas - sama seperti sebelumnya */}
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
                            value={item.kuantitas}
                            onChange={(e) =>
                              handleProductItemChange(
                                item.id,
                                "kuantitas",
                                e.target.value
                              )
                            }
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
                            className={
                              errors[`kuantitas_${item.id}`]
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {item.kuantitas && Number(item.kuantitas) > 0 && (
                            <p className="text-blue-600 text-sm">
                              📦 {Number(item.kuantitas)} unit/bungkus
                            </p>
                          )}
                          {errors[`kuantitas_${item.id}`] && (
                            <p className="text-red-500 text-sm flex items-center">
                              <X className="h-3 w-3 mr-1" />
                              {errors[`kuantitas_${item.id}`]}
                            </p>
                          )}
                        </div>

                        {/* Harga - Update dengan mode auto/manual dan adjustment */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            {item.inputMode === "auto" ? "🤖" : "✍️"} Harga Per
                            Unit *
                            <span className="ml-1 text-xs text-gray-500">
                              (
                              {item.inputMode === "auto"
                                ? "Otomatis"
                                : "Manual"}
                              )
                            </span>
                            {item.inputMode === "auto" && item.isAdjusted && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                ⚙️ Disesuaikan
                              </span>
                            )}
                          </Label>

                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={
                                item.inputMode === "auto"
                                  ? "Harga akan terisi otomatis"
                                  : "Input harga manual"
                              }
                              value={item.jumlahPenjualan}
                              onChange={(e) => {
                                handleProductItemChange(
                                  item.id,
                                  "jumlahPenjualan",
                                  e.target.value
                                );

                                // Jika mode auto dan user mengubah harga, mark sebagai adjusted
                                if (
                                  item.inputMode === "auto" &&
                                  item.produkId
                                ) {
                                  const hargaOptions = getProductHargaOptions(
                                    item.produkId
                                  );
                                  let defaultPrice = 0;

                                  if (hargaOptions.length > 0) {
                                    const standarHarga = hargaOptions.find(
                                      (h) => h.tipeHarga === "STANDAR"
                                    );
                                    if (standarHarga) {
                                      defaultPrice = standarHarga.harga;
                                    } else {
                                      defaultPrice = hargaOptions[0].harga;
                                    }
                                  } else {
                                    defaultPrice = getProductPrice(
                                      item.produkId
                                    );
                                  }

                                  const newPrice = Number(e.target.value);
                                  handleProductItemChange(
                                    item.id,
                                    "isAdjusted",
                                    (newPrice !== defaultPrice).toString()
                                  );
                                }
                              }}
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
                              readOnly={false} // Pastikan input selalu bisa diisi/diubah
                              className={`${
                                errors[`jumlahPenjualan_${item.id}`]
                                  ? "border-red-500"
                                  : ""
                              } ${
                                item.inputMode === "auto" && !item.isAdjusted
                                  ? "bg-green-50 border-green-300"
                                  : ""
                              } 
                                ${
                                  item.inputMode === "auto" && item.isAdjusted
                                    ? "bg-orange-50 border-orange-300"
                                    : ""
                                }`}
                            />

                            {/* Tombol Reset ke Harga Default (hanya untuk mode auto) */}
                            {item.inputMode === "auto" &&
                              item.produkId &&
                              item.isAdjusted && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const hargaOptions = getProductHargaOptions(
                                      item.produkId
                                    );
                                    let defaultPrice = 0;

                                    if (hargaOptions.length > 0) {
                                      const standarHarga = hargaOptions.find(
                                        (h) => h.tipeHarga === "STANDAR"
                                      );
                                      if (standarHarga) {
                                        defaultPrice = standarHarga.harga;
                                      } else {
                                        defaultPrice = hargaOptions[0].harga;
                                      }
                                    } else {
                                      defaultPrice = getProductPrice(
                                        item.produkId
                                      );
                                    }

                                    handleProductItemChange(
                                      item.id,
                                      "jumlahPenjualan",
                                      defaultPrice.toString()
                                    );
                                    handleProductItemChange(
                                      item.id,
                                      "isAdjusted",
                                      "false"
                                    );
                                  }}
                                  className="px-3 whitespace-nowrap text-green-600 border-green-300 hover:bg-green-50"
                                  title="Reset ke harga default"
                                >
                                  🔄 Reset
                                </Button>
                              )}
                          </div>

                          {/* Info Harga dengan Status */}
                          {item.produkId && item.inputMode === "auto" && (
                            <div className="space-y-1">
                              {/* Harga Default */}
                              <p className="text-green-600 text-sm flex items-center">
                                <span className="mr-1">💰</span>
                                Harga standar:{" "}
                                {(() => {
                                  const hargaOptions = getProductHargaOptions(
                                    item.produkId
                                  );
                                  if (hargaOptions.length > 0) {
                                    const standarHarga = hargaOptions.find(
                                      (h) => h.tipeHarga === "STANDAR"
                                    );
                                    if (standarHarga) {
                                      return standarHarga.hargaFormatted;
                                    }
                                    return hargaOptions[0].hargaFormatted;
                                  }
                                  return getProductPrice(
                                    item.produkId
                                  ).toLocaleString("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                  });
                                })()}
                              </p>

                              {/* Status Adjustment */}
                              {item.isAdjusted && item.jumlahPenjualan && (
                                <p className="text-orange-600 text-sm flex items-center">
                                  <span className="mr-1">⚙️</span>
                                  Disesuaikan menjadi:{" "}
                                  {Number(item.jumlahPenjualan).toLocaleString(
                                    "id-ID",
                                    {
                                      style: "currency",
                                      currency: "IDR",
                                    }
                                  )}
                                  {(() => {
                                    const hargaOptions = getProductHargaOptions(
                                      item.produkId
                                    );
                                    let defaultPrice = 0;

                                    if (hargaOptions.length > 0) {
                                      const standarHarga = hargaOptions.find(
                                        (h) => h.tipeHarga === "STANDAR"
                                      );
                                      if (standarHarga) {
                                        defaultPrice = standarHarga.harga;
                                      } else {
                                        defaultPrice = hargaOptions[0].harga;
                                      }
                                    } else {
                                      defaultPrice = getProductPrice(
                                        item.produkId
                                      );
                                    }

                                    const currentPrice = Number(
                                      item.jumlahPenjualan
                                    );
                                    const difference =
                                      currentPrice - defaultPrice;
                                    const percentage = (
                                      (difference / defaultPrice) *
                                      100
                                    ).toFixed(1);

                                    if (difference > 0) {
                                      return (
                                        <span className="ml-1 text-red-600">
                                          (+
                                          {difference.toLocaleString("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                          })}{" "}
                                          / +{percentage}%)
                                        </span>
                                      );
                                    } else if (difference < 0) {
                                      return (
                                        <span className="ml-1 text-green-600">
                                          (
                                          {difference.toLocaleString("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                          })}{" "}
                                          / {percentage}%)
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Info Manual */}
                          {item.jumlahPenjualan &&
                            Number(item.jumlahPenjualan) > 0 &&
                            item.inputMode === "manual" && (
                              <p className="text-blue-600 text-sm flex items-center">
                                <span className="mr-1">✍️</span>
                                Manual:{" "}
                                {Number(item.jumlahPenjualan).toLocaleString(
                                  "id-ID",
                                  {
                                    style: "currency",
                                    currency: "IDR",
                                  }
                                )}{" "}
                                per unit
                              </p>
                            )}

                          {errors[`jumlahPenjualan_${item.id}`] && (
                            <p className="text-red-500 text-sm flex items-center">
                              <X className="h-3 w-3 mr-1" />
                              {errors[`jumlahPenjualan_${item.id}`]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Per Item Summary */}
                      {item.kuantitas &&
                        item.jumlahPenjualan &&
                        Number(item.kuantitas) > 0 &&
                        Number(item.jumlahPenjualan) > 0 && (
                          <div
                            className={`mt-3 p-3 rounded border ${
                              item.inputMode === "auto" && !item.isAdjusted
                                ? "bg-green-50 border-green-200"
                                : item.inputMode === "auto" && item.isAdjusted
                                ? "bg-orange-50 border-orange-200"
                                : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p
                                  className={`text-sm ${
                                    item.inputMode === "auto" &&
                                    !item.isAdjusted
                                      ? "text-green-800"
                                      : item.inputMode === "auto" &&
                                        item.isAdjusted
                                      ? "text-orange-800"
                                      : "text-blue-800"
                                  }`}
                                >
                                  {item.inputMode === "auto"
                                    ? item.isAdjusted
                                      ? "⚙️"
                                      : "🤖"
                                    : "✍️"}{" "}
                                  Harga per unit:{" "}
                                  <span className="font-semibold">
                                    {Number(
                                      item.jumlahPenjualan
                                    ).toLocaleString("id-ID", {
                                      style: "currency",
                                      currency: "IDR",
                                    })}
                                  </span>
                                  {item.inputMode === "auto" && (
                                    <span className="text-xs ml-1">
                                      (
                                      {item.isAdjusted ? "Auto+Adjust" : "Auto"}
                                      )
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div>
                                <p
                                  className={`text-sm ${
                                    item.inputMode === "auto" &&
                                    !item.isAdjusted
                                      ? "text-green-800"
                                      : item.inputMode === "auto" &&
                                        item.isAdjusted
                                      ? "text-orange-800"
                                      : "text-blue-800"
                                  }`}
                                >
                                  📊 Total nilai:{" "}
                                  <span className="font-semibold">
                                    {(
                                      Number(item.kuantitas) *
                                      Number(item.jumlahPenjualan)
                                    ).toLocaleString("id-ID", {
                                      style: "currency",
                                      currency: "IDR",
                                    })}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Tampilkan info adjustment jika ada */}
                            {item.inputMode === "auto" &&
                              item.isAdjusted &&
                              item.produkId && (
                                <div className="mt-2 pt-2 border-t border-orange-200">
                                  <p className="text-xs text-orange-700">
                                    💡 Harga disesuaikan dari standar{" "}
                                    {(() => {
                                      const hargaOptions =
                                        getProductHargaOptions(item.produkId);
                                      if (hargaOptions.length > 0) {
                                        const standarHarga = hargaOptions.find(
                                          (h) => h.tipeHarga === "STANDAR"
                                        );
                                        if (standarHarga) {
                                          return standarHarga.hargaFormatted;
                                        }
                                        return hargaOptions[0].hargaFormatted;
                                      }
                                      return getProductPrice(
                                        item.produkId
                                      ).toLocaleString("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                      });
                                    })()}
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              {(totalPenjualan > 0 || totalKuantitas > 0) && (
                <div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-800">
                        Total Kuantitas:
                      </span>
                      <span className="text-lg font-bold text-green-800">
                        📦 {totalKuantitas} unit
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-800">
                        Total Harga Satuan:
                      </span>
                      <span className="text-lg font-bold text-green-800">
                        {totalPenjualan.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-800">
                        Grand Total Nilai:
                      </span>
                      <span className="text-xl font-bold text-green-800">
                        {productItems
                          .reduce((sum, item) => {
                            return (
                              sum +
                              Number(item.kuantitas) *
                                Number(item.jumlahPenjualan)
                            );
                          }, 0)
                          .toLocaleString("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2 text-center">
                    {productItems.length} jenis produk • Tidak ada duplikasi
                  </p>
                </div>
              )}
            </div>

            {/* General error message */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm flex items-center">
                  <X className="h-4 w-4 mr-2" />
                  {errors.general}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 btn-primary h-12 text-lg flex items-center justify-center gap-2 relative overflow-hidden"
              >
                {isSubmitting ? (
                  <>
                    <div className="absolute inset-0 bg-blue-700 animate-pulse"></div>
                    <LoadingSpinner size="sm" color="blue" />
                    <span className="relative z-10">
                      Menyimpan {productItems.length} Produk...
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Simpan {productItems.length} Produk ({totalKuantitas} unit)
                  </>
                )}
              </Button>

              <Link href="/sales" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full h-12 text-lg flex items-center justify-center gap-2"
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
