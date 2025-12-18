'use client'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

interface NavbarProps {
  showLeaderboard?: boolean
}

export function Navbar({ showLeaderboard = false }: NavbarProps) {
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#algorithm", label: "Algorithm" },
    { href: "/#ranking", label: "Ranking" },
    { href: "/#philosophy", label: "Philosophy" },
  ]

  // Add leaderboard link if enabled
  if (showLeaderboard) {
    navLinks.unshift({ href: "/#leaderboard", label: "Leaderboard" })
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
                    onClick={() => setOpen(false)}
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
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {/* Calculator Button - Always visible, forced to right */}
          <Button asChild size="sm" className="ml-2">
            <Link href="/#calculator">
              Calculator
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
