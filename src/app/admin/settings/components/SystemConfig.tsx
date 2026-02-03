"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Database,
  Shield,
  Monitor,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  maxFileSize: string;
  sessionTimeout: string;
}

export default function SystemConfig() {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "PERUSAHAAN",
    siteDescription: "Sistem Rekap Penjualan",
    adminEmail: "admin@PERUSAHAAN.com",
    timezone: "Asia/Jakarta",
    dateFormat: "DD/MM/YYYY",
    currency: "IDR",
    language: "id",
    maintenanceMode: false,
    allowRegistration: false,
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    backupFrequency: "daily",
    maxFileSize: "10MB",
    sessionTimeout: "60",
  });

  const sections = [
    {
      id: "general",
      name: "General",
      icon: Settings,
      description: "Pengaturan umum aplikasi",
    },
    {
      id: "database",
      name: "Database",
      icon: Database,
      description: "Konfigurasi database",
    },
    {
      id: "security",
      name: "Security",
      icon: Shield,
      description: "Pengaturan keamanan",
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: Bell,
      description: "Pengaturan notifikasi",
    },
    {
      id: "system",
      name: "System",
      icon: Monitor,
      description: "Informasi sistem",
    },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Pengaturan berhasil disimpan!");
    } catch (error) {
      alert("Gagal menyimpan pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset semua pengaturan ke default?")) {
      // Reset to default values
      setSettings({
        siteName: "PERUSAHAAN",
        siteDescription: "Sistem Rekap Penjualan",
        adminEmail: "admin@PERUSAHAAN.com",
        timezone: "Asia/Jakarta",
        dateFormat: "DD/MM/YYYY",
        currency: "IDR",
        language: "id",
        maintenanceMode: false,
        allowRegistration: false,
        emailNotifications: true,
        smsNotifications: false,
        autoBackup: true,
        backupFrequency: "daily",
        maxFileSize: "10MB",
        sessionTimeout: "60",
      });
      alert("Pengaturan direset ke default");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Settings className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Konfigurasi Sistem
            </h2>
            <p className="text-sm text-gray-600">
              Pengaturan umum dan konfigurasi aplikasi
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? "Menyimpan..." : "Simpan"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium">{section.name}</div>
                    <div className="text-xs text-gray-500">
                      {section.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {activeSection === "general" && (
              <GeneralSettings settings={settings} setSettings={setSettings} />
            )}
            {activeSection === "database" && <DatabaseSettings />}
            {activeSection === "security" && (
              <SecuritySettings settings={settings} setSettings={setSettings} />
            )}
            {activeSection === "notifications" && (
              <NotificationSettings settings={settings} setSettings={setSettings} />
            )}
            {activeSection === "system" && <SystemInfo />}
          </div>
        </div>
      </div>
    </div>
  );
}

// General Settings Component
function GeneralSettings({ settings, setSettings }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Pengaturan Umum
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Situs
          </label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) =>
              setSettings({ ...settings, siteName: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Admin
          </label>
          <input
            type="email"
            value={settings.adminEmail}
            onChange={(e) =>
              setSettings({ ...settings, adminEmail: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) =>
              setSettings({ ...settings, timezone: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
            <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
            <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format Tanggal
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) =>
              setSettings({ ...settings, dateFormat: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deskripsi Situs
        </label>
        <textarea
          value={settings.siteDescription}
          onChange={(e) =>
            setSettings({ ...settings, siteDescription: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

// Database Settings Component
function DatabaseSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Pengaturan Database
        </h3>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">
            Pengaturan database hanya dapat diubah melalui file konfigurasi server
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status Koneksi</span>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Terhubung</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Database Type</span>
            <span className="text-sm text-gray-900">PostgreSQL</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Version 13.x</p>
        </div>
      </div>
    </div>
  );
}

// Security Settings Component
function SecuritySettings({ settings, setSettings }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Pengaturan Keamanan
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Mode Maintenance
            </label>
            <p className="text-xs text-gray-500">
              Aktifkan untuk maintenance sistem
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                maintenanceMode: !settings.maintenanceMode,
              })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.maintenanceMode ? "bg-red-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.maintenanceMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Izinkan Registrasi
            </label>
            <p className="text-xs text-gray-500">
              User baru dapat mendaftar sendiri
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                allowRegistration: !settings.allowRegistration,
              })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.allowRegistration ? "bg-green-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.allowRegistration ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (menit)
          </label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) =>
              setSettings({ ...settings, sessionTimeout: e.target.value })
            }
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings({ settings, setSettings }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Pengaturan Notifikasi
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email Notifications
              </label>
              <p className="text-xs text-gray-500">
                Kirim notifikasi via email
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                emailNotifications: !settings.emailNotifications,
              })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.emailNotifications ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.emailNotifications ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-gray-400" />
            <div>
              <label className="text-sm font-medium text-gray-700">
                SMS Notifications
              </label>
              <p className="text-xs text-gray-500">
                Kirim notifikasi via SMS
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                smsNotifications: !settings.smsNotifications,
              })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.smsNotifications ? "bg-green-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.smsNotifications ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// System Info Component
function SystemInfo() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Informasi Sistem
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Versi Aplikasi</span>
          </div>
          <p className="text-lg font-semibold text-blue-900">v1.0.0</p>
          <p className="text-xs text-blue-700">Build: 2024.06.07</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Status Server</span>
          </div>
          <p className="text-lg font-semibold text-green-900">Online</p>
          <p className="text-xs text-green-700">Uptime: 24 hari</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Database</span>
          </div>
          <p className="text-lg font-semibold text-purple-900">PostgreSQL</p>
          <p className="text-xs text-purple-700">Version 13.7</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Globe className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Environment</span>
          </div>
          <p className="text-lg font-semibold text-orange-900">Production</p>
          <p className="text-xs text-orange-700">Region: Asia-Southeast</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Informasi Developer
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Developed by:</span>
            <span className="text-gray-900">Fajar Geran</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Contact:</span>
            <a
              href="https://wa.me/6281395195039"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              +62 813 9519 5039
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Support:</span>
            <span className="text-green-600">24/7 Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}