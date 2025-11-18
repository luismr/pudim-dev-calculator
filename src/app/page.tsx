import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Zap, Calculator } from "lucide-react"
import Link from "next/link"
import { PudimScore } from "@/components/PudimScore"

export default function Home() {
  return (
    <main className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                Calculate Your <span className="text-primary">Dev Pudim Score</span> 🍮
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Discover your flavor profile in the developer world. Are you a Legendary Flan or an Uncooked Mix?
              </p>
              <p className="mx-auto max-w-[700px] text-xs text-muted-foreground mt-2">
                Inspired by <a href="https://github.com/anuraghazra/github-readme-stats" target="_blank" rel="noreferrer" className="underline hover:text-primary">github-readme-stats</a>.
              </p>
            </div>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="#calculator">Check My Score</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#features">How it Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <div className="flex flex-col items-center justify-center space-y-4 mb-8">
            <Badge variant="secondary" className="rounded-full">Calculator</Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              What&apos;s Your Pudim Rank?
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
              Enter your GitHub username to reveal your sweet developer stats.
            </p>
          </div>
          <PudimScore />
        </div>
      </section>

      {/* Features/Explanation Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-full">Philosophy</Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                The Art of the Dev Pudim
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Based on the rules from the open-source community, simplified for your dessert-loving soul.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <Card className="h-full border-0 shadow-none bg-transparent md:bg-card md:shadow-sm md:border">
              <CardHeader>
                <Zap className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Ingredients (Stats)</CardTitle>
                <CardDescription>
                  We mix your stars, followers, and repos to create the base batter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Every contribution adds flavor to your profile.</p>
              </CardContent>
            </Card>
            <Card className="h-full border-0 shadow-none bg-transparent md:bg-card md:shadow-sm md:border">
              <CardHeader>
                <Calculator className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>The Secret Sauce</CardTitle>
                <CardDescription>
                  Our algorithm bakes your data into a perfect score.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Inspired by the complex ranking systems of the best developer tools.</p>
              </CardContent>
            </Card>
            <Card className="h-full border-0 shadow-none bg-transparent md:bg-card md:shadow-sm md:border">
              <CardHeader>
                <Code className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Open Source Spirit</CardTitle>
                <CardDescription>
                  Honoring the giants whose shoulders we stand on.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Special thanks to github-readme-stats for the original idea.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
