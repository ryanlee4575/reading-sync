import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import OneSignalProvider from "@/components/OneSignalProvider";
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
  title: "Reading Sync",
  description: "Stay on the same chapter as your friends.",
  applicationName: "Reading Sync",
  appleWebApp: {
    capable: true,
    title: "Reading Sync",
    statusBarStyle: "black",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <OneSignalProvider />
        {children}
      </body>
    </html>
  );
}
