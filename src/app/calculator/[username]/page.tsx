import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  
  return {
    title: `${decodedUsername}'s Pudim Score | pudim.dev`,
    description: `Check out ${decodedUsername}'s Dev Pudim Score! Discover their GitHub stats and developer flavor profile.`,
  }
}

export default async function CalculatorPage({ params }: PageProps) {
  const { username } = await params

  return (
    <main className="flex flex-col items-center w-full">
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

