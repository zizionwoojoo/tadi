import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GNB from "@/components/GNB";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tadi",
  description: "회의록을 실행 가능한 업무로 바꿔주는 AI 프로젝트 관리 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <GNB />
        {children}
      </body>
    </html>
  );
}
