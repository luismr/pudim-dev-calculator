import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "pudim.dev 🍮 - Calculate Your Dev Pudim Score",
  description: "🍮 Calculate your Dev Pudim Score! Gamifies your GitHub profile with dessert-themed ranks from Legendary Flan to Underbaked. Check your developer flavor!",
  keywords: ["GitHub", "developer", "stats", "pudim", "score", "ranking", "profile"],
  authors: [{ name: "pudim.dev" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pudim.dev",
    siteName: "pudim.dev",
    title: "pudim.dev 🍮 - Calculate Your Dev Pudim Score",
    description: "🍮 Calculate your Dev Pudim Score! Gamifies your GitHub profile with dessert-themed ranks from Legendary Flan to Underbaked. Check your developer flavor!",
    images: [
      {
        url: "https://pudim.dev/opengraph-image",
        width: 1200,
        height: 630,
        alt: "pudim.dev - Dev Pudim Score Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "pudim.dev 🍮 - Calculate Your Dev Pudim Score",
    description: "🍮 Calculate your Dev Pudim Score! Gamifies your GitHub profile with dessert-themed ranks.",
    images: ["https://pudim.dev/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
