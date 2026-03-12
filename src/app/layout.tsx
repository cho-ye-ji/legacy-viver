import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legacy Reviver — jQuery · Vanilla JS → React 변환기",
  description: "오래된 jQuery/Vanilla JS 코드를 최신 React 함수형 컴포넌트(TypeScript + Tailwind CSS)로 자동 변환합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-zinc-950 text-zinc-100">
        {children}
      </body>
    </html>
  );
}
