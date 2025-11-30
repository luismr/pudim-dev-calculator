'use client'

import { Github, ExternalLink, Info, Copyright, Building2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState } from "react"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [open, setOpen] = useState(false)

  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container px-4 md:px-6 mx-auto">
        {/* Desktop Layout - Full Text */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Built by{" "}
              <a
                href="https://luismachadoreis.dev"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4 hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                Luis Machado Reis
                <ExternalLink className="h-3 w-3" />
              </a>
              . The source code is available on{" "}
              <a
                href="https://github.com/luismr/pudim-dev-calculator"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4 hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
              .
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Copyright © {currentYear}
            </p>
            <span className="text-sm text-muted-foreground">-</span>
            <a
              href="https://singularideas.com.br"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium underline underline-offset-4 hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              SingularIdeas
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Mobile Layout - Icons Only */}
        <div className="flex md:hidden items-center justify-center gap-4">
          <button
            onClick={() => setOpen(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View footer information"
          >
            <Info className="h-5 w-5" />
          </button>
          <a
            href="https://github.com/luismr/pudim-dev-calculator"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View source code on GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Copyright className="h-4 w-4" />
            <span className="text-xs">{currentYear}</span>
          </div>
          <a
            href="https://singularideas.com.br"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Visit SingularIdeas"
          >
            <Building2 className="h-5 w-5" />
          </a>
        </div>

        {/* Modal for Mobile */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>About pudim.dev</DialogTitle>
              <DialogDescription>
                Information about this project and its creators
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Built by
                </p>
                <a
                  href="https://luismachadoreis.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium underline underline-offset-4 hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Luis Machado Reis
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Source code
                </p>
                <a
                  href="https://github.com/luismr/pudim-dev-calculator"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium underline underline-offset-4 hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Github className="h-3.5 w-3.5" />
                  View on GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Copyright © {currentYear}
                </p>
                <a
                  href="https://singularideas.com.br"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium underline underline-offset-4 hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  SingularIdeas
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  )
}

