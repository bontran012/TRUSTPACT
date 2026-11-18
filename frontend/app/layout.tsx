import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/src/components/providers/Web3Provider";
import { AppShell } from "@/src/components/layout/AppShell";

export const metadata: Metadata = {
  title: "TrustPact — Hệ thống Tra cứu Rủi ro & Giao dịch Ký quỹ",
  description:
    "Hạ tầng đối soát rủi ro giao dịch, hợp đồng ký quỹ 3 bên trên Avalanche Fuji, thế chấp GDTG Aave V3 và định danh tín nhiệm Soulbound SBT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark font-sans">
      <body className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] font-sans antialiased">
        <Web3Provider>
          <AppShell>{children}</AppShell>
        </Web3Provider>
      </body>
    </html>
  );
}
