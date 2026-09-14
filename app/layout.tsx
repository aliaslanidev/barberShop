import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const rohan = localFont({
  src: "../fonts/WebsimaRohanRound-Regular.woff2",
  variable: "--font-rohan",
  display: "swap",
  weight: "400",
  style: "normal",
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
      <body className={`${rohan.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}