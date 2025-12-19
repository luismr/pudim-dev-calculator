'use client'

import { useEffect, useState } from 'react'
import { getStatistics } from '@/app/_server/actions'
import type { StatisticsData } from '@/lib/dynamodb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'
import { Calculator, Users, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react'
import type { ChartConfig } from '@/components/ui/chart'
import { useEnv } from '@/contexts/EnvContext'
import { useLeaderboardRefresh } from '@/contexts/LeaderboardRefreshContext'
import { logger } from '@/lib/logger'

/**
 * Rank information - easily extensible
 * 
 * To change a rank color: Update the hex color value (e.g., '#f59e0b')
 * To change a rank title: Update the title string (e.g., 'Legendary Flan')
 * To change a rank emoji: Update the emoji string (e.g., '🍮✨')
 * 
 * Changes will be reflected in the Rank Distribution chart
 */
const RANK_INFO: Record<string, { title: string; emoji: string; color: string }> = {
  'S+': { title: 'Legendary Flan', emoji: '🍮✨', color: '#f59e0b' }, // amber-500
  'S': { title: 'Master Pudim', emoji: '🍮', color: '#ca8a04' }, // yellow-600
  'A': { title: 'Tasty Pudding', emoji: '😋', color: '#f97316' }, // orange-500
  'B': { title: 'Sweet Treat', emoji: '🍬', color: '#fb923c' }, // orange-400
  'C': { title: 'Homemade', emoji: '🏠', color: '#a16207' }, // yellow-700
  'D': { title: 'Underbaked', emoji: '🥚', color: '#71717a' }, // zinc-500
}

/**
 * Language colors - easily extensible
 * 
 * To add a new language color:
 *   1. Add the language name and hex color to this object
 *   2. The color will automatically be used in the Flavor Distribution chart
 * 
 * To change an existing language color:
 *   1. Simply update the hex color value for that language
 *   2. Changes will be reflected immediately
 * 
 * Colors are based on GitHub's language colors where available
 */
const languageColors: Record<string, string> = {
  // Popular languages
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
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
  // Functional languages
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  OCaml: "#3be133",
  Erlang: "#a90533",
  "F#": "#b845fc",
  Clojure: "#db5855",
  Scala: "#c22d40",
  // System/DevOps
  Nix: "#7e7eff",
  Shell: "#89e051",
  PowerShell: "#012456",
  // Data/Research
  R: "#276DC3",
  // Modern languages
  Zig: "#ec915c",
  Nim: "#ffc200",
  Crystal: "#000100",
  // Add more languages as needed - colors can be easily changed here
}

// Helper to get color for a language, with fallback
const getLanguageColor = (languageName: string, index: number): string => {
  // First try exact match
  if (languageColors[languageName]) {
    return languageColors[languageName]
  }
  // Try case-insensitive match
  const lowerName = languageName.toLowerCase()
  const exactMatch = Object.keys(languageColors).find(
    key => key.toLowerCase() === lowerName
  )
  if (exactMatch) {
    return languageColors[exactMatch]
  }
  // Fallback to chart colors
  return `hsl(var(--chart-${(index % 5) + 1}))`
}

// Helper to create a sanitized key for rank (for CSS variables)
// Handle S+ specially to avoid collision with S
const sanitizeRankKey = (rank: string): string => {
  if (rank === 'S+') {
    return 'rankSPlus'
  }
  return `rank${rank.toLowerCase()}`
}

// Helper to create a sanitized key for language (for CSS variables)
const sanitizeLanguageKey = (lang: string): string => {
  return lang.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

export function StatisticsSection() {
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { env } = useEnv()
  const { refreshKey } = useLeaderboardRefresh()
  
  // Only show statistics if DynamoDB is enabled
  const isDynamoDBEnabled = env?.DYNAMODB_ENABLED ?? false

  useEffect(() => {
    // Only fetch if DynamoDB is enabled
    if (!isDynamoDBEnabled) {
      setLoading(false)
      return
    }

    async function fetchStats() {
      setLoading(true)
      try {
        const data = await getStatistics()
        setStats(data)
      } catch (error) {
        logger.error('Failed to load statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isDynamoDBEnabled, refreshKey])

  // Don't render if DynamoDB is not enabled
  if (!isDynamoDBEnabled) {
    return null
  }

  if (loading) {
    return (
      <section id="statistics" className="w-full py-12 md:py-24 lg:py-32 bg-background scroll-mt-14">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center py-8">Loading statistics...</div>
        </div>
      </section>
    )
  }

  if (!stats) {
    return null
  }

  // Prepare data for rank distribution chart
  // Show top 5 ranks by count + "others" for remaining ranks
  const allRankData = Object.entries(stats.rankDistribution || {})
    .map(([rank, count]) => {
      const rankInfo = RANK_INFO[rank] || { title: rank, emoji: '', color: '#71717a' }
      const rankKey = sanitizeRankKey(rank)
      return {
        rank,
        rankKey,
        title: `${rankInfo.title} ${rankInfo.emoji}`,
        value: count,
        color: rankInfo.color,
      }
    })
    .sort((a, b) => b.value - a.value) // Sort by count descending

  // Take top 5 by count and group the rest as "others"
  const top5Ranks = allRankData.slice(0, 5)
  const otherRanks = allRankData.slice(5)
  const othersCount = otherRanks.reduce((sum, entry) => sum + entry.value, 0)
  
  const rankData = [...top5Ranks]
  if (othersCount > 0) {
    rankData.push({
      rank: 'Others',
      rankKey: 'others',
      title: 'Others',
      value: othersCount,
      color: '#9ca3af', // gray-400
    })
  }

  // Create dynamic chart config for ranks
  // Ensure each rankKey is unique
  const rankChartConfig: ChartConfig = {}
  rankData.forEach((entry) => {
    // Each entry should have a unique rankKey already (S+ -> rankSPlus, S -> ranks, etc.)
    rankChartConfig[entry.rankKey] = {
      label: entry.title,
      color: entry.color,
    }
  })
  
  // Debug: Log the rank data to verify uniqueness
  logger.log('📊 Stats:', stats)
  logger.log('📊 Rank Distribution:', stats.rankDistribution)
  logger.log('📊 Language Distribution:', stats.languageDistribution)
  logger.log('📊 Rank Data:', rankData.map(e => ({ rank: e.rank, rankKey: e.rankKey, title: e.title, value: e.value })))
  logger.log('📊 Rank Chart Config:', Object.keys(rankChartConfig))

  // Prepare data for language distribution chart (flavor distribution)
  // Sort by count descending, take top 10 + others
  const allLanguageEntries = Object.entries(stats.languageDistribution || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const top10Languages = allLanguageEntries.slice(0, 10)
  const otherLanguages = allLanguageEntries.slice(10)
  const othersLanguageCount = otherLanguages.reduce((sum, lang) => sum + lang.count, 0)

  const languageEntries = [...top10Languages]
  if (othersLanguageCount > 0) {
    languageEntries.push({ name: 'Others', count: othersLanguageCount })
  }

  // Create dynamic chart config for languages
  // Only include languages that are actually in the chart (top 10 + others)
  const languageChartConfig: ChartConfig = {}
  languageEntries.forEach((lang, index) => {
    const key = sanitizeLanguageKey(lang.name)
    const color = lang.name === 'Others' 
      ? '#9ca3af' // gray-400
      : getLanguageColor(lang.name, index)
    
    languageChartConfig[key] = {
      label: lang.name,
      color: color,
    }
  })

  // Create chart data - only include what's in the top 10 + others
  const flavorData = languageEntries.map((lang, index) => {
    const color = lang.name === 'Others'
      ? '#9ca3af' // gray-400
      : getLanguageColor(lang.name, index)
    
    return {
      language: lang.name,
      languageKey: sanitizeLanguageKey(lang.name),
      value: lang.count,
      color: color,
    }
  })

  // Debug: Log the flavor data
  logger.log('📊 Flavor Data:', flavorData.map(e => ({ language: e.language, value: e.value })))
  logger.log('📊 Language Chart Config:', Object.keys(languageChartConfig))

  return (
    <section id="statistics" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30 scroll-mt-14">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <Badge variant="secondary" className="rounded-full">Statistics</Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
            Community Stats
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
            See how the developer community is scoring
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scores</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScores.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Calculations performed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Developers tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consents</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConsents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Leaderboard participants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.averageScore).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rank Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Rank Distribution
              </CardTitle>
              <CardDescription>
                Distribution of developers by rank
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rankData.length > 0 ? (
                <ChartContainer config={rankChartConfig} className="h-[400px] w-full">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={rankData}
                      dataKey="value"
                      nameKey="rankKey"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      label={({ percent }) => 
                        `${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {rankData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="rankKey" />}
                      verticalAlign="bottom"
                      className="mt-2"
                    />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flavor Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Flavor Distribution
              </CardTitle>
              <CardDescription>
                Distribution of developers by flavor (rank)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flavorData.length > 0 ? (
                <ChartContainer config={languageChartConfig} className="h-[400px] w-full">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={flavorData}
                      dataKey="value"
                      nameKey="languageKey"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      label={({ percent }) => 
                        `${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {flavorData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="languageKey" />}
                      verticalAlign="bottom"
                      className="mt-2"
                    />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

