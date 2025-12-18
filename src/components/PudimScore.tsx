'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getPudimScore, updateLeaderboardConsent, wouldQualifyForTop10, type PudimScoreResult } from "@/app/_server/actions"
import { Loader2, Star, Users, GitFork, Info, Share2, Trophy, User, Award, Code } from "lucide-react"

// Map popular languages to colors (simplified map)
const languageColors: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#00ADD8",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Swift: "#ffac45",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Kotlin: "#F18E33",
  Dart: "#F04C33",
  Lua: "#005fa0",
  Solidity: "#aa6746",
};

interface PudimScoreProps {
  initialUsername?: string
}

export function PudimScore({ initialUsername }: PudimScoreProps = {}) {
  const [username, setUsername] = useState(initialUsername || "")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PudimScoreResult | null>(null)
  const [error, setError] = useState("")
  const [showRankInfo, setShowRankInfo] = useState(false)
  const [leaderboardConsent, setLeaderboardConsent] = useState(false)
  const [savingConsent, setSavingConsent] = useState(false)
  const [qualifiesForTop10, setQualifiesForTop10] = useState(false)
  const [checkingQualification, setCheckingQualification] = useState(false)
  const [consentSaved, setConsentSaved] = useState(false)
  const [rankingPosition, setRankingPosition] = useState<number | null>(null)
  const [showToast, setShowToast] = useState(false)

  const loadStats = useCallback(async (usernameToLoad: string) => {
    if (!usernameToLoad.trim()) return

    setLoading(true)
    setError("")
    setResult(null)
    
    try {
      const data = await getPudimScore(usernameToLoad)
      
      if ('error' in data) {
        setError(data.error)
      } else {
        setResult(data)
        
        // Check if user qualifies for top 10
        setCheckingQualification(true)
        try {
          const qualifies = await wouldQualifyForTop10(data.score)
          setQualifiesForTop10(qualifies)
        } catch {
          setQualifiesForTop10(false)
        } finally {
          setCheckingQualification(false)
        }
      }
    } catch (error) {
      const errorName = error instanceof Error ? error.name : typeof error
      
      // Provide more specific error message based on error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else if (error instanceof Error && error.message.includes('timeout')) {
        setError('Request timed out. Please try again.')
      } else {
        setError(`An unexpected error occurred. Please try again. (Error: ${errorName})`)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    loadStats(username)
  }

  useEffect(() => {
    if (initialUsername) {
      loadStats(initialUsername)
    }
  }, [initialUsername, loadStats])

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input 
          className="flex-1 bg-background/50 backdrop-blur-sm" 
          placeholder="GitHub Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calculate"}
        </Button>
      </form>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <Card className="border-2 border-primary/20 overflow-hidden relative shadow-md hover:shadow-lg transition-shadow">
           <div className="absolute -top-8 -right-4 p-4 opacity-10 text-8xl select-none pointer-events-none">
            {result.rank.emoji}
           </div>
          <CardHeader className="px-3 pt-2 pb-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.stats.avatar_url} alt={result.stats.username} className="w-20 h-20 rounded-full border-2 border-primary" />
                <div className="text-left"> 
                  <CardTitle className="text-base leading-tight">{result.stats.username}</CardTitle>
                  <CardDescription className="text-[10px] leading-tight">Member since {new Date(result.stats.created_at).getFullYear()}</CardDescription>
                </div>
              </div>
              {/* Rank Display on the Right */}
              <div className="text-right pl-1">
                <div className={`text-2xl font-extrabold leading-none ${result.rank.color}`}>
                  {result.rank.rank}
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Dialog open={showRankInfo} onOpenChange={setShowRankInfo}>
                    <DialogTrigger asChild>
                      <button 
                        className="hover:opacity-70 transition-opacity" 
                        title="View ranking thresholds"
                        aria-label="View ranking thresholds"
                      >
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Pudim Rank Thresholds</DialogTitle>
                        <DialogDescription>
                          How your Pudim Score translates into ranks and titles
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-sm">
                          <p className="mb-3 text-muted-foreground">
                            The Pudim Score uses a weighted algorithm:
                          </p>
                          <code className="block bg-muted p-3 rounded-md text-xs mb-4">
                            score = (followers × 0.5) + (total_stars × 2) + (public_repos × 1)
                          </code>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3 font-semibold">Score</th>
                                <th className="text-left py-2 px-3 font-semibold">Rank</th>
                                <th className="text-left py-2 px-3 font-semibold">Title</th>
                                <th className="text-left py-2 px-3 font-semibold">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3">1000+</td>
                                <td className="py-2 px-3">
                                  <span className="font-bold text-amber-500">S+</span>
                                </td>
                                <td className="py-2 px-3">Legendary Flan 🍮✨</td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  The texture is perfect, the caramel is divine. You are a coding god!
                                </td>
                              </tr>
                              <tr className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3">500-999</td>
                                <td className="py-2 px-3">
                                  <span className="font-bold text-yellow-600">S</span>
                                </td>
                                <td className="py-2 px-3">Master Pudim 🍮</td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  A delicious result. Michelin star worthy.
                                </td>
                              </tr>
                              <tr className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3">200-499</td>
                                <td className="py-2 px-3">
                                  <span className="font-bold text-orange-500">A</span>
                                </td>
                                <td className="py-2 px-3">Tasty Pudding 😋</td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  Everyone wants a slice. Great job!
                                </td>
                              </tr>
                              <tr className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3">100-199</td>
                                <td className="py-2 px-3">
                                  <span className="font-bold text-orange-400">B</span>
                                </td>
                                <td className="py-2 px-3">Sweet Treat 🍬</td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  Solid and dependable. A good dessert.
                                </td>
                              </tr>
                              <tr className="border-b hover:bg-muted/50">
                                <td className="py-2 px-3">50-99</td>
                                <td className="py-2 px-3">
                                  <span className="font-bold text-yellow-700">C</span>
                                </td>
                                <td className="py-2 px-3">Homemade 🏠</td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  Made with love, but room for improvement.
                                </td>
                              </tr>
                              <tr className="hover:bg-muted/50">
                                <td className="py-2 px-3">0-49</td>
                                <td className="py-2 px-3">
                                  <span className="font-bold text-zinc-500">D</span>
                                </td>
                                <td className="py-2 px-3">Underbaked 🥚</td>
                                <td className="py-2 px-3 text-muted-foreground">
                                  Needs a bit more time in the oven.
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <div className={`text-[10px] font-bold whitespace-nowrap leading-tight ${result.rank.color}`}>
                    {result.rank.title}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-0 pt-0 space-y-0 !mt-0">
            {/* Stats Row */}
            <div className="flex justify-between items-center text-center">
              <div className="flex flex-col items-center px-1">
                <Star className="h-3.5 w-3.5 text-yellow-500 mb-0.5" />
                <span className="font-bold text-sm leading-tight">{result.stats.total_stars}</span>
                <span className="text-[9px] text-muted-foreground uppercase leading-tight">Stars</span>
              </div>
              <div className="flex flex-col items-center px-1">
                <Users className="h-3.5 w-3.5 text-blue-500 mb-0.5" />
                <span className="font-bold text-sm leading-tight">{result.stats.followers}</span>
                <span className="text-[9px] text-muted-foreground uppercase leading-tight">Followers</span>
              </div>
              <div className="flex flex-col items-center px-1">
                <GitFork className="h-3.5 w-3.5 text-purple-500 mb-0.5" />
                <span className="font-bold text-sm leading-tight">{result.stats.public_repos}</span>
                <span className="text-[9px] text-muted-foreground uppercase leading-tight">Repos</span>
              </div>
              <div className="flex flex-col items-center px-1">
                <Trophy className="h-3.5 w-3.5 text-primary mb-0.5" />
                <span className="font-bold text-sm leading-tight">{Math.round(result.score)}</span>
                <span className="text-[9px] text-muted-foreground uppercase leading-tight">Score</span>
              </div>
            </div>

            {/* Languages / Flavors Section */}
            {result.stats.languages && result.stats.languages.length > 0 && (
              <div className="space-y-1.5 mt-3">
                 <h3 className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider text-center">Pudim Flavors</h3>
                 
                 {/* Progress Bar */}
                 <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    {result.stats.languages.map((lang) => (
                      <div 
                        key={lang.name}
                        style={{ width: `${lang.percentage}%`, backgroundColor: languageColors[lang.name] || '#ccc' }}
                        title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
                        className="h-full"
                      />
                    ))}
                 </div>

                 {/* Legend */}
                 <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
                    {result.stats.languages.map((lang) => (
                      <div key={lang.name} className="flex items-center gap-0.5">
                        <span 
                          className="h-1.5 w-1.5 rounded-full" 
                          style={{ backgroundColor: languageColors[lang.name] || '#ccc' }}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {lang.name} <span className="opacity-50">{Math.round(lang.percentage)}%</span>
                        </span>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result && qualifiesForTop10 && (
        <>
          {/* Leaderboard Consent Section - Only shown if user qualifies for top 10 */}
          <Card className="mt-3 h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="h-10 w-10 text-primary" />
                <CardTitle>Join the Leaderboard</CardTitle>
              </div>
              <CardDescription className="mt-2 text-left">
                Your score of <Badge variant="default" className="font-bold">{Math.round(result.score)}</Badge> <Badge variant="secondary" className={result.rank.color}>{result.rank.title}</Badge> qualifies for the top 10! Opt in to appear in the leaderboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-left">Leaderboard Includes:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>Your GitHub avatar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Rank and title</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Stars, followers & repos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary" />
                    <span>Your calculated score</span>
                  </li>
                </ul>
              </div>
              {!consentSaved && (
                <>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <input
                      type="checkbox"
                      id="leaderboard-consent"
                      checked={leaderboardConsent}
                      onChange={(e) => setLeaderboardConsent(e.target.checked)}
                      disabled={savingConsent || checkingQualification}
                      className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                    />
                    <label htmlFor="leaderboard-consent" className="text-sm text-muted-foreground cursor-pointer flex-1">
                      I consent to appear in the leaderboard
                    </label>
                  </div>
                  {leaderboardConsent && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!result) return
                        setSavingConsent(true)
                        try {
                          const response = await updateLeaderboardConsent(
                            result.stats.username,
                            true
                          )
                          if (response.success) {
                            setConsentSaved(true)
                            setShowToast(true)
                            if (response.position) {
                              setRankingPosition(response.position)
                            }
                            // Hide toast after 3 seconds
                            setTimeout(() => setShowToast(false), 3000)
                          }
                        } catch {
                          setLeaderboardConsent(false)
                        } finally {
                          setSavingConsent(false)
                        }
                      }}
                      disabled={savingConsent}
                      className="w-full"
                    >
                      {savingConsent ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save & Join Leaderboard'
                      )}
                    </Button>
                  )}
                </>
              )}
              {consentSaved && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Your ranking:</span>
                    {rankingPosition ? (
                      <Badge variant="default" className="font-bold">
                        #{rankingPosition}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-bold">
                        In Top 10
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Toast Notification */}
          {showToast && (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <Card className="border-primary/20 shadow-lg max-w-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Trophy className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-card-foreground mb-1 text-left">Success!</p>
                      <p className="text-sm text-muted-foreground leading-relaxed text-left">
                        You&apos;ve been added to the leaderboard{rankingPosition ? ` at position ` : ''}
                        {rankingPosition && (
                          <Badge variant="default" className="ml-1 font-bold">
                            #{rankingPosition}
                          </Badge>
                        )}
                        {!rankingPosition && '!'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {result && (
        <div className="flex flex-col items-center gap-2 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Share2 className="h-3 w-3" />
            <span>Share your score:</span>
          </div>
          <div className="flex gap-2">
            {/* X (Twitter) */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `🍮 I just got a ${result.rank.rank} rank (${result.rank.title}) on pudim.dev! My Dev Pudim Score: ${Math.round(result.score)}\n\nCheck yours at:`
              )}&url=${encodeURIComponent(`https://pudim.dev/calculator/${result.stats.username}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-[#000000] hover:bg-[#000000]/90 text-white transition-colors"
              title="Share on X"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* Bluesky */}
            <a
              href={`https://bsky.app/intent/compose?text=${encodeURIComponent(
                `🍮 I just got a ${result.rank.rank} rank (${result.rank.title}) on pudim.dev! My Dev Pudim Score: ${Math.round(result.score)}\n\nCheck yours at: https://pudim.dev/calculator/${result.stats.username}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-[#0085ff] hover:bg-[#0085ff]/90 text-white transition-colors"
              title="Share on Bluesky"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                `https://pudim.dev/calculator/${result.stats.username}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-[#1877F2] hover:bg-[#1877F2]/90 text-white transition-colors"
              title="Share on Facebook"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                `https://pudim.dev/calculator/${result.stats.username}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white transition-colors"
              title="Share on LinkedIn"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
