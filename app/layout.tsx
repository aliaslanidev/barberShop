import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const yekanBakh = localFont({
  src: [
    {
      path: "../fonts/YekanBakh-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/YekanBakh-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/YekanBakh-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/YekanBakh-Fat.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-yekan-bakh",
  display: "swap",
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className={`${yekanBakh.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  );
}