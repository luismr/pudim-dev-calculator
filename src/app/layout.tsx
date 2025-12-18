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
  metadataBase: new URL('https://pudim.dev'),
  title: {
    default: "pudim.dev 🍮 - Calculate Your Dev Pudim Score",
    template: "%s | pudim.dev",
  },
  description: "🍮 Calculate your Dev Pudim Score! Gamifies your GitHub profile with dessert-themed ranks from Legendary Flan to Underbaked. Check your developer flavor!",
  keywords: ["GitHub", "developer", "stats", "pudim", "score", "ranking", "profile", "GitHub stats", "developer score", "open source", "GitHub profile", "developer ranking"],
  authors: [{ name: "pudim.dev" }],
  creator: "pudim.dev",
  publisher: "pudim.dev",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://pudim.dev",
  },
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
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "pudim.dev 🍮 - Calculate Your Dev Pudim Score",
    description: "🍮 Calculate your Dev Pudim Score! Gamifies your GitHub profile with dessert-themed ranks.",
    images: ["https://pudim.dev/opengraph-image"],
    creator: "@pudimdev",
  },
  category: "technology",
};

// Structured Data for SEO
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "pudim.dev",
  "url": "https://pudim.dev",
  "description": "Calculate your Dev Pudim Score! Gamifies your GitHub profile with dessert-themed ranks from Legendary Flan to Underbaked.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://pudim.dev/calculator/{search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "pudim.dev",
  "url": "https://pudim.dev",
  "logo": "https://pudim.dev/opengraph-image",
  "description": "A fun tool to calculate and share your GitHub developer score with dessert-themed rankings.",
  "sameAs": []
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if leaderboard should be displayed
  const leaderboardEnabled = process.env.LEADERBOARD_ENABLED === 'true'
  const dynamodbEnabled = process.env.DYNAMODB_ENABLED === 'true'
  const showLeaderboard = leaderboardEnabled && dynamodbEnabled

  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased min-h-screen flex flex-col font-sans`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Navbar showLeaderboard={showLeaderboard} />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
