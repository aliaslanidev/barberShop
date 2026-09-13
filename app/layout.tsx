import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "سالن آرایش",
  description: "سالن آرایش مردانه",
  manifest: "/manifest.json",
  themeColor: "#010100",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "سالن آرایش",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className={`${vazir.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}