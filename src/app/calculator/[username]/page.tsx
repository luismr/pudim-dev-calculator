import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PudimScore } from "@/components/PudimScore"
import { Metadata } from "next"

interface PageProps {
  params: Promise<{
    username: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeURIComponent(username)
  
  const title = `🍮 ${decodedUsername}'s Pudim Score`
  const description = `Check out ${decodedUsername}'s Dev Pudim Score! Discover their GitHub stats, developer flavor profile, and see how they rank among developers.`
  const badgeUrl = `https://pudim.dev/badge/${encodeURIComponent(username)}`
  const pageUrl = `https://pudim.dev/calculator/${encodeURIComponent(username)}`
  
  return {
    title,
    description,
    keywords: [`${decodedUsername}`, "GitHub stats", "developer score", "pudim score", "GitHub profile", decodedUsername],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "profile",
      url: pageUrl,
      title,
      description,
      siteName: "pudim.dev",
      images: [
        {
          url: badgeUrl,
          width: 1000,
          height: 600,
          alt: `${decodedUsername}'s Pudim Score`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [badgeUrl],
      creator: "@pudimdev",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function CalculatorPage({ params }: PageProps) {
  const { username } = await params
  const decodedUsername = decodeURIComponent(username)
  const pageUrl = `https://pudim.dev/calculator/${encodeURIComponent(username)}`

  // Breadcrumb structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pudim.dev"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Calculator",
        "item": "https://pudim.dev/calculator"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${decodedUsername}'s Score`,
        "item": pageUrl
      }
    ]
  };

  // ProfilePage structured data
  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": `${decodedUsername}'s Dev Pudim Score`,
    "description": `GitHub developer profile and stats for ${decodedUsername}`,
    "url": pageUrl,
    "mainEntity": {
      "@type": "Person",
      "name": decodedUsername,
      "url": `https://github.com/${decodedUsername}`
    }
  };

  return (
    <main className="flex flex-col items-center w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }}
      />
      {/* Header */}
      <section className="w-full py-8 md:py-12 bg-background border-b">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Back to Home
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Dev Pudim Score 🍮
              </h1>
              <p className="mx-auto max-w-[600px] text-muted-foreground">
                Calculating score for <span className="font-semibold text-primary">{decodeURIComponent(username)}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="w-full py-12 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <PudimScore initialUsername={decodeURIComponent(username)} />
        </div>
      </section>

      {/* Info Section */}
      <section className="w-full py-12 bg-background">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-bold">Want to check another profile?</h2>
            <p className="text-muted-foreground max-w-[600px]">
              Enter a different GitHub username above or return to the home page to learn more about how the Pudim Score works.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

