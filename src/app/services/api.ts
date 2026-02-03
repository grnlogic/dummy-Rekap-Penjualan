import { ReactNode } from "react";
import { handleApiError } from "../utils/apiErrorHandler";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Interface sesuai dengan struktur backend Java - Fix types for proper display
export interface PenjualanData {
  id: number;
  tanggal: string | number | Date;
  nama_produk: string; // Change from ReactNode to string for proper display
  jumlah: number; // Change from ReactNode to number
  harga_satuan: number; // Change from any to number
  total_harga: number; // Change from any to number
  periode?: PeriodeData;
  sales?: SalesData;
  hari?: HariData;
  jalur?: JalurData;
  produk?: ProdukData;
  minggu?: MingguData;
  jumlahPenjualan?: number;
  kuantitas?: number;
  tanggalTransaksi?: string; // ← TAMBAHKAN INI
  keterangan?: string;
  createdAt?: string;
  updatedAt?: string;
  tipeTransaksi?: string; // Tambahan agar linter tidak error
}

// Interface untuk request body (sesuai dengan backend DTO)
export interface PenjualanRequest {
  periodeId: number;
  salesId: number;
  hariId: number;
  jalurId?: number;
  produkId: number;
  mingguId: number;
  jumlahPenjualan: number;
  kuantitas: number;
  tanggalTransaksi?: string;
  keterangan?: string;
}

export interface TotalProdukData {
  namaProduk: string;
  totalPenjualan: number;
}

export interface MasterData {
  id: number;
  nama: string;
}

export interface ProdukData extends MasterData {
  namaProduk?: string;
  nama_produk?: string; // Backend returns snake_case
}

export interface SalesData extends MasterData {
  namaSales?: string;
  nama_sales?: string; // Backend returns snake_case
}

export interface PeriodeData extends MasterData {
  namaPeriode?: string;
  nama_periode?: string; // Backend returns snake_case
}

export interface HariData extends MasterData {
  namaHari?: string;
  nama_hari?: string; // Backend returns snake_case
}

export interface JalurData extends MasterData {
  namaJalur?: string;
  nama_jalur?: string; // Backend returns snake_case
}

export interface MingguData extends MasterData {
  namaMinggu?: string;
  nama_minggu?: string; // Backend returns snake_case
}

// Interface untuk ProdukHarga
export interface ProdukHargaData {
  id: number;
  produkId: number;
  namaProduk: string;
  tipeHarga: string;
  tipeHargaDescription: string;
  harga: number;
  hargaFormatted: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemStatus {
  status: string;
  database: string;
  timestamp: string;
  uptime?: string;
  version?: string;
  environment?: string;
  error?: string;
}

// Tambahkan interface baru
export interface TotalMingguData {
  namaMinggu: string;
  totalPenjualan: number;
  jumlahTransaksi?: number;
}

export interface TotalMingguSalesData {
  id(id: any): unknown;
  namaMinggu: string;
  namaSales: string;
  totalPenjualan: number;
  jumlahTransaksi: number;
}

// Add interface for data statistics
export interface DataStatistics {
  totalPenjualan: number;
  totalProduk: number;
  totalSales: number;
  totalTransaksi: number;
  recentActivity?: any[];
}

export interface OnlineUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isOnline: boolean;
  lastActivity: string;
  lastLoginTime: string;
  sessionId: string;
}

export interface OnlineUsersResponse {
  count: number;
  timestamp: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isOnline?: boolean;
  lastActivity?: string;
  lastLoginTime?: string;
  sessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

class ApiService {
  getAllSalespeople(): any {
    throw new Error("Method not implemented.");
  }
  private baseURL: string;

  constructor() {
    if (!API_BASE_URL) {
      throw new Error(
        "NEXT_PUBLIC_API_BASE_URL environment variable is required"
      );
    }
    this.baseURL = API_BASE_URL;
  }

  private getAuthHeaders(): HeadersInit {
    // Gunakan authService untuk mendapatkan token yang benar
    let token = null;

    if (typeof window !== "undefined") {
      // Coba ambil dari sessionId terlebih dahulu (sesuai dengan authService)
      token = localStorage.getItem("sessionId");

      // Jika tidak ada, coba ambil dari authToken (fallback)
      if (
        !token ||
        token === "null" ||
        token === "undefined" ||
        token.trim() === ""
      ) {
        token = localStorage.getItem("authToken");
      }

      // Debug token
    }

    if (
      !token ||
      token === "null" ||
      token === "undefined" ||
      token.trim() === ""
    ) {
      console.warn("🔍 API Service - No valid token found");

      // ✅ REDIRECT KE LOGIN JIKA TIDAK ADA TOKEN SAAT AKSES API
      if (typeof window !== "undefined" && !window.location.pathname.includes('/auth/login')) {
        console.log("🚨 No token available for API call, redirecting to login");
        import("../utils/authUtils").then(({ redirectToLogin }) => {
          redirectToLogin("No token available for API call");
        });
      }

      return {
        "Content-Type": "application/json",
      };
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.trim()}`,
    };
  }

  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<T> {
    // --- MOCK INTERCEPTOR FOR PORTFOLIO ---
    console.log(`[MOCK API] Intercepting request to: ${endpoint}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (endpoint.includes("/penjualan") && !endpoint.includes("total")) {
      // Helper to generate dummy data
      const generateDummyData = () => {
        const data: any[] = [];
        const products = [
          { id: 1, name: "Kopi Arabika", price: 15000 },
          { id: 2, name: "Kopi Robusta", price: 12000 },
          { id: 3, name: "Teh Hijau", price: 8000 },
          { id: 4, name: "Coklat Bubuk", price: 25000 },
          { id: 5, name: "Susu Evaporasi", price: 18000 },
        ];
        const salesPeople = [
          { id: 1, name: "Budi Sales" },
          { id: 2, name: "Ani Sales" },
          { id: 3, name: "Joko Marketing" },
        ];
        const periods = [
          "JANUARI 2024", "FEBRUARI 2024", "MARET 2024",
          "APRIL 2024", "MEI 2024", "JUNI 2024"
        ];

        let idCounter = 1;

        // Generate data for each month
        periods.forEach((period, monthIndex) => {
          // 1. Normal Sales (Random 5-10 per month)
          const numSales = 5 + Math.floor(Math.random() * 5);
          for (let i = 0; i < numSales; i++) {
            const prod = products[Math.floor(Math.random() * products.length)];
            const salesPerson = salesPeople[Math.floor(Math.random() * salesPeople.length)];
            const qty = 10 + Math.floor(Math.random() * 50);

            data.push({
              id: idCounter++,
              tanggal: `2024-0${monthIndex + 1}-15`,
              tanggalTransaksi: `2024-0${monthIndex + 1}-15`,
              nama_produk: prod.name,
              jumlah: qty,
              harga_satuan: prod.price,
              total_harga: qty * prod.price,
              kuantitas: qty,
              jumlahPenjualan: prod.price, // In this code base, this field seems to be price per unit sometimes based on context usage
              tipeTransaksi: "PENJUALAN",
              periode: { id: monthIndex + 1, namaPeriode: period },
              produk: { id: prod.id, namaProduk: prod.name },
              sales: { id: salesPerson.id, namaSales: salesPerson.name },
              jalur: { id: 1, namaJalur: "Retail" },
            });
          }

          // 2. Returns (Random 1-3 per month)
          if (Math.random() > 0.3) {
            const numReturns = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < numReturns; i++) {
              const prod = products[Math.floor(Math.random() * products.length)];
              const salesPerson = salesPeople[Math.floor(Math.random() * salesPeople.length)];
              const qty = 1 + Math.floor(Math.random() * 5); // Smaller qty for returns

              data.push({
                id: idCounter++,
                tanggal: `2024-0${monthIndex + 1}-20`,
                tanggalTransaksi: `2024-0${monthIndex + 1}-20`,
                nama_produk: prod.name,
                jumlah: qty,
                harga_satuan: prod.price,
                total_harga: qty * prod.price,
                kuantitas: qty,
                jumlahPenjualan: prod.price,
                tipeTransaksi: "RETURN",
                periode: { id: monthIndex + 1, namaPeriode: period },
                produk: { id: prod.id, namaProduk: prod.name },
                sales: { id: salesPerson.id, namaSales: salesPerson.name },
                jalur: { id: 1, namaJalur: "Retail" },
                keterangan: "Kemasan rusak",
              });
            }
          }

          // 3. BS / Barang Sisa (Random 0-2 per month)
          if (Math.random() > 0.5) {
            const numBS = Math.floor(Math.random() * 2);
            for (let i = 0; i < numBS; i++) {
              const prod = products[Math.floor(Math.random() * products.length)];
              const qty = 1 + Math.floor(Math.random() * 3);

              data.push({
                id: idCounter++,
                tanggal: `2024-0${monthIndex + 1}-28`,
                tanggalTransaksi: `2024-0${monthIndex + 1}-28`,
                nama_produk: prod.name,
                jumlah: qty,
                harga_satuan: prod.price,
                total_harga: qty * prod.price,
                kuantitas: qty,
                jumlahPenjualan: prod.price,
                tipeTransaksi: "BS",
                periode: { id: monthIndex + 1, namaPeriode: period },
                produk: { id: prod.id, namaProduk: prod.name },
                sales: { id: 1, namaSales: "Gudang Utama" }, // BS usually internal
                jalur: { id: 2, namaJalur: "Internal" },
                keterangan: "Expired date check",
              });
            }
          }
        });

        return data;
      };

      return generateDummyData() as any;
    }

    if (endpoint.includes("/master/produk") || endpoint === "/produk") {
      return [
        { id: 1, nama: "Kopi Arabika", namaProduk: "Kopi Arabika" },
        { id: 2, nama: "Kopi Robusta", namaProduk: "Kopi Robusta" },
        { id: 3, nama: "Teh Hijau", namaProduk: "Teh Hijau" },
      ] as any;
    }

    if (endpoint.includes("/master/sales")) {
      return [
        { id: 1, nama: "Budi Sales", namaSales: "Budi Sales" },
        { id: 2, nama: "Ani Sales", namaSales: "Ani Sales" },
      ] as any;
    }

    if (endpoint.includes("/total-per-produk")) {
      return [
        { namaProduk: "Kopi Arabika", totalPenjualan: 1500000 },
        { namaProduk: "Kopi Robusta", totalPenjualan: 1200000 },
        { namaProduk: "Teh Hijau", totalPenjualan: 800000 },
      ] as any;
    }

    if (endpoint.includes("/total-per-minggu")) {
      return [
        { namaMinggu: "Minggu 1", totalPenjualan: 5000000 },
        { namaMinggu: "Minggu 2", totalPenjualan: 6000000 },
      ] as any;
    }

    if (endpoint.includes("/health")) {
      return { status: "UP", database: "connected (dummy)" } as any;
    }

    // Default fallback for other endpoints to prevent crash
    console.warn(`[MOCK API] No specific mock for ${endpoint}, returning empty object/array`);
    return [] as any;

    /* 
    // REAL FETCH COMMENTED OUT
    const url = `${this.baseURL}${endpoint}`;

    const authHeaders = this.getAuthHeaders();
    const headers = {
      ...authHeaders,
      ...options.headers,
    } as Record<string, string>;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      // ... (rest of the original code)
    }
    */
  }

  // ========== HEALTH & SYSTEM STATUS ==========
  async getSystemStatus(): Promise<SystemStatus> {
    return {
      status: "UP",
      database: "connected (dummy)",
      timestamp: new Date().toISOString(),
    };
  }

  async pingBackend(): Promise<string> {
    // const response = await fetch(`${this.baseURL}/health/ping`);
    // return response.text();
    return "pong (dummy)";
  }

  // ✅ TAMBAH METHOD UNTUK TEST AUTHENTICATION
  async testAuthentication(): Promise<boolean> {
    console.log("🔍 Testing authentication (DUMMY MODE): Always true");
    return true;
  }

  // ✅ TAMBAH METHOD UNTUK TEST ENDPOINT TANPA AUTH
  async testPublicEndpoint(): Promise<boolean> {
    console.log("🔍 Public endpoint test (DUMMY MODE): Always true");
    return true;
  }

  // ========== PENJUALAN ENDPOINTS ==========
  async getAllPenjualan(): Promise<PenjualanData[]> {
    const data = await this.fetchApi<any[]>("/penjualan");

    // Map snake_case dari backend ke camelCase untuk frontend
    return data.map(item => {
      // Parse nested objects dengan snake_case ke camelCase
      const periode = item.periode ? {
        id: typeof item.periode.id === 'string' ? parseInt(item.periode.id) : item.periode.id,
        nama: item.periode.nama_periode || item.periode.namaPeriode || '',
        namaPeriode: item.periode.nama_periode || item.periode.namaPeriode
      } : undefined;

      const sales = item.sales ? {
        id: typeof item.sales.id === 'string' ? parseInt(item.sales.id) : item.sales.id,
        nama: item.sales.nama_sales || item.sales.namaSales || '',
        namaSales: item.sales.nama_sales || item.sales.namaSales
      } : undefined;

      const hari = item.hari ? {
        id: typeof item.hari.id === 'string' ? parseInt(item.hari.id) : item.hari.id,
        nama: item.hari.nama_hari || item.hari.namaHari || '',
        namaHari: item.hari.nama_hari || item.hari.namaHari
      } : undefined;

      const jalur = item.jalur ? {
        id: typeof item.jalur.id === 'string' ? parseInt(item.jalur.id) : item.jalur.id,
        nama: item.jalur.nama_jalur || item.jalur.namaJalur || '',
        namaJalur: item.jalur.nama_jalur || item.jalur.namaJalur
      } : undefined;

      const produk = item.produk ? {
        id: typeof item.produk.id === 'string' ? parseInt(item.produk.id) : item.produk.id,
        nama: item.produk.nama_produk || item.produk.namaProduk || '',
        namaProduk: item.produk.nama_produk || item.produk.namaProduk
      } : undefined;

      const minggu = item.minggu ? {
        id: typeof item.minggu.id === 'string' ? parseInt(item.minggu.id) : item.minggu.id,
        nama: item.minggu.nama_minggu || item.minggu.namaMinggu || '',
        namaMinggu: item.minggu.nama_minggu || item.minggu.namaMinggu
      } : undefined;

      return {
        id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
        periode,
        sales,
        hari,
        jalur,
        produk,
        minggu,
        // Map field level utama
        jumlahPenjualan: Number(item.jumlah_penjualan || item.jumlahPenjualan || 0),
        kuantitas: Number(item.kuantitas || 1),
        tanggalTransaksi: item.tanggal_transaksi || item.tanggalTransaksi,
        tipeTransaksi: item.tipe_transaksi || item.tipeTransaksi,
        keterangan: item.keterangan,
        // Legacy fields for compatibility
        tanggal: item.tanggal_transaksi || item.tanggalTransaksi || item.tanggal,
        nama_produk: produk?.namaProduk || '',
        jumlah: Number(item.kuantitas || 1),
        harga_satuan: Number(item.jumlah_penjualan || 0),
        total_harga: Number(item.kuantitas || 1) * Number(item.jumlah_penjualan || 0)
      };
    });
  }

  async getPenjualanById(id: number): Promise<PenjualanData> {
    if (!id && id !== 0) {
      throw new Error(`ID parameter is required, got: ${id}`);
    }

    if (isNaN(id)) {
      throw new Error(`ID must be a number, got: ${id} (${typeof id})`);
    }

    if (id <= 0) {
      throw new Error(`ID must be positive, got: ${id}`);
    }

    const item = await this.fetchApi<any>(`/penjualan/${id}`);

    // Apply same mapping as getAllPenjualan
    const periode = item.periode ? {
      id: typeof item.periode.id === 'string' ? parseInt(item.periode.id) : item.periode.id,
      nama: item.periode.nama_periode || item.periode.namaPeriode || '',
      namaPeriode: item.periode.nama_periode || item.periode.namaPeriode
    } : undefined;

    const sales = item.sales ? {
      id: typeof item.sales.id === 'string' ? parseInt(item.sales.id) : item.sales.id,
      nama: item.sales.nama_sales || item.sales.namaSales || '',
      namaSales: item.sales.nama_sales || item.sales.namaSales
    } : undefined;

    const hari = item.hari ? {
      id: typeof item.hari.id === 'string' ? parseInt(item.hari.id) : item.hari.id,
      nama: item.hari.nama_hari || item.hari.namaHari || '',
      namaHari: item.hari.nama_hari || item.hari.namaHari
    } : undefined;

    const jalur = item.jalur ? {
      id: typeof item.jalur.id === 'string' ? parseInt(item.jalur.id) : item.jalur.id,
      nama: item.jalur.nama_jalur || item.jalur.namaJalur || '',
      namaJalur: item.jalur.nama_jalur || item.jalur.namaJalur
    } : undefined;

    const produk = item.produk ? {
      id: typeof item.produk.id === 'string' ? parseInt(item.produk.id) : item.produk.id,
      nama: item.produk.nama_produk || item.produk.namaProduk || '',
      namaProduk: item.produk.nama_produk || item.produk.namaProduk
    } : undefined;

    const minggu = item.minggu ? {
      id: typeof item.minggu.id === 'string' ? parseInt(item.minggu.id) : item.minggu.id,
      nama: item.minggu.nama_minggu || item.minggu.namaMinggu || '',
      namaMinggu: item.minggu.nama_minggu || item.minggu.namaMinggu
    } : undefined;

    return {
      id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
      periode,
      sales,
      hari,
      jalur,
      produk,
      minggu,
      jumlahPenjualan: Number(item.jumlah_penjualan || item.jumlahPenjualan || 0),
      kuantitas: Number(item.kuantitas || 1),
      tanggalTransaksi: item.tanggal_transaksi || item.tanggalTransaksi,
      tipeTransaksi: item.tipe_transaksi || item.tipeTransaksi,
      keterangan: item.keterangan,
      tanggal: item.tanggal_transaksi || item.tanggalTransaksi || item.tanggal,
      nama_produk: produk?.namaProduk || '',
      jumlah: Number(item.kuantitas || 1),
      harga_satuan: Number(item.jumlah_penjualan || 0),
      total_harga: Number(item.kuantitas || 1) * Number(item.jumlah_penjualan || 0)
    };
  }

  async createPenjualanWithDTO(data: PenjualanRequest): Promise<PenjualanData> {
    return this.fetchApi("/penjualan/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createPenjualan(data: PenjualanRequest): Promise<PenjualanData> {
    // ✅ ALWAYS use DTO endpoint for consistency
    return this.createPenjualanWithDTO(data);
  }

  async updatePenjualan(
    id: number,
    data: PenjualanRequest
  ): Promise<PenjualanData> {
    if (!id && id !== 0) {
      throw new Error(`ID parameter is required for update, got: ${id}`);
    }

    if (isNaN(id)) {
      throw new Error(`Update ID must be a number, got: ${id} (${typeof id})`);
    }

    if (id <= 0) {
      throw new Error(`Update ID must be positive, got: ${id}`);
    }

    // ✅ Use DTO endpoint for consistency
    return this.fetchApi(`/penjualan/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePenjualan(id: number): Promise<void> {
    if (!id && id !== 0) {
      throw new Error(`ID parameter is required for delete, got: ${id}`);
    }

    if (isNaN(id)) {
      throw new Error(`Delete ID must be a number, got: ${id} (${typeof id})`);
    }

    if (id <= 0) {
      throw new Error(`Delete ID must be positive, got: ${id}`);
    }

    try {
      await this.fetchApi(`/penjualan/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      throw error;
    }
  }

  async getTotalPenjualanPerProduk(): Promise<TotalProdukData[]> {
    return this.fetchApi("/penjualan/total-per-produk");
  }

  async getTotalPenjualanPerMinggu(): Promise<TotalMingguData[]> {
    return this.fetchApi("/penjualan/total-per-minggu");
  }

  async getTotalPenjualanPerMingguSales(): Promise<TotalMingguSalesData[]> {
    return this.fetchApi("/penjualan/total-per-minggu-dan-sales");
  }

  async getPenjualanByDateRange(
    start: string,
    end: string
  ): Promise<PenjualanData[]> {
    const data = await this.fetchApi<any[]>(`/penjualan/filterByDate?start=${start}&end=${end}`);

    // 🔥 CRITICAL: Apply same mapping as getAllPenjualan to handle snake_case from backend
    return data.map(item => {
      // Parse nested objects dengan snake_case ke camelCase
      const periode = item.periode ? {
        id: typeof item.periode.id === 'string' ? parseInt(item.periode.id) : item.periode.id,
        nama: item.periode.nama_periode || item.periode.namaPeriode || '',
        namaPeriode: item.periode.nama_periode || item.periode.namaPeriode
      } : undefined;

      const sales = item.sales ? {
        id: typeof item.sales.id === 'string' ? parseInt(item.sales.id) : item.sales.id,
        nama: item.sales.nama_sales || item.sales.namaSales || '',
        namaSales: item.sales.nama_sales || item.sales.namaSales
      } : undefined;

      const hari = item.hari ? {
        id: typeof item.hari.id === 'string' ? parseInt(item.hari.id) : item.hari.id,
        nama: item.hari.nama_hari || item.hari.namaHari || '',
        namaHari: item.hari.nama_hari || item.hari.namaHari
      } : undefined;

      const jalur = item.jalur ? {
        id: typeof item.jalur.id === 'string' ? parseInt(item.jalur.id) : item.jalur.id,
        nama: item.jalur.nama_jalur || item.jalur.namaJalur || '',
        namaJalur: item.jalur.nama_jalur || item.jalur.namaJalur
      } : undefined;

      const produk = item.produk ? {
        id: typeof item.produk.id === 'string' ? parseInt(item.produk.id) : item.produk.id,
        nama: item.produk.nama_produk || item.produk.namaProduk || '',
        namaProduk: item.produk.nama_produk || item.produk.namaProduk
      } : undefined;

      const minggu = item.minggu ? {
        id: typeof item.minggu.id === 'string' ? parseInt(item.minggu.id) : item.minggu.id,
        nama: item.minggu.nama_minggu || item.minggu.namaMinggu || '',
        namaMinggu: item.minggu.nama_minggu || item.minggu.namaMinggu
      } : undefined;

      return {
        id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
        periode,
        sales,
        hari,
        jalur,
        produk,
        minggu,
        // Map field level utama
        jumlahPenjualan: Number(item.jumlah_penjualan || item.jumlahPenjualan || 0),
        kuantitas: Number(item.kuantitas || 1),
        tanggalTransaksi: item.tanggal_transaksi || item.tanggalTransaksi,
        tipeTransaksi: item.tipe_transaksi || item.tipeTransaksi,
        keterangan: item.keterangan,
        // Legacy fields for compatibility
        tanggal: item.tanggal_transaksi || item.tanggalTransaksi || item.tanggal,
        nama_produk: produk?.namaProduk || '',
        jumlah: Number(item.kuantitas || 1),
        harga_satuan: Number(item.jumlah_penjualan || 0),
        total_harga: Number(item.kuantitas || 1) * Number(item.jumlah_penjualan || 0)
      };
    });
  }

  // ========== MASTER DATA ENDPOINTS ==========
  // Sesuaikan dengan endpoint backend yang benar
  async getAllSales(): Promise<SalesData[]> {
    const data = await this.fetchApi<any[]>("/master/sales");
    // Transform snake_case to camelCase
    return data.map(item => ({
      id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
      nama: item.nama_sales || item.namaSales || '',
      namaSales: item.nama_sales || item.namaSales || '',
      nama_sales: item.nama_sales
    }));
  }

  async getSalesById(id: number): Promise<SalesData> {
    return this.fetchApi(`/master/sales/${id}`); // Gunakan endpoint MasterDataController yang sudah diperbaiki
  }

  async createSales(data: Partial<SalesData>): Promise<SalesData> {
    return this.fetchApi("/master/sales", {
      // Gunakan endpoint MasterDataController yang sudah diperbaiki
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSales(id: number, data: Partial<SalesData>): Promise<SalesData> {
    return this.fetchApi(`/master/sales/${id}`, {
      // Gunakan endpoint MasterDataController yang sudah diperbaiki
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSales(id: number): Promise<void> {
    return this.fetchApi(`/master/sales/${id}`, {
      // Gunakan endpoint MasterDataController yang sudah diperbaiki
      method: "DELETE",
    });
  }

  async getAllProduk(): Promise<ProdukData[]> {
    const data = await this.fetchApi<any[]>("/produk");
    // Transform snake_case to camelCase
    return data.map(item => ({
      id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
      nama: item.nama_produk || item.namaProduk || '',
      namaProduk: item.nama_produk || item.namaProduk || '',
      nama_produk: item.nama_produk
    }));
  }

  async getProdukById(id: number): Promise<ProdukData> {
    return this.fetchApi(`/produk/${id}`);
  }

  async createProduk(data: Partial<ProdukData>): Promise<ProdukData> {
    return this.fetchApi("/produk", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProduk(
    id: number,
    data: Partial<ProdukData>
  ): Promise<ProdukData> {
    return this.fetchApi(`/produk/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProduk(id: number): Promise<void> {
    await this.fetchApi(`/produk/${id}`, {
      method: "DELETE",
    });
  }

  async getAllJalur(): Promise<JalurData[]> {
    const data = await this.fetchApi<any[]>("/master/jalur");
    // Transform snake_case to camelCase
    return data.map(item => ({
      id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
      nama: item.nama_jalur || item.namaJalur || '',
      namaJalur: item.nama_jalur || item.namaJalur || '',
      nama_jalur: item.nama_jalur
    }));
  }

  async getJalurById(id: number): Promise<JalurData> {
    return this.fetchApi(`/master/jalur/${id}`);
  }

  async createJalur(data: Partial<JalurData>): Promise<JalurData> {
    return this.fetchApi("/master/jalur", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateJalur(id: number, data: Partial<JalurData>): Promise<JalurData> {
    return this.fetchApi(`/master/jalur/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteJalur(id: number): Promise<void> {
    return this.fetchApi(`/master/jalur/${id}`, {
      method: "DELETE",
    });
  }

  async getAllMinggu(): Promise<MingguData[]> {
    const data = await this.fetchApi<any[]>("/master/minggu");
    // Transform snake_case to camelCase
    return data.map(item => ({
      id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
      nama: item.nama_minggu || item.namaMinggu || '',
      namaMinggu: item.nama_minggu || item.namaMinggu || '',
      nama_minggu: item.nama_minggu
    }));
  }

  async getMingguById(id: number): Promise<MingguData> {
    return this.fetchApi(`/master/minggu/${id}`);
  }

  async createMinggu(data: Partial<MingguData>): Promise<MingguData> {
    return this.fetchApi("/master/minggu", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMinggu(id: number, data: Partial<MingguData>): Promise<MingguData> {
    return this.fetchApi(`/master/minggu/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMinggu(id: number): Promise<void> {
    return this.fetchApi(`/master/minggu/${id}`, {
      method: "DELETE",
    });
  }

  async getAllHari(): Promise<HariData[]> {
    const data = await this.fetchApi<any[]>("/master/hari");
    // Transform snake_case to camelCase
    return data.map(item => ({
      id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
      nama: item.nama_hari || item.namaHari || '',
      namaHari: item.nama_hari || item.namaHari || '',
      nama_hari: item.nama_hari
    }));
  }

  async getHariById(id: number): Promise<HariData> {
    return this.fetchApi(`/master/hari/${id}`);
  }

  async createHari(data: Partial<HariData>): Promise<HariData> {
    return this.fetchApi("/master/hari", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateHari(id: number, data: Partial<HariData>): Promise<HariData> {
    return this.fetchApi(`/master/hari/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteHari(id: number): Promise<void> {
    return this.fetchApi(`/master/hari/${id}`, {
      method: "DELETE",
    });
  }

  async getAllPeriode(): Promise<PeriodeData[]> {
    const data = await this.fetchApi<any[]>("/master/periode");
    // Transform snake_case to camelCase
    return data.map(item => ({
      id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
      nama: item.nama_periode || item.namaPeriode || '',
      namaPeriode: item.nama_periode || item.namaPeriode || '',
      nama_periode: item.nama_periode,
      createdAt: item.createdAt || item.created_at
    }));
  }

  async getPeriodeById(id: number): Promise<PeriodeData> {
    return this.fetchApi(`/master/periode/${id}`);
  }

  async createPeriode(data: Partial<PeriodeData>): Promise<PeriodeData> {
    return this.fetchApi("/master/periode", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePeriode(id: number, data: Partial<PeriodeData>): Promise<PeriodeData> {
    return this.fetchApi(`/master/periode/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePeriode(id: number): Promise<void> {
    return this.fetchApi(`/master/periode/${id}`, {
      method: "DELETE",
    });
  }

  // ========== PRODUK HARGA ==========
  async getAllProdukHarga(): Promise<ProdukHargaData[]> {
    const data = await this.fetchApi<any[]>("/produk-harga/frontend");
    console.log("📊 Raw data from backend:", data);

    // Transform snake_case to camelCase dan tambahkan field yang dibutuhkan
    return data.map(item => {
      const transformed = {
        id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
        produkId: typeof item.produk_id === 'string' ? parseInt(item.produk_id) : (item.produk_id || item.produkId),
        namaProduk: item.produk?.nama_produk || item.produk?.namaProduk || item.namaProduk || '',
        tipeHarga: item.tipe_harga || item.tipeHarga || '',
        tipeHargaDescription: item.tipe_harga || item.tipeHarga || '',
        harga: Number(item.harga || 0),
        hargaFormatted: `Rp ${Number(item.harga || 0).toLocaleString('id-ID')}`,
        isActive: item.is_active !== undefined ? item.is_active : item.isActive,
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt
      };
      console.log("✅ Transformed item:", transformed);
      return transformed;
    });
  }

  async getHargaByProdukAndTipe(
    produkId: number,
    tipeHarga: string
  ): Promise<{
    success: boolean;
    harga?: number;
    hargaFormatted?: string;
    message?: string;
  }> {
    return this.fetchApi(`/produk-harga/produk/${produkId}/tipe/${tipeHarga}`);
  }

  async getStandarHargaByProduk(produkId: number): Promise<{
    success: boolean;
    harga?: number;
    hargaFormatted?: string;
    message?: string;
  }> {
    return this.fetchApi(`/produk-harga/produk/${produkId}/standar`);
  }

  async getHargaWithFallback(
    produkId: number,
    preferredTipe: string = "STANDAR"
  ): Promise<{
    success: boolean;
    harga?: number;
    hargaFormatted?: string;
    tipeHarga?: string;
    message?: string;
  }> {
    return this.fetchApi(
      `/produk-harga/produk/${produkId}/harga?preferredTipe=${preferredTipe}`
    );
  }

  // ProdukHarga CRUD
  async createProdukHarga(
    data: Partial<ProdukHargaData>
  ): Promise<ProdukHargaData> {
    return this.fetchApi<ProdukHargaData>("/produk-harga", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async updateProdukHarga(
    id: number,
    data: Partial<ProdukHargaData>
  ): Promise<ProdukHargaData> {
    return this.fetchApi<ProdukHargaData>(`/produk-harga/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteProdukHarga(id: number): Promise<void> {
    await this.fetchApi(`/produk-harga/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
  }

  // ========== FILE UPLOAD ==========
  async uploadFile(file: File): Promise<string> {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    const formData = new FormData();
    formData.append("file", file);

    const url = `${this.baseURL}/penjualan/upload`;

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.text();
  }

  // ========== USER ACTIVITY ENDPOINTS ==========
  async getOnlineUsers(): Promise<OnlineUser[]> {
    try {
      const url = `${this.baseURL}/user-activity/online-users`;
      const headers = this.getAuthHeaders();

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const users: OnlineUser[] = await response.json();
      return users;
    } catch (error) {
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const url = `${this.baseURL}/users`;
      const headers = this.getAuthHeaders();

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const users: User[] = await response.json();
      return users;
    } catch (error) {
      throw error;
    }
  }

  async getOnlineUserCount(): Promise<OnlineUsersResponse> {
    return this.fetchApi("/user-activity/online-count");
  }

  async updateUserActivity(userId: number): Promise<void> {
    await this.fetchApi(`/user-activity/update-activity/${userId}`, {
      method: "POST",
    });
  }

  async sendHeartbeat(sessionId: string): Promise<void> {
    await this.fetchApi("/user-activity/heartbeat", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
  }

  async forceLogout(sessionId: string): Promise<void> {
    await this.fetchApi(`/user-activity/force-logout/${sessionId}`, {
      method: "POST",
    });
  }

  // ========== UTILITY METHODS ==========
  async checkConnection(): Promise<boolean> {
    try {
      await this.pingBackend();
      return true;
    } catch (error) {
      return false;
    }
  }

  async testAllEndpoints(): Promise<void> {
    const results = {
      health: false,
      penjualan: false,
      masterData: {
        sales: false,
        produk: false,
        periode: false,
        hari: false,
        jalur: false,
        minggu: false,
      },
    };

    try {
      try {
        await this.getSystemStatus();
        results.health = true;
      } catch (error) {
        // Silent fail
      }

      try {
        await this.getAllPenjualan();
        results.penjualan = true;
      } catch (error) {
        // Silent fail
      }

      const masterTests = [
        { name: "sales", method: () => this.getAllSales() },
        { name: "produk", method: () => this.getAllProduk() },
        { name: "periode", method: () => this.getAllPeriode() },
        { name: "hari", method: () => this.getAllHari() },
        { name: "jalur", method: () => this.getAllJalur() },
        { name: "minggu", method: () => this.getAllMinggu() },
      ];

      for (const test of masterTests) {
        try {
          await test.method();
          results.masterData[test.name as keyof typeof results.masterData] =
            true;
        } catch (error) {
          // Silent fail
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  async getDataStatistics(): Promise<DataStatistics> {
    try {
      const [penjualan, produk, sales] = await Promise.all([
        this.getAllPenjualan(),
        this.getAllProduk(),
        this.getAllSales(),
      ]);

      const statistics = {
        totalPenjualan: penjualan.reduce(
          (sum, item) => sum + (item.jumlahPenjualan || 0),
          0
        ),
        totalProduk: produk.length,
        totalSales: sales.length,
        totalTransaksi: penjualan.length,
        recentActivity: penjualan
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.tanggal).getTime() -
              new Date(a.createdAt || a.tanggal).getTime()
          )
          .slice(0, 5),
      };

      return statistics;
    } catch (error) {
      return {
        totalPenjualan: 0,
        totalProduk: 0,
        totalSales: 0,
        totalTransaksi: 0,
        recentActivity: [],
      };
    }
  }

  async exportAllPenjualan(): Promise<Blob> {
    try {
      const url = `${this.baseURL}/penjualan/export`;
      const headers = this.getAuthHeaders();

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      throw error;
    }
  }

  async deleteAllPenjualan(): Promise<{ deletedCount: number }> {
    try {
      const url = `${this.baseURL}/penjualan/delete-all`;
      const headers = this.getAuthHeaders();

      const response = await fetch(url, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Delete-all failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

// Fix variable redeclaration - only declare once
const apiService = new ApiService();
export { apiService };
