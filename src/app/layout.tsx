import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "滔滔 — Historrent",
  description: "An open-source, AI-augmented, canvas-based tool for exploring history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans">
      <body>{children}</body>
    </html>
  );
}
