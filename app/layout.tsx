import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rock Research AI - Blockchain Payment Flow Analysis",
  description: "AI-powered payment flow analysis for DeFi portfolios using cutting-edge research and real-time data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Deployment Version: 1f0e8bb - API Integration Fix */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}
