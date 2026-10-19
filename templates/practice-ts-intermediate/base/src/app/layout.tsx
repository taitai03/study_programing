import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "さくらマート 管理画面", template: "%s | さくらマート 管理画面" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
