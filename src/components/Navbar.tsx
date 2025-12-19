'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useEnv } from "@/contexts/EnvContext"

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { env } = useEnv()
  const router = useRouter()
  
  // Get leaderboard visibility from context (runtime value)
  const showLeaderboard = env?.IS_LEADERBOARD_VISIBLE ?? false

  // Get DynamoDB availability from context
  const isDynamoDBEnabled = env?.DYNAMODB_ENABLED ?? false

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#algorithm", label: "Algorithm" },
    { href: "/#ranking", label: "Ranking" },
    { href: "/#philosophy", label: "Philosophy" },
  ]

  // Add leaderboard link if enabled (at the beginning)
  if (showLeaderboard) {
    navLinks.unshift({ href: "/#leaderboard", label: "Leaderboard" })
  }

  // Add statistics link if DynamoDB is enabled (after Philosophy)
  if (isDynamoDBEnabled) {
    navLinks.push({ href: "/#statistics", label: "Statistics" })
  }

  // Handle smooth scroll for anchor links
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only handle anchor links (starting with #)
    if (href.startsWith('#')) {
      e.preventDefault()
      const targetId = href.substring(1)
      const element = document.getElementById(targetId)
      
      if (element) {
        // Close mobile menu if open
        setOpen(false)
        
        // Smooth scroll to element
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      } else {
        // If element not found, navigate normally
        router.push(href)
      }
    } else {
      // For non-anchor links, close menu if open
      setOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6 w-full max-w-full">
        {/* Left side: Mobile Menu + Logo */}
        <div className="flex items-center flex-shrink-0">
          {/* Mobile Menu - Only on small screens */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[280px]">
              {/* Menu Header */}
              <div className="flex items-center justify-center space-x-2 pb-6 mb-6 mt-2 border-b">
                <span className="text-2xl">🍮</span>
                <span className="font-bold text-lg">pudim.dev</span>
              </div>
              
              {/* Navigation Links */}
              <nav className="flex flex-col gap-1 pl-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-base font-medium text-foreground transition-colors hover:text-primary py-2 px-2 rounded-md hover:bg-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🍮</span>
            <span className="font-bold inline-block">
              pudim.dev
            </span>
          </Link>
        </div>

        {/* Right side: Desktop Navigation + Calculator Button - Always aligned right */}
        <div className="flex items-center space-x-2 flex-shrink-0 ml-auto">
          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {/* Calculator Button - Always visible, forced to right */}
          <Button asChild size="sm" className="ml-2">
            <Link href="/#calculator" onClick={(e) => handleLinkClick(e, '/#calculator')}>
              Calculator
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
