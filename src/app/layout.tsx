import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import ClientLayout from "../app/components/ClientLayout"; // ✅ Import sebagai separate component

const inter = Inter({ subsets: ["latin"] });

// ✅ Metadata di server component
export const metadata: Metadata = {
  title: "PERUSAHAAN - Rekap Penjualan",
  description: "Sistem Rekap Penjualan PERUSAHAAN",
  icons: {
    icon: "/padud-favicon.png?v=1",
    shortcut: "/padud-favicon.png?v=1",
    apple: "/padud-favicon.png?v=1",
  },
};

// ✅ Server component (tanpa "use client")
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/padud-favicon.png?v=1" type="image/png" />
        <link
          rel="shortcut icon"
          href="/padud-favicon.png?v=1"
          type="image/png"
        />
        <link rel="apple-touch-icon" href="/padud-favicon.png?v=1" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
