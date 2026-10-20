import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/src/components/providers/Web3Provider";
import { AppShell } from "@/src/components/layout/AppShell";

export const metadata: Metadata = {
  title: "TrustPact — Institutional 3-Party Escrow & Scam Radar on Avalanche",
  description:
    "Decentralized 3-Party Protective Escrow, Aave V3 Real-Yield Collateral Management, Non-Transferable Soulbound Reputation, and Gasless Scam Radar on Avalanche.",
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
