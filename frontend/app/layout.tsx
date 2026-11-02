import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/src/components/providers/Web3Provider";
import { AppShell } from "@/src/components/layout/AppShell";

export const metadata: Metadata = {
  title: "TrustPact — Nền Tảng Ký Quỹ Giao Dịch 3 Bên & Tra Cứu Tín Nhiệm",
  description:
    "Hệ thống ký quỹ bảo chứng giao dịch P2P/OTC bằng Smart Contract trên Avalanche Fuji, cơ chế cọc bảo hiểm Aave V3 và định danh tín nhiệm Soulbound SBT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark font-sans">
      <body className="min-h-screen bg-[#090A0D] text-[#F1F5F9] font-sans antialiased">
        <Web3Provider>
          <AppShell>{children}</AppShell>
        </Web3Provider>
      </body>
    </html>
  );
}
