import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Study Programming", template: "%s | Study Programming" },
  description: "業務で自分でコードを書けるようになるための、社内のプログラミング学習アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
