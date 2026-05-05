import type { Metadata } from "next";
import { I18nProvider } from "@/i18n/Provider";
import { fontVariableClasses } from "@/fonts";
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
    <html lang="zh-Hans" className={fontVariableClasses}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
