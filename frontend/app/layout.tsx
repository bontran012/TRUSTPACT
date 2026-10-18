import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import { StoreProvider } from "../lib/store";

export const metadata: Metadata = {
  title: "TrustPact — Giao Thức Ký Quỹ Ba Bên & Bảo Chứng Tài Sản Trên Avalanche",
  description: "Giải pháp ký quỹ đa phương phi tập trung, bảo chứng tài sản đảm bảo qua Aave V3, định danh uy tín Soulbound Token và tra cứu gian lận phi tập trung trên Avalanche Custom L1.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col antialiased selection:bg-red-600 selection:text-white relative">
        <StoreProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
