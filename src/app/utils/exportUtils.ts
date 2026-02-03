import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportItem {
  product: string;
  quantity: number;
  totalUnits?: number;
  revenue: number;
  percentage: number;
  keterangan?: string;
  tanggalTransaksi?: string;
  tipeTransaksi?: string;
}

export class ExportService {
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  static getReportTitle(reportType: string): string {
    const titles: Record<string, string> = {
      product: "Laporan Penjualan Per Produk",
      sales: "Laporan Penjualan Per Sales",
      jalur: "Laporan Penjualan Per Jalur",
      monthly: "Laporan Penjualan Per Periode",
      weekly: "Laporan Penjualan Per Minggu",
      "weekly-sales": "Laporan Penjualan Per Minggu & Sales",
    };
    return titles[reportType] || "Laporan Penjualan";
  }

  static exportToExcel(
    data: ReportItem[],
    reportType: string,
    dateFrom: string,
    dateTo: string,
    summary: { totalRevenue: number; totalQuantity: number }
  ): void {
    try {
      const workbook = XLSX.utils.book_new();

      // Create header info
      const headerData = [
        ["LAPORAN PENJUALAN - PERUSAHAAN"],
        [this.getReportTitle(reportType)],
        [`Periode: ${this.formatDate(dateFrom)} - ${this.formatDate(dateTo)}`],
        [`Tanggal Cetak: ${this.formatDate(new Date().toISOString())}`],
        [],
        ["RINGKASAN"],
        [`Total Penjualan: ${this.formatCurrency(summary.totalRevenue)}`],
        [`Total Transaksi: ${summary.totalQuantity.toLocaleString("id-ID")}`],
        [
          `Rata-rata per Transaksi: ${this.formatCurrency(
            summary.totalQuantity > 0
              ? summary.totalRevenue / summary.totalQuantity
              : 0
          )}`,
        ],
        [],
        ["DETAIL LAPORAN"],
      ];

      // Create table headers
      const headers =
        reportType === "product"
          ? [
            "No",
            "Produk",
            "Jumlah Transaksi",
            "Total Unit",
            "Total Penjualan",
            "Rata-rata per Unit",
            "Persentase (%)",
          ]
          : [
            "No",
            "Item",
            "Jumlah Transaksi",
            "Total Penjualan",
            "Persentase (%)",
          ];

      // Create table data
      const tableData = data.map((item, index) => {
        const baseRow = [
          index + 1,
          item.product,
          item.quantity.toLocaleString("id-ID"),
          this.formatCurrency(item.revenue),
          `${item.percentage}%`,
        ];

        if (reportType === "product") {
          return [
            index + 1,
            item.product,
            item.quantity.toLocaleString("id-ID"),
            (item.totalUnits || 0).toLocaleString("id-ID"),
            this.formatCurrency(item.revenue),
            this.formatCurrency(
              item.totalUnits && item.totalUnits > 0
                ? item.revenue / item.totalUnits
                : 0
            ),
            `${item.percentage}%`,
          ];
        }

        return baseRow;
      });

      // Combine all data
      const allData = [...headerData, [headers], ...tableData];

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(allData);

      // Set column widths
      const colWidths =
        reportType === "product"
          ? [
            { wch: 5 },
            { wch: 25 },
            { wch: 15 },
            { wch: 12 },
            { wch: 18 },
            { wch: 18 },
            { wch: 12 },
          ]
          : [{ wch: 5 }, { wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 15 }];

      worksheet["!cols"] = colWidths;

      // Style the header
      const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
      for (let row = 0; row <= 10; row++) {
        for (let col = 0; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (worksheet[cellAddress]) {
            worksheet[cellAddress].s = {
              font: { bold: true, sz: row < 4 ? 14 : 12 },
              alignment: { horizontal: "center" },
              fill: { fgColor: { rgb: row === 11 ? "E3F2FD" : "FFFFFF" } },
            };
          }
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

      // Generate filename
      const today = new Date().toISOString().split('T')[0];
      let filename = "";

      // Check if dateFrom contains date range info or is a simple date
      if (dateFrom.includes('s/d') || dateFrom.includes('-')) {
        // It's already a formatted range, use as is
        filename = `Laporan_${reportType}_${today}.xlsx`;
      } else if (dateFrom && dateTo && dateFrom !== dateTo) {
        // It's separate dates
        filename = `Laporan_${reportType}_${dateFrom}_sd_${dateTo}.xlsx`;
      } else {
        // Single date or period
        filename = `Laporan_${reportType}_${dateFrom}_${today}.xlsx`;
      }

      // Save file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw new Error("Gagal mengexport ke Excel");
    }
  }

  static exportToPDF(
    data: ReportItem[],
    reportType: string,
    dateFrom: string,
    dateTo: string,
    summary: { totalRevenue: number; totalQuantity: number },
    returnBsData?: any[],
    selectedColumns?: {
      product?: boolean;
      quantity?: boolean;
      totalUnits?: boolean;
      revenue?: boolean;
      avgPerUnit?: boolean;
      tipeTransaksi?: boolean;
      percentage?: boolean;
      keterangan?: boolean;
    }
  ): void {
    try {
      const pdf = new jsPDF();

      // Add title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("LAPORAN PENJUALAN - PERUSAHAAN", 105, 20, { align: "center" });

      pdf.setFontSize(14);
      pdf.text(this.getReportTitle(reportType), 105, 30, { align: "center" });

      // Add period and date info
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      let periodeLabel;
      const isValidDate = (str: string) => !isNaN(Date.parse(str));
      if (
        (dateFrom && dateFrom.toLowerCase().includes("semua")) ||
        (dateTo && dateTo.toLowerCase().includes("semua"))
      ) {
        // Tampilkan label sesuai value filter
        periodeLabel = `Periode: Semua Bulan`;
      } else if (isValidDate(dateFrom) && isValidDate(dateTo)) {
        periodeLabel = `Periode: ${ExportService.formatDate(
          dateFrom
        )} - ${ExportService.formatDate(dateTo)}`;
      } else {
        periodeLabel = `Periode: ${dateFrom}`;
      }
      pdf.text(periodeLabel, 20, 45);
      pdf.text(
        `Tanggal Cetak: ${this.formatDate(new Date().toISOString())}`,
        20,
        52
      );

      // Add summary
      pdf.setFont("helvetica", "bold");
      pdf.text("RINGKASAN:", 20, 65);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Total Transaksi: ${summary.totalQuantity.toLocaleString("id-ID")}`,
        20,
        72
      );

      // Create table headers and data based on selected columns
      const defaultColumns = {
        product: true,
        quantity: true,
        totalUnits: true,
        revenue: true,
        avgPerUnit: true,
        tipeTransaksi: true,
        percentage: true,
        keterangan: true,
      };

      const columns = selectedColumns || defaultColumns;

      const headers = ["No"];
      const columnKeys: string[] = [];

      if (columns.product) {
        headers.push(reportType === "product" ? "Produk" : "Item");
        columnKeys.push("product");
      }
      if (columns.quantity) {
        headers.push("Transaksi");
        columnKeys.push("quantity");
      }
      if (columns.totalUnits && (reportType === "product" || reportType === "product-sales")) {
        headers.push("Unit");
        columnKeys.push("totalUnits");
      }
      if (columns.avgPerUnit && (reportType === "product" || reportType === "product-sales")) {
        headers.push("Harga per Produk");
        columnKeys.push("avgPerUnit");
      }
      if (columns.revenue) {
        headers.push("Total Penjualan");
        columnKeys.push("revenue");
      }
      if (columns.tipeTransaksi) {
        headers.push("Tipe Transaksi");
        columnKeys.push("tipeTransaksi");
      }
      if (columns.percentage) {
        headers.push("%");
        columnKeys.push("percentage");
      }
      if (columns.keterangan) {
        headers.push("Keterangan");
        columnKeys.push("keterangan");
      }

      const tableData = data.map((item, index) => {
        const unit = item.totalUnits !== undefined ? item.totalUnits : 0;
        const hargaPerProduk = unit > 0 ? item.revenue / unit : 0;

        const row = [(index + 1).toString()];

        columnKeys.forEach(key => {
          switch (key) {
            case "product":
              row.push(item.product);
              break;
            case "quantity":
              row.push(item.quantity.toLocaleString("id-ID"));
              break;
            case "totalUnits":
              row.push(unit.toLocaleString("id-ID"));
              break;
            case "avgPerUnit":
              row.push(this.formatCurrency(hargaPerProduk));
              break;
            case "revenue":
              row.push(this.formatCurrency(item.revenue));
              break;
            case "tipeTransaksi":
              row.push(item.tipeTransaksi || "PENJUALAN");
              break;
            case "percentage":
              row.push(`${item.percentage}%`);
              break;
            case "keterangan":
              row.push(item.keterangan || "-");
              break;
          }
        });

        return row;
      });

      autoTable(pdf, {
        head: [headers],
        body: tableData,
        startY: 85,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          halign: "center",
        },
        headStyles: {
          fillColor: [63, 81, 181],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: (() => {
          const styles: any = {
            0: { halign: "center", cellWidth: 15 }, // No
          };

          let colIndex = 1;
          columnKeys.forEach(key => {
            switch (key) {
              case "product":
                styles[colIndex] = { halign: "left", cellWidth: 35 };
                break;
              case "quantity":
                styles[colIndex] = { halign: "center", cellWidth: 20 };
                break;
              case "totalUnits":
                styles[colIndex] = { halign: "center", cellWidth: 20 };
                break;
              case "avgPerUnit":
                styles[colIndex] = { halign: "right", cellWidth: 25 };
                break;
              case "revenue":
                styles[colIndex] = { halign: "right", cellWidth: 30 };
                break;
              case "tipeTransaksi":
                styles[colIndex] = { halign: "center", cellWidth: 25 };
                break;
              case "percentage":
                styles[colIndex] = { halign: "center", cellWidth: 15 };
                break;
              case "keterangan":
                styles[colIndex] = { halign: "left", cellWidth: 25 };
                break;
            }
            colIndex++;
          });

          return styles;
        })(),
      });

      // Tambahkan tabel Return/BS jika ada
      console.log("🔍 Checking Return/BS data:", {
        hasData: returnBsData ? true : false,
        dataLength: returnBsData ? returnBsData.length : 0,
        dataType: typeof returnBsData
      });

      if (returnBsData && returnBsData.length > 0) {
        console.log("📦 Return/BS data received in ExportService:", {
          count: returnBsData.length,
          sampleData: returnBsData.slice(0, 3).map(item => ({
            product: item.product,
            salesName: item.salesName,
            kuantitas: item.kuantitas,
            nominal: item.nominal,
            tipeTransaksi: item.tipeTransaksi,
            tanggalTransaksi: item.tanggalTransaksi
          }))
        });

        let lastY = (pdf as any).lastAutoTable.finalY + 10;
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Tabel Return/BS", 20, lastY);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        lastY += 6;
        // Header tabel Return/BS
        const returnHeaders = [
          "No",
          "Produk",
          "Sales",
          "Kuantitas",
          "Nominal",
          "Tipe Transaksi",
          "Tanggal",
        ];
        // Data tabel Return/BS
        const returnTable = returnBsData.map((item, idx) => [
          idx + 1,
          item.product || "-",
          item.salesName || "-",
          item.kuantitas || 0,
          ExportService.formatCurrency(
            item.nominal || item.jumlahPenjualan || item.revenue || 0
          ),
          item.tipeTransaksi || "RETURN/BS",
          item.tanggalTransaksi
            ? ExportService.formatDate(item.tanggalTransaksi)
            : "-",
        ]);

        console.log("🗂️ Return/BS table data mapped:", {
          totalRows: returnTable.length,
          tableData: returnTable
        });

        autoTable(pdf, {
          head: [returnHeaders],
          body: returnTable,
          startY: lastY,
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 3, halign: "center" },
          headStyles: {
            fillColor: [255, 152, 0],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [255, 243, 224] },
          columnStyles: {
            0: { halign: "center", cellWidth: 10 },
            1: { halign: "left", cellWidth: 35 },
            2: { halign: "left", cellWidth: 30 },
            3: { halign: "center", cellWidth: 15 },
            4: { halign: "right", cellWidth: 25 },
            5: { halign: "center", cellWidth: 20 },
            6: { halign: "center", cellWidth: 25 },
          },
        });
      }

      // Add footer
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
          `Halaman ${i} dari ${pageCount}`,
          pdf.internal.pageSize.width - 30,
          pdf.internal.pageSize.height - 10
        );
      }

      // Generate filename and save
      const today = new Date().toISOString().split('T')[0];
      let filename = "";

      // Check if dateFrom contains date range info or is a simple date
      if (dateFrom.includes('s/d') || dateFrom.includes('-')) {
        // It's already a formatted range, use as is
        filename = `Laporan_${reportType}_${today}.pdf`;
      } else if (dateFrom && dateTo && dateFrom !== dateTo) {
        // It's separate dates
        filename = `Laporan_${reportType}_${dateFrom}_sd_${dateTo}.pdf`;
      } else {
        // Single date or period
        filename = `Laporan_${reportType}_${dateFrom}_${today}.pdf`;
      }

      pdf.save(filename);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      throw new Error("Gagal mengexport ke PDF");
    }
  }
}
