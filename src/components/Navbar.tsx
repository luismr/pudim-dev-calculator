'use client'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function Navbar() {
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#algorithm", label: "Algorithm" },
    { href: "/#ranking", label: "Ranking" },
    { href: "/#philosophy", label: "Philosophy" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 md:px-6">
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
            <div className="flex items-center space-x-2 mb-8 pb-4 border-b -mx-6 px-6">
              <span className="text-2xl">🍮</span>
              <span className="font-bold text-lg">pudim.dev</span>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary py-2"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-2xl">🍮</span>
            <span className="font-bold inline-block">
              pudim.dev
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
        <div className="flex flex-1 items-center justify-end space-x-2">
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
          {/* Calculator Button - Always visible */}
          <Button asChild size="sm">
            <Link href="/#calculator">
              Calculator
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
