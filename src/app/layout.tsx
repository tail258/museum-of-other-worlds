import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "异界遗物局",
  description: "将现实物品鉴定为异世界遗物。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
