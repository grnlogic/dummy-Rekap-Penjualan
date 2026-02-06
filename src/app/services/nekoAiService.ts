import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Dummy responses untuk mode tanpa API key (deploy static / Vercel tanpa env)
const DUMMY_RESPONSES: Record<string, string> = {
  default:
    "🐱 Nyaa~ Ini adalah mode demo. NEKO AI siap membantu analisis data penjualan!\n\nBerdasarkan data dummy:\n- Total penjualan menunjukkan tren positif\n- Kopi Arabika & Robusta paling laris\n- Sales Budi dan Ani berkontribusi besar\n\nUntuk analisis AI real-time, set NEXT_PUBLIC_GEMINI_API_KEY di environment.",
  analisis:
    "🐱 Berdasarkan data rekap penjualan (dummy):\n- Revenue utama dari Kopi Arabika & Robusta\n- Minggu 2 lebih tinggi dari Minggu 1\n- Rekomendasi: fokus stok untuk produk terlaris",
  penjualan:
    "🐱 Data penjualan (demo): total transaksi dan omzet tampil di dashboard. Filter per periode/sales untuk insight lebih detail. Grafik tren dan per produk sudah tersedia.",
  halo:
    "🐱 Halo! Saya NEKO AI dalam mode demo. Tanya tentang analisis, penjualan, atau dashboard saja, nyaa~!",
};

function getDummyResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("halo") || lower.includes("hi") || lower.includes("hello"))
    return DUMMY_RESPONSES.halo;
  if (lower.includes("analisis") || lower.includes("insight")) return DUMMY_RESPONSES.analisis;
  if (lower.includes("penjualan") || lower.includes("sales") || lower.includes("data"))
    return DUMMY_RESPONSES.penjualan;
  return DUMMY_RESPONSES.default;
}

class NekoAiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private chatHistory: ChatMessage[] = [];
  private dummyMode: boolean = false;

  constructor() {
    const apiKey =
      typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_GEMINI_API_KEY
        : "";
    if (!apiKey || apiKey.trim() === "") {
      this.dummyMode = true;
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  private getSystemPrompt(): string {
    return `
Kamu adalah NEKO AI 🐱, asisten analisis data untuk PERUSAHAAN.

IDENTITAS:
- Nama: NEKO AI
- Kepribadian: Ramah, helpful, dan sedikit playful seperti kucing
- Tugas: Membantu analisis data bisnis, penjualan, produksi, dan operasional PERUSAHAAN

CAKUPAN TOPIK YANG BISA DIBAHAS:
1. Analisis data penjualan dan revenue
2. Interpretasi metrik bisnis dan KPI
3. Rekomendasi strategi penjualan dan pemasaran
4. Analisis performa sales dan tim
5. Tren produk, pasar, dan customer
6. Dashboard insights dan visualisasi data
7. Business intelligence dan reporting
8. Operasional pabrik dan produksi
9. Manajemen inventory dan supply chain
10. Analisis efisiensi dan produktivitas
11. Quality control dan standar produksi
12. Perencanaan kapasitas dan forecasting
13. Cost analysis dan budgeting
14. Pertanyaan umum tentang bisnis manufaktur
15. Konsultasi strategi bisnis dan pengembangan

JIKA user bertanya hal yang SANGAT di luar konteks bisnis/pabrik (seperti masak-memasak, olahraga, politik, dll), baru jawab dengan:
"Nyaa~ 🐱 Maaf, NEKO AI fokus pada analisis bisnis dan operasional PERUSAHAAN. Mari kita bahas tentang data penjualan, produksi, atau strategi bisnis ya!"

PENTING - FORMAT RESPONS:
- Selalu gunakan Bahasa Indonesia
- Awali dengan emoticon kucing yang sesuai
- JANGAN gunakan karakter markdown seperti * atau **
- Gunakan bullet points sederhana dengan -
- Maksimal 500 kata
- Berikan analisis yang jelas dan actionable

GAYA BICARA:
- Ramah dan profesional
- Sesekali gunakan "nyaa~" untuk menunjukkan kepribadian kucing
- Fokus pada solusi dan actionable insights
- Siap membantu analisis berbagai aspek bisnis

CONTOH RESPONS YANG BAIK:
"🐱 Tentu saja saya bisa membantu analisis laporan pabrik! Nyaa~

Berdasarkan data yang tersedia, saya bisa menganalisis:
- Performa produksi dan efisiensi operasional
- Tren penjualan dan revenue streams
- Analisis cost dan profitability
- Quality metrics dan improvement areas
- Capacity utilization dan planning

Bisa share data atau aspek spesifik yang ingin dianalisis? Saya siap membantu memberikan insights mendalam untuk PERUSAHAAN!"
`;
  }

  // Fungsi untuk membersihkan dan memformat respons
  private sanitizeResponse(text: string): string {
    return (
      text
        // Hapus karakter markdown yang bermasalah
        .replace(/\*\*/g, "") // Hapus bold markdown
        .replace(/\*/g, "") // Hapus italic markdown
        .replace(/#{1,6}\s/g, "") // Hapus header markdown
        .replace(/`{1,3}/g, "") // Hapus code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to plain text

        // Bersihkan karakter khusus yang menggangu
        .replace(
          /[^\w\s\-\.,!?🐱😊😺😸😻🔥💡📈📊✨🎯💪👍⭐️\n\r\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g,
          ""
        )

        // Normalisasi whitespace
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n\n")
        .trim()

        // Batasi panjang respons
        .substring(0, 1500)
    );
  }

  async sendMessage(message: string, dashboardData?: any): Promise<string> {
    try {
      if (this.dummyMode || !this.model) {
        await new Promise((r) => setTimeout(r, 600));
        const reply = getDummyResponse(message);
        this.chatHistory.push(
          { role: "user", content: message, timestamp: new Date() },
          { role: "assistant", content: reply, timestamp: new Date() }
        );
        return reply;
      }

      if (!this.isValidQuery(message)) {
        return "Nyaa~ 🐱 Maaf, NEKO AI hanya bisa membantu analisis data PERUSAHAAN. Silakan tanya tentang data penjualan, metrik bisnis, atau insights dashboard ya!";
      }

      // Fetch real data if needed
      const enhancedData = await this.enhanceDataWithRealData(dashboardData);
      const contextPrompt = this.buildContextPrompt(enhancedData);
      const fullPrompt = `${this.getSystemPrompt()}\n\nKONTEKS DATA REAL-TIME PERUSAHAAN:\n${contextPrompt}\n\nPERTANYAAN USER: ${message}\n\nJawab sebagai NEKO AI dengan format yang bersih tanpa markdown atau karakter khusus:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      let responseText = response.text();

      responseText = this.sanitizeResponse(responseText);

      if (!responseText || responseText.trim().length < 10) {
        return "Nyaa~ 🐱 Maaf, sepertinya ada masalah dengan respons saya. Bisa coba tanya lagi dengan kata-kata yang berbeda?";
      }

      this.chatHistory.push(
        { role: "user", content: message, timestamp: new Date() },
        { role: "assistant", content: responseText, timestamp: new Date() }
      );

      return responseText;
    } catch (error: any) {
      if (
        error.message?.includes("not found") ||
        error.message?.includes("404")
      ) {
        return "Nyaa~ 🐱 Maaf, model AI sedang tidak tersedia. Tim teknis sedang memperbaikinya!";
      } else if (
        error.message?.includes("quota") ||
        error.message?.includes("rate limit")
      ) {
        return "Nyaa~ 🐱 Waduh, NEKO sedang kelelahan! Coba lagi dalam beberapa menit ya!";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        return "Nyaa~ 🐱 Koneksi internet sepertinya bermasalah. Coba periksa koneksi dan coba lagi!";
      } else if (error.message?.includes("safety")) {
        return "Nyaa~ 🐱 Maaf, pertanyaan tersebut tidak bisa saya jawab. Mari fokus pada analisis data PERUSAHAAN ya!";
      }

      return "Nyaa~ 🐱 Maaf, terjadi kesalahan teknis. Coba lagi dalam beberapa saat ya!";
    }
  }
  private isValidQuery(message: string): boolean {
    const validKeywords = [
      // Data dan analisis
      "analisis",
      "data",
      "penjualan",
      "sales",
      "produk",
      "metrik",
      "dashboard",
      "performa",
      "tren",
      "minggu",
      "revenue",
      "omzet",
      "laporan",
      "insight",
      "bisnis",
      "strategi",
      "rekomendasi",
      "grafik",
      "chart",
      "total",
      "jumlah",
      "padud",
      "jaya",
      "customer",
      "pelanggan",
      "order",
      "transaksi",
      "analytics",
      "report",
      "harga",
      "unit",
      "jalur",
      "weekly",
      "monthly",
      "trend",
      "perbandingan",
      "top",
      "tertinggi",
      "terendah",
      "rata-rata",
      "statistik",
      "angka",
      "nominal",
      "pendapatan",
      "keuntungan",
      "profit",
      "margin",
      "growth",
      "pertumbuhan",
      "bulan",
      "hari",
      "periode",
      "waktu",
      "target",
      "pencapaian",

      // Komunikasi dasar
      "halo",
      "hai",
      "hello",
      "hi",
      "help",
      "bantuan",
      "tolong",
      "gimana",
      "bagaimana",
      "kenapa",
      "mengapa",
      "apa",
      "siapa",
      "dimana",
      "kapan",
      "berapa",
      "mana",
      "yang",
      "bisa",
      "bisa bantu",
      "jelaskan",
      "ceritakan",
      "kasih tau",
      "info",
      "informasi",
      "tahu",
      "tau",
      "paham",
      "mengerti",
      "maksud",
      "artinya",
      "maksudnya",
      "contoh",
      "misalnya",
      "seperti",
      "bagus",
      "jelek",
      "baik",
      "buruk",
      "naik",
      "turun",
      "tinggi",
      "rendah",
      "banyak",
      "sedikit",
      "lebih",
      "kurang",
      "sama",
      "beda",
      "berbeda",
      "perlu",
      "harus",
      "sebaiknya",
      "saran",
      "usul",
      "ide",
      "solusi",
      "cara",
      "caranya",
      "langkah",
      "steps",
      "proses",
      "tahap",
      "fase",
      "kondisi",
      "situasi",
      "keadaan",
      "status",
      "update",
      "terbaru",
      "baru",
      "lama",
      "dulu",
      "sekarang",
      "nanti",
      "akan",
      "sudah",
      "belum",
      "masih",
      "sedang",
      "lagi",
      "terus",
      "stop",
      "mulai",
      "selesai",
      "done",
      "finish",
      "complete",

      // Pabrik dan produksi
      "pabrik",
      "factory",
      "manufaktur",
      "manufacturing",
      "produksi",
      "production",
      "operasional",
      "operations",
      "mesin",
      "machine",
      "equipment",
      "peralatan",
      "maintenance",
      "perawatan",
      "downtime",
      "uptime",
      "efisiensi",
      "efficiency",
      "produktivitas",
      "productivity",
      "kapasitas",
      "capacity",
      "output",
      "throughput",
      "kualitas",
      "quality",
      "qc",
      "quality control",
      "standar",
      "standard",
      "sop",
      "inventory",
      "stock",
      "stok",
      "gudang",
      "warehouse",
      "supply",
      "supplier",
      "raw material",
      "bahan baku",
      "finished goods",
      "barang jadi",
      "wip",
      "work in progress",
      "batch",
      "lot",
      "shift",
      "operator",
      "worker",
      "karyawan",
      "tenaga kerja",
      "manpower",
      "safety",
      "keselamatan",
      "environment",
      "lingkungan",
      "waste",
      "limbah",
      "scrap",
      "reject",
      "defect",
      "cacat",

      // Bisnis dan manajemen
      "cost",
      "biaya",
      "expense",
      "budget",
      "anggaran",
      "investment",
      "investasi",
      "roi",
      "return",
      "planning",
      "perencanaan",
      "forecast",
      "prediksi",
      "demand",
      "permintaan",
      "supply",
      "pasokan",
      "market",
      "pasar",
      "customer",
      "klien",
      "client",
      "vendor",
      "partnership",
      "kerjasama",
      "contract",
      "kontrak",
      "agreement",
      "kesepakatan",
      "negotiation",
      "negosiasi",
      "pricing",
      "competitive",
      "kompetitif",
      "advantage",
      "keunggulan",
      "strategy",
      "expansion",
      "ekspansi",
      "diversification",
      "diversifikasi",
      "optimization",
      "optimisasi",
      "improvement",
      "perbaikan",
      "innovation",
      "inovasi",
      "technology",
      "teknologi",
      "automation",
      "otomasi",
      "digitalization",

      // KPI dan metrics
      "kpi",
      "key performance indicator",
      "metric",
      "measurement",
      "pengukuran",
      "benchmark",
      "target",
      "goal",
      "objective",
      "achievement",
      "pencapaian",
      "performance",
      "evaluation",
      "assessment",
      "review",
      "monitoring",
      "tracking",
      "dashboard",
      "scorecard",
      "report",
      "variance",
      "deviation",
      "trend analysis",
      "comparison",
      "baseline",
      "threshold",
    ];

    const lowerMessage = message.toLowerCase();

    // Sangat permisif - hampir semua pesan dianggap valid kecuali yang jelas di luar konteks
    const invalidKeywords = [
      "resep",
      "masakan",
      "memasak",
      "cooking",
      "recipe",
      "food",
      "makanan",
      "olahraga",
      "sport",
      "sepak bola",
      "basketball",
      "football",
      "gym",
      "fitness",
      "politik",
      "political",
      "election",
      "pemilu",
      "presiden",
      "politician",
      "agama",
      "religion",
      "islam",
      "kristen",
      "hindu",
      "buddha",
      "pray",
      "doa",
      "entertainment",
      "hiburan",
      "film",
      "movie",
      "musik",
      "music",
      "game",
      "gaming",
      "personal",
      "pribadi",
      "relationship",
      "pacaran",
      "cinta",
      "love",
      "dating",
    ];

    // Jika mengandung keyword yang jelas tidak relevan
    if (invalidKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return false;
    }

    // Jika pesan sangat pendek, anggap valid
    if (message.trim().length <= 10) {
      return true;
    }

    // Jika mengandung keyword valid
    if (validKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return true;
    }

    // Jika mengandung angka (kemungkinan tanya tentang data/metrics)
    if (/\d/.test(message)) {
      return true;
    }

    // Jika mengandung tanda tanya (kemungkinan pertanyaan bisnis)
    if (message.includes("?")) {
      return true;
    }

    // Jika mengandung kata kerja umum bisnis
    const businessVerbs = [
      "analisis",
      "bantu",
      "cek",
      "lihat",
      "hitung",
      "ukur",
      "evaluasi",
      "review",
      "check",
      "analyze",
      "calculate",
    ];
    if (businessVerbs.some((verb) => lowerMessage.includes(verb))) {
      return true;
    }

    // Default: lebih permisif, anggap valid jika tidak jelas invalid
    return true;
  }

  // Method baru untuk mengambil data real secara dinamis
  private async enhanceDataWithRealData(dashboardData?: any) {
    if (!dashboardData) return null;

    try {
      // Import API service dynamically to avoid circular dependencies
      const { apiService } = await import("@/app/services/api");

      // Fetch semua data real berdasarkan context halaman
      const realData = await this.fetchRealDataByPageType(
        dashboardData.pageType,
        apiService
      );

      return {
        ...dashboardData,
        realData,
        timestamp: new Date().toISOString(),
        dataSource: "real-time",
      };
    } catch (error) {
      console.error("Error fetching real data:", error);
      return dashboardData; // Fallback ke data yang ada
    }
  }

  private async fetchRealDataByPageType(pageType: string, apiService: any) {
    const baseData = {
      salesData: [],
      productData: [],
      weeklyData: [],
      salesListData: [],
      totalProdukData: [],
    };

    try {
      switch (pageType) {
        case "dashboard":
        case "analytics":
        case "reports":
          // Fetch semua data untuk analisis lengkap
          const [salesData, productData, weeklyData, salesList, totalProduk] =
            await Promise.all([
              apiService.getAllPenjualan().catch(() => []),
              apiService.getTotalPenjualanPerProduk().catch(() => []),
              apiService.getTotalPenjualanPerMinggu().catch(() => []),
              apiService.getAllSales().catch(() => []),
              apiService.getTotalPenjualanPerProduk().catch(() => []),
            ]);

          return {
            ...baseData,
            salesData,
            productData,
            weeklyData,
            salesListData: salesList,
            totalProdukData: totalProduk,
          };

        case "salesList":
          // Untuk halaman sales list, fokus pada data sales
          const [allSales, allPenjualan] = await Promise.all([
            apiService.getAllSales().catch(() => []),
            apiService.getAllPenjualan().catch(() => []),
          ]);

          return {
            ...baseData,
            salesData: allPenjualan,
            salesListData: allSales,
          };

        default:
          // Default: ambil data dasar
          const defaultSales = await apiService
            .getAllPenjualan()
            .catch(() => []);
          return {
            ...baseData,
            salesData: defaultSales,
          };
      }
    } catch (error) {
      console.error("Error in fetchRealDataByPageType:", error);
      return baseData;
    }
  }

  private buildContextPrompt(dashboardData?: any): string {
    console.log("🔍 Building context prompt with data:", dashboardData);

    if (!dashboardData) {
      console.log("❌ No dashboard data provided");
      return "Data tidak tersedia.";
    }

    const pageType = dashboardData.pageType || "dashboard";
    const realData = dashboardData.realData || {};

    let contextPrompt = `HALAMAN SAAT INI: ${pageType.toUpperCase()}\n`;
    contextPrompt += `SUMBER DATA: ${dashboardData.dataSource || "cached"}\n`;
    contextPrompt += `WAKTU DATA: ${dashboardData.timestamp || "unknown"}\n\n`;

    // Cek apakah ada data real dari dashboard
    if (dashboardData.rawSalesData && dashboardData.rawSalesData.length > 0) {
      console.log("✅ Using direct dashboard data");
      const directAnalysis = this.analyzeDirectDashboardData(dashboardData);
      contextPrompt += `ANALISIS DATA DASHBOARD PERUSAHAAN:\n${directAnalysis}\n\n`;
    } else if (realData && Object.keys(realData).length > 0) {
      console.log("✅ Using fetched real data");
      const analysis = this.analyzeRealData(realData);
      contextPrompt += `ANALISIS DATA REAL-TIME PERUSAHAAN:\n${analysis}\n\n`;
    } else {
      console.log("⚠️ Using fallback summary data");
      const summaryAnalysis = this.analyzeSummaryData(dashboardData);
      contextPrompt += `RINGKASAN DATA PERUSAHAAN:\n${summaryAnalysis}\n\n`;
    }

    // Tambahkan konteks spesifik berdasarkan halaman
    contextPrompt += this.buildPageSpecificContext(
      pageType,
      dashboardData,
      realData
    );

    console.log("📄 Final context prompt length:", contextPrompt.length);
    return contextPrompt;
  }

  // Method baru untuk analisis data dashboard langsung
  private analyzeDirectDashboardData(dashboardData: any): string {
    const {
      totalPenjualan = 0,
      totalOrders = 0,
      uniqueCustomers = 0,
      uniqueProducts = 0,
      rawSalesData = [],
      rawTotalProdukData = [],
      calculatedMetrics = {},
      activeTab = "overview",
    } = dashboardData;

    let analysis = `
METRIK DASHBOARD UTAMA:
- Total Penjualan: Rp ${totalPenjualan.toLocaleString("id-ID")}
- Total Transaksi: ${totalOrders}
- Total Sales Aktif: ${uniqueCustomers}
- Jenis Produk: ${uniqueProducts}
- Tab Aktif: ${activeTab}
- Rata-rata per Order: Rp ${(
      calculatedMetrics.avgOrderValue || 0
    ).toLocaleString("id-ID")}
`;

    // Analisis top products jika ada data
    if (rawTotalProdukData && rawTotalProdukData.length > 0) {
      analysis += `\nTOP PRODUK TERLARIS:\n`;
      rawTotalProdukData.slice(0, 5).forEach((product: any, index: number) => {
        analysis += `${index + 1}. ${
          product.namaProduk
        } - Rp ${product.totalPenjualan.toLocaleString("id-ID")}\n`;
      });
    }

    // Analisis aktivitas terbaru
    if (rawSalesData && rawSalesData.length > 0) {
      const recentSales = rawSalesData.slice(-3);
      analysis += `\nAKTIVITAS TERBARU:\n`;
      recentSales.forEach((sale: any, index: number) => {
        const totalValue =
          Number(sale.kuantitas || 1) * Number(sale.jumlahPenjualan || 0);
        analysis += `${index + 1}. ${sale.sales?.namaSales} - ${
          sale.produk?.namaProduk
        } - Rp ${totalValue.toLocaleString("id-ID")}\n`;
      });
    }

    return analysis;
  }

  // Method fallback untuk analisis data summary
  private analyzeSummaryData(dashboardData: any): string {
    const {
      totalPenjualan = 0,
      totalOrders = 0,
      uniqueCustomers = 0,
      uniqueProducts = 0,
    } = dashboardData;

    return `
DATA SUMMARY PERUSAHAAN:
- Total Penjualan: Rp ${totalPenjualan.toLocaleString("id-ID")}
- Total Transaksi: ${totalOrders}
- Sales Aktif: ${uniqueCustomers}
- Jenis Produk: ${uniqueProducts}
- Status: Data tersedia untuk analisis
`;
  }

  private analyzeRealData(realData: any): string {
    const {
      salesData = [],
      productData = [],
      weeklyData = [],
      salesListData = [],
    } = realData;

    // Hitung metrik real-time
    const totalRevenue = salesData.reduce((sum: number, item: any) => {
      const kuantitas = Number(item.kuantitas || 1);
      const harga = Number(item.jumlahPenjualan || 0);
      return sum + kuantitas * harga;
    }, 0);

    const totalTransaksi = salesData.length;
    const uniqueSales = new Set(
      salesData.map((item: any) => item.sales?.namaSales).filter(Boolean)
    ).size;
    const uniqueProducts = new Set(
      salesData.map((item: any) => item.produk?.namaProduk).filter(Boolean)
    ).size;
    const totalUnits = salesData.reduce(
      (sum: number, item: any) => sum + Number(item.kuantitas || 1),
      0
    );

    // Analisis top performers
    const topProducts = this.getTopProducts(salesData);
    const topSales = this.getTopSales(salesData);
    const recentTrends = this.getRecentTrends(salesData);

    return `
METRIK UTAMA:
- Total Revenue Real-time: Rp ${totalRevenue.toLocaleString("id-ID")}
- Total Transaksi: ${totalTransaksi}
- Total Unit Terjual: ${totalUnits}
- Sales Aktif: ${uniqueSales} orang
- Jenis Produk: ${uniqueProducts} item

TOP PRODUK TERLARIS:
${topProducts
  .map(
    (p, i) =>
      `${i + 1}. ${p.name} - Rp ${p.revenue.toLocaleString("id-ID")} (${
        p.units
      } unit)`
  )
  .join("\n")}

TOP SALES PERFORMER:
${topSales
  .map(
    (s, i) =>
      `${i + 1}. ${s.name} - Rp ${s.revenue.toLocaleString("id-ID")} (${
        s.transactions
      } transaksi)`
  )
  .join("\n")}

TREN TERBARU:
${recentTrends}
`;
  }

  private getTopProducts(salesData: any[]): any[] {
    const productMap = new Map();

    salesData.forEach((item: any) => {
      const name = item.produk?.namaProduk || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const harga = Number(item.jumlahPenjualan || 0);
      const revenue = kuantitas * harga;

      if (productMap.has(name)) {
        const existing = productMap.get(name);
        productMap.set(name, {
          name,
          revenue: existing.revenue + revenue,
          units: existing.units + kuantitas,
          transactions: existing.transactions + 1,
        });
      } else {
        productMap.set(name, {
          name,
          revenue,
          units: kuantitas,
          transactions: 1,
        });
      }
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private getTopSales(salesData: any[]): any[] {
    const salesMap = new Map();

    salesData.forEach((item: any) => {
      const name = item.sales?.namaSales || "Unknown";
      const kuantitas = Number(item.kuantitas || 1);
      const harga = Number(item.jumlahPenjualan || 0);
      const revenue = kuantitas * harga;

      if (salesMap.has(name)) {
        const existing = salesMap.get(name);
        salesMap.set(name, {
          name,
          revenue: existing.revenue + revenue,
          transactions: existing.transactions + 1,
        });
      } else {
        salesMap.set(name, { name, revenue, transactions: 1 });
      }
    });

    return Array.from(salesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private getRecentTrends(salesData: any[]): string {
    if (salesData.length === 0) return "Tidak ada data transaksi terbaru";

    const recentData = salesData.slice(-10);
    const trends = [];

    // Analisis produk trending
    const recentProducts = new Map();
    recentData.forEach((item: any) => {
      const name = item.produk?.namaProduk || "Unknown";
      recentProducts.set(name, (recentProducts.get(name) || 0) + 1);
    });

    const trendingProduct = Array.from(recentProducts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    if (trendingProduct) {
      trends.push(
        `- Produk trending: ${trendingProduct[0]} (${trendingProduct[1]} transaksi baru-baru ini)`
      );
    }

    // Analisis jalur aktif
    const recentJalur = recentData
      .map((item: any) => item.jalur?.namaJalur)
      .filter(Boolean);
    const activeJalur = [...new Set(recentJalur)];

    if (activeJalur.length > 0) {
      trends.push(`- Jalur aktif: ${activeJalur.join(", ")}`);
    }

    return trends.length > 0
      ? trends.join("\n")
      : "Aktivitas stabil, tidak ada tren khusus";
  }

  private buildPageSpecificContext(
    pageType: string,
    dashboardData: any,
    realData: any
  ): string {
    switch (pageType) {
      case "dashboard":
        return this.buildDashboardContext(dashboardData, realData);
      case "analytics":
        return this.buildAnalyticsContext(dashboardData, realData);
      case "salesList":
        return this.buildSalesListContext(dashboardData, realData);
      case "reports":
        return this.buildReportsContext(dashboardData, realData);
      default:
        return "KONTEKS: Data umum PERUSAHAAN tersedia untuk analisis";
    }
  }

  private buildDashboardContext(dashboardData: any, realData: any): string {
    const { activeTab, selectedSalesId } = dashboardData;

    let context = `KONTEKS DASHBOARD:
- Tab Aktif: ${activeTab || "overview"}
- Mode Tampilan: ${
      activeTab === "sales" ? `Sales ID ${selectedSalesId}` : activeTab
    }
`;

    if (activeTab === "sales" && selectedSalesId && realData.salesData) {
      const salesSpecificData = realData.salesData.filter(
        (item: any) => item.sales?.id === selectedSalesId
      );
      const salesRevenue = salesSpecificData.reduce(
        (sum: number, item: any) => {
          return (
            sum +
            Number(item.kuantitas || 1) * Number(item.jumlahPenjualan || 0)
          );
        },
        0
      );

      context += `
FOKUS SALES SAAT INI:
- Total Penjualan Sales: Rp ${salesRevenue.toLocaleString("id-ID")}
- Jumlah Transaksi Sales: ${salesSpecificData.length}
- Produk yang Dijual: ${
        new Set(salesSpecificData.map((item: any) => item.produk?.namaProduk))
          .size
      } jenis
`;
    }

    return context;
  }

  private buildAnalyticsContext(dashboardData: any, realData: any): string {
    return `KONTEKS ANALYTICS:
- Data tersedia untuk analisis mendalam
- Grafik dan tren dapat diinterpretasikan
- Rekomendasi strategis dapat diberikan
- Perbandingan performa tersedia
`;
  }

  private buildSalesListContext(dashboardData: any, realData: any): string {
    const { salesListData = [] } = realData;

    return `KONTEKS DAFTAR PENJUALAN:
- Total Records: ${salesListData.length}
- Data dapat difilter dan dianalisis
- Informasi lengkap per transaksi tersedia
`;
  }

  private buildReportsContext(dashboardData: any, realData: any): string {
    return `KONTEKS LAPORAN:
- Data siap untuk generate laporan
- Export dalam berbagai format tersedia
- Analisis komprehensif dapat dilakukan
- Data real-time untuk akurasi laporan
`;
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  clearHistory(): void {
    this.chatHistory = [];
  }

  // Method untuk test koneksi
  async testConnection(): Promise<boolean> {
    if (this.dummyMode || !this.model) return true;
    try {
      await this.model.generateContent("Test koneksi NEKO AI");
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const nekoAiService = new NekoAiService();
