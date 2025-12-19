import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Zap, Calculator, Link2, Image as ImageIcon, Trophy, Star, Users, GitFork } from "lucide-react"
import Link from "next/link"
import { PudimScore } from "@/components/PudimScore"
import { LeaderboardSection } from "@/components/LeaderboardSection"
import { StatisticsSection } from "@/components/StatisticsSection"
import { DebugLogger } from "@/components/DebugLogger"

export default function Home() {

  // WebPage structured data
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "pudim.dev - Calculate Your Dev Pudim Score",
    "description": "Calculate your Dev Pudim Score! Gamifies your GitHub profile with dessert-themed ranks from Legendary Flan to Underbaked.",
    "url": "https://pudim.dev",
    "inLanguage": "en-US",
    "isPartOf": {
      "@type": "WebSite",
      "name": "pudim.dev",
      "url": "https://pudim.dev"
    },
    "about": {
      "@type": "Thing",
      "name": "GitHub Developer Score Calculator",
      "description": "A fun tool to calculate and share your GitHub developer score with dessert-themed rankings"
    }
  };

  // SoftwareApplication schema
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Dev Pudim Score Calculator",
    "url": "https://pudim.dev",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "description": "Calculate your GitHub developer score with dessert-themed rankings. Check your stats, rank, and share your profile.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <main className="flex flex-col items-center w-full">
      <DebugLogger />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                👀 Calculate Your<br/><span className="text-primary">Dev Pudim Score</span> 🍮
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
                <Link href="/#calculator">Check My Score</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/#features">How it Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30 scroll-mt-14">
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

      {/* Leaderboard Section */}
      <LeaderboardSection />

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background scroll-mt-14">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <Badge variant="secondary" className="rounded-full">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Share Your Sweet Stats
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
              Show off your Pudim Score everywhere with direct links and embeddable badges
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-2 lg:gap-12">
            <Card className="h-full">
              <CardHeader>
                <Link2 className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Direct Calculator Links</CardTitle>
                <CardDescription>
                  Share your personalized URL that instantly displays your GitHub stats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Example URL:</p>
                  <code className="block p-3 bg-muted rounded-md text-xs break-all">
                    https://pudim.dev/calculator/[username]
                  </code>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Use Cases:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Share on social media</li>
                    <li>Include in your portfolio</li>
                    <li>Show off your contributions</li>
                    <li>Compare scores with friends</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            <Card className="h-full">
              <CardHeader>
                <ImageIcon className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Embeddable Badge</CardTitle>
                <CardDescription>
                  Generate a beautiful badge image to embed anywhere
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Markdown (GitHub README):</p>
                  <code className="block p-3 bg-muted rounded-md text-xs break-all">
                    [![Pudim Score](https://pudim.dev/badge/[username])](https://pudim.dev/calculator/[username])
                  </code>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Badge Includes:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Your GitHub avatar</li>
                    <li>Rank and title</li>
                    <li>Stars, followers & repos</li>
                    <li>Top 5 programming languages</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Score Calculation Section */}
      <section id="algorithm" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30 scroll-mt-14">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <Badge variant="secondary" className="rounded-full">Algorithm</Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              How is the Score Calculated?
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
              A weighted algorithm that evaluates your GitHub profile across multiple dimensions
            </p>
          </div>

          {/* Formula */}
          <div className="max-w-3xl mx-auto mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">The Formula</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="block p-4 bg-muted rounded-md text-center text-sm md:text-base">
                  score = (followers × 0.5) + (total_stars × 2) + (public_repos × 1)
                </code>
              </CardContent>
            </Card>
          </div>

          {/* Weights Explanation */}
          <div className="mx-auto grid max-w-5xl items-start gap-6 mb-12 lg:grid-cols-3 lg:gap-8">
            <Card className="h-full">
              <CardHeader>
                <Star className="h-10 w-10 mb-2 text-yellow-500" />
                <CardTitle className="flex items-center gap-2">
                  Total Stars
                  <Badge variant="default">×2</Badge>
                </CardTitle>
                <CardDescription>Highest Weight</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">Why it matters:</p>
                <p className="text-muted-foreground">Stars indicate valuable contributions that the community appreciates</p>
                <p className="font-semibold mt-3">Example:</p>
                <p className="text-muted-foreground">100 stars = 200 points</p>
              </CardContent>
            </Card>
            <Card className="h-full">
              <CardHeader>
                <GitFork className="h-10 w-10 mb-2 text-blue-500" />
                <CardTitle className="flex items-center gap-2">
                  Public Repos
                  <Badge variant="secondary">×1</Badge>
                </CardTitle>
                <CardDescription>Medium Weight</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">Why it matters:</p>
                <p className="text-muted-foreground">Shows productivity and willingness to share your work</p>
                <p className="font-semibold mt-3">Example:</p>
                <p className="text-muted-foreground">50 repos = 50 points</p>
              </CardContent>
            </Card>
            <Card className="h-full">
              <CardHeader>
                <Users className="h-10 w-10 mb-2 text-green-500" />
                <CardTitle className="flex items-center gap-2">
                  Followers
                  <Badge variant="outline">×0.5</Badge>
                </CardTitle>
                <CardDescription>Lower Weight</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">Why it matters:</p>
                <p className="text-muted-foreground">Represents community recognition and influence</p>
                <p className="font-semibold mt-3">Example:</p>
                <p className="text-muted-foreground">200 followers = 100 points</p>
              </CardContent>
            </Card>
          </div>

          {/* Rank Thresholds */}
          <div id="ranking" className="max-w-7xl mx-auto scroll-mt-20 mt-16">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="rounded-full mb-4">Ranking</Badge>
              <Trophy className="h-12 w-12 mb-4 text-primary mx-auto" />
              <h3 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">Rank Thresholds</h3>
              <p className="text-muted-foreground md:text-lg">
                Your score determines your delicious title
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* S+ Rank */}
              <Card className="relative overflow-hidden border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-background hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-lg px-4 py-1">S+</Badge>
                  </div>
                  <CardTitle className="text-xl mb-2">Legendary Flan 🍮✨</CardTitle>
                  <CardDescription className="text-base">
                    Elite open-source contributor
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Score Required</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">1000+</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The texture is perfect, the caramel is divine. You are a coding god!
                  </p>
                </CardContent>
              </Card>

              {/* S Rank */}
              <Card className="relative overflow-hidden border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-background hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-lg px-4 py-1">S</Badge>
                  </div>
                  <CardTitle className="text-xl mb-2">Master Pudim 🍮</CardTitle>
                  <CardDescription className="text-base">
                    Highly accomplished developer
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Score Required</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-500">500-999</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A delicious result. Michelin star worthy.
                  </p>
                </CardContent>
              </Card>

              {/* A Rank */}
              <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <Badge variant="default" className="text-lg px-4 py-1">A</Badge>
                  </div>
                  <CardTitle className="text-xl mb-2">Tasty Pudding 😋</CardTitle>
                  <CardDescription className="text-base">
                    Established developer
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Score Required</p>
                    <p className="text-3xl font-bold text-primary">200-499</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Everyone wants a slice. Great job!
                  </p>
                </CardContent>
              </Card>

              {/* B Rank */}
              <Card className="relative overflow-hidden border-2 hover:border-primary/30 transition-all hover:shadow-md">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <Badge variant="secondary" className="text-lg px-4 py-1">B</Badge>
                  </div>
                  <CardTitle className="text-xl mb-2">Sweet Treat 🍬</CardTitle>
                  <CardDescription className="text-base">
                    Active contributor
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Score Required</p>
                    <p className="text-3xl font-bold">100-199</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Solid and dependable. A good dessert.
                  </p>
                </CardContent>
              </Card>

              {/* C Rank */}
              <Card className="relative overflow-hidden border-2 hover:border-primary/30 transition-all hover:shadow-md">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <Badge variant="outline" className="text-lg px-4 py-1">C</Badge>
                  </div>
                  <CardTitle className="text-xl mb-2">Homemade 🏠</CardTitle>
                  <CardDescription className="text-base">
                    Emerging developer
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Score Required</p>
                    <p className="text-3xl font-bold">50-99</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Made with love, but room for improvement.
                  </p>
                </CardContent>
              </Card>

              {/* D Rank */}
              <Card className="relative overflow-hidden border-2 hover:border-primary/30 transition-all hover:shadow-md">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <Badge variant="outline" className="text-lg px-4 py-1">D</Badge>
                  </div>
                  <CardTitle className="text-xl mb-2">Underbaked 🥚</CardTitle>
                  <CardDescription className="text-base">
                    Just getting started
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Score Required</p>
                    <p className="text-3xl font-bold">0-49</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Needs a bit more time in the oven.
                  </p>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Remember: The Pudim Score is just for fun! 🍮 The real value is in the learning and building.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="w-full py-12 md:py-24 lg:py-32 bg-background scroll-mt-14">
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

      {/* Statistics Section */}
      <StatisticsSection />
    </main>
  )
}
