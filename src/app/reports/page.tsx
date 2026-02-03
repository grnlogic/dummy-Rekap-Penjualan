"use client";

import { useState, useEffect } from "react";
import ReportsPage from "../components/Report";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import Link from "next/link";
import { BarChart3, FileText, AlertCircle, RefreshCw } from "lucide-react";
import NekoAiChat from "../components/NekoAiChat";

interface AnalyticsData {
  salesData: any[];
  totalProdukData: any[];
  monthlyData: any[];
  productPerformance: any[];
  salesPerformance: any[];
  jalurAnalysis: any[];
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    totalUnits: number;
    uniqueCustomers: number;
    uniqueProducts: number;
  };
  trends: {
    revenueTrend: number;
    ordersTrend: number;
    customersTrend: number;
    productsTrend: number;
  };
}

export default function Reports() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    try {
      const data = localStorage.getItem("analyticsReportData");
      const timestamp = localStorage.getItem("analyticsReportTimestamp");

      if (data && timestamp) {
        setAnalyticsData(JSON.parse(data));
        setDataTimestamp(timestamp);
      }
    } catch (error) {
      // Silent fail - data will remain null
      setAnalyticsData(null);
      setDataTimestamp(null);
    }
  };

  const isDataFresh = () => {
    if (!dataTimestamp) return false;
    const now = new Date();
    const dataTime = new Date(dataTimestamp);
    const diffInMinutes = (now.getTime() - dataTime.getTime()) / (1000 * 60);
    return diffInMinutes < 30; // Consider data fresh if less than 30 minutes old
  };

  // Update method untuk menyiapkan data reports untuk NEKO AI - PERBAIKAN
  const prepareReportsDataForAI = () => {
    const reportsData = {
      analyticsData,
      dataTimestamp,
      isDataFresh: isDataFresh(),
      pageType: "reports",

      // Data metrics jika tersedia
      metrics: analyticsData?.metrics || {
        totalRevenue: 0,
        totalOrders: 0,
        totalUnits: 0,
        uniqueCustomers: 0,
        uniqueProducts: 0,
      },

      trends: analyticsData?.trends || {},
      totalRecords: analyticsData?.salesData?.length || 0,
      lastUpdate: dataTimestamp,

      // Tambahan context
      reportContext: {
        hasAnalyticsData: !!analyticsData,
        dataAge: dataTimestamp
          ? Math.round(
              (new Date().getTime() - new Date(dataTimestamp).getTime()) /
                (1000 * 60)
            )
          : null,
        availableDataTypes: analyticsData ? Object.keys(analyticsData) : [],
      },

      // Debug info
      debugInfo: {
        analyticsDataKeys: analyticsData ? Object.keys(analyticsData) : [],
        hasMetrics: !!analyticsData?.metrics,
        hasSalesData: !!analyticsData?.salesData?.length,
        timestamp: new Date().toISOString(),
      },
    };

  };

  return (
    <div className="p-6">
  

      {/* Analytics Data Status - Simplified */}
      {analyticsData ? (
        <Card className="mb-8 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Data Analytics</span>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    isDataFresh()
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {isDataFresh() ? "Terbaru" : "Perlu Update"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={loadAnalyticsData}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                {!isDataFresh() && (
                  <Link href="/analytics">
                    <Button size="sm" variant="default">
                      Update Data
                    </Button>
                  </Link>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  Rp{" "}
                  {analyticsData.metrics.totalRevenue.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Transaksi</p>
                <p className="text-xl font-bold text-blue-600">
                  {analyticsData.metrics.totalOrders}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Unit Terjual</p>
                <p className="text-xl font-bold text-purple-600">
                  {analyticsData.metrics.totalUnits}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Sales</p>
                <p className="text-xl font-bold text-orange-600">
                  {analyticsData.metrics.uniqueCustomers}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Produk</p>
                <p className="text-xl font-bold text-indigo-600">
                  {analyticsData.metrics.uniqueProducts}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-400 text-center">
                Terakhir diperbarui:{" "}
                {new Date(dataTimestamp!).toLocaleString("id-ID")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Reports Component */}
      <ReportsPage analyticsData={analyticsData} />

      {/* NEKO AI Chat - tambahkan sebelum closing div */}
      <NekoAiChat dashboardData={prepareReportsDataForAI()} />
    </div>
  );
}
