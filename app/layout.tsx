import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "재테크 도구 모음 | FIRE Tools",
    template: "%s | FIRE Tools",
  },
  description: "연봉 실수령액, 전월세 전환, 대출 상환 계산기 등 재테크에 필요한 도구 모음",
  keywords: ["재테크", "계산기", "연봉 실수령액", "전월세 전환", "대출 상환", "FIRE"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 애드센스 스크립트 — 연동 시 주석 해제
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      */}
      <body className="min-h-screen flex flex-col">
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <a href="/" className="text-xl font-bold">FIRE Tools</a>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8 flex-1">
            {children}
          </main>
          <footer className="border-t">
            <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
              계산 결과는 참고용이며 실제와 차이가 있을 수 있습니다.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
