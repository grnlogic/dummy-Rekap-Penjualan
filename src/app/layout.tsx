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
    icon: "/favicon-dummy.svg?v=2",
    shortcut: "/favicon-dummy.svg?v=2",
    apple: "/favicon-dummy.svg?v=2",
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
        <link rel="icon" href="/favicon-dummy.svg?v=2" type="image/svg+xml" />
        <link
          rel="shortcut icon"
          href="/favicon-dummy.svg?v=2"
          type="image/svg+xml"
        />
        <link rel="apple-touch-icon" href="/favicon-dummy.svg?v=2" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
