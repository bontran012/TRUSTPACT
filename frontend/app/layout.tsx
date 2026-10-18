import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { StoreProvider } from "../lib/store";
export const metadata: Metadata = {
  title: "TrustPact (UyTinNet) — Giao Thức Ký Quỹ Ba Bên & Bảo Chứng Lợi Tức Thực Aave V3 Trên Avalanche",
  description:
    "Hạ tầng ký quỹ P2P ba bên phi tập trung, bảo chứng tài sản đảm bảo sinh lời thực qua Aave V3, định danh uy tín Soulbound Token và Radar chống lừa đảo 0đ Gas trên Avalanche Custom L1.",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#04060b] text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white relative">
        <div className="fixed inset-0 bg-cyber-grid pointer-events-none z-0 opacity-75" />
        <div className="fixed inset-x-0 top-0 h-[520px] bg-radial-top pointer-events-none z-0" />
        <StoreProvider>
          <Navbar />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
