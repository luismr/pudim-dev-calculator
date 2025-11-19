import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 md:px-6">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-2xl">🍮</span>
            <span className="font-bold inline-block">
              pudim.dev
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center gap-4">
            <Link href="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Features
            </Link>
            <Link href="/#algorithm" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Algorithm
            </Link>
            <Link href="/#ranking" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Ranking
            </Link>
            <Link href="/#philosophy" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Philosophy
            </Link>
            <Button asChild size="sm">
              <Link href="/#calculator">
                Calculator
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
