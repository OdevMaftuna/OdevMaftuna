import type { Metadata, Viewport } from "next";
import { RegisterSW } from "@/components/install-app";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_NAME } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: "NSP Language Center — ingliz tili uyga vazifalarini topshirish tizimi",
  // Bosh ekranga qo‘shilganda (iPhone): ilova kabi, nomi “NSP”.
  appleWebApp: { capable: true, title: "NSP", statusBarStyle: "black-translucent" },
  // Yopiq tizim: hech bir sahifa indekslanmasin.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Telefonda brauzerning yuqori paneli ham brend yashilida bo'ladi.
  themeColor: "#046B4E",
  // Sayt o'zi qorong'i: telefon brauzerlarining "majburiy tungi rejimi" ranglarni buzmasin.
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uz"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
