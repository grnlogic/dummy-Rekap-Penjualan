"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/app/services/api";
import {
  Activity,
  CheckCircle,
  AlertCircle,
  Database,
  Clock,
} from "lucide-react";

export default function SystemStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      setLoading(true);
      const systemStatus = await apiService.getSystemStatus();
      setStatus(systemStatus);
    } catch (error) {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-600 bg-green-100";
      case "ERROR":
        return "text-red-600 bg-red-100";
      case "OFFLINE":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const formatUptime = (uptime: string | number) => {
    // Jika uptime adalah number (detik dari process.uptime()), konversi ke format waktu
    if (typeof uptime === "number") {
      const totalSeconds = Math.floor(uptime);
      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      const parts = [];
      if (days > 0) parts.push(`${days} hari`);
      if (hours > 0) parts.push(`${hours} jam`);
      if (minutes > 0) parts.push(`${minutes} menit`);
      if (seconds > 0 && days === 0) parts.push(`${seconds} detik`);

      return parts.length > 0 ? parts.join(" ") : "0 detik";
    }

    // Jika uptime adalah string, proses seperti biasa
    const parts = uptime.split(" ");

    // Cek apakah sudah dalam format hari
    if (uptime.includes("hari")) {
      return uptime;
    }

    // Ambil jam dari uptime
    const jamIndex = parts.findIndex((part) => part === "jam");
    if (jamIndex === -1) return uptime;

    const totalJam = parseInt(parts[jamIndex - 1]);

    if (totalJam >= 24) {
      const hari = Math.floor(totalJam / 24);
      const sisaJam = totalJam % 24;

      // Ambil menit jika ada
      const menitIndex = parts.findIndex((part) => part === "menit");
      const menit = menitIndex !== -1 ? parts[menitIndex - 1] : "0";

      if (sisaJam > 0) {
        return `${hari} hari ${sisaJam} jam ${menit} menit`;
      } else {
        return `${hari} hari ${menit} menit`;
      }
    }

    return uptime;
  };

  if (loading && !status) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 animate-pulse text-blue-500" />
          <span className="text-sm text-gray-600">
            Mengecek status sistem...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          Status Sistem Backend
        </h3>
        <button
          onClick={checkSystemStatus}
          className="text-xs text-blue-600 hover:text-blue-800"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-2">
        {/* Status Utama */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status?.status === "ACTIVE" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-gray-700">Backend</span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
              status?.status || "OFFLINE"
            )}`}
          >
            {status?.status || "OFFLINE"}
          </span>
        </div>

        {/* Status Database */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-700">Database</span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              status?.database === "CONNECTED"
                ? "text-green-600 bg-green-100"
                : "text-red-600 bg-red-100"
            }`}
          >
            {status?.database || "UNKNOWN"}
          </span>
        </div>

        {/* Uptime */}
        {status?.uptime && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-700">Uptime</span>
            </div>
            <span className="text-xs text-gray-600">
              {formatUptime(status.uptime)}
            </span>
          </div>
        )}

        {/* Timestamp */}
        {status?.timestamp && (
          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Terakhir dicek:{" "}
              {new Date(status.timestamp).toLocaleString("id-ID")}
            </span>
          </div>
        )}

        {/* Error Message */}
        {status?.error && (
          <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
            <span className="text-xs text-red-700">{status.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
