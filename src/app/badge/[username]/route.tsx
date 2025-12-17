import { ImageResponse } from 'next/og'
import { getGithubStats } from '@/lib/pudim/github'
import { calculatePudimScore } from '@/lib/pudim/score'
import { getCachedBadge, setCachedBadge } from '@/lib/redis'
import type { GitHubStats } from '@/lib/pudim/types'

// Use Node.js runtime to enable Redis caching (with circuit breaker fallback)
// Edge runtime would skip Redis entirely since it doesn't support ioredis
export const runtime = 'nodejs'

// Map popular languages to colors
const languageColors: Record<string, string> = {
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
}

// Map Tailwind color classes to hex for badge rendering
const rankColorMap: Record<string, string> = {
  "text-amber-500": "#f59e0b",
  "text-yellow-600": "#ca8a04",
  "text-orange-500": "#f97316",
  "text-orange-400": "#fb923c",
  "text-yellow-700": "#a16207",
  "text-zinc-500": "#71717a",
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const decodedUsername = decodeURIComponent(username)
    
    // Check if we have the full badge image cached in Redis
    const cachedBadge = await getCachedBadge(decodedUsername)
    if (cachedBadge) {
      // Convert Buffer to Uint8Array for Response body
      return new Response(new Uint8Array(cachedBadge), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
          'CDN-Cache-Control': 'public, max-age=300',
        },
      })
    }
    
    // Cache miss - fetch GitHub stats (these are also cached in Redis)
    const stats = await getGithubStats(decodedUsername)
    
    if ('error' in stats) {
      // Return error badge with shorter cache duration
      const errorResponse = new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fef3c7',
                borderRadius: '24px',
                border: '4px solid #d97706',
                padding: '40px',
              }}
            >
              <div style={{ display: 'flex', fontSize: 32, color: '#78350f' }}>
                User not found: {decodedUsername}
              </div>
            </div>
          </div>
        ),
        {
          width: 1000,
          height: 600,
        }
      )
      
      // Cache errors for shorter duration (60 seconds)
      errorResponse.headers.set(
        'Cache-Control',
        'public, max-age=60, s-maxage=60, stale-while-revalidate=30'
      )
      errorResponse.headers.set('CDN-Cache-Control', 'public, max-age=60')
      
      return errorResponse
    }

    // Calculate score using server-side business rule
    const { rank } = calculatePudimScore(stats as GitHubStats)
    const topLanguages = stats.languages?.slice(0, 5) || []
    
    // Map Tailwind color class to hex for badge rendering
    const badgeColor = rankColorMap[rank.color] || rank.color

    // Generate the badge image
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              backgroundColor: '#fef3c7',
              borderRadius: '24px',
              border: '4px solid #d97706',
              padding: '40px',
              position: 'relative',
            }}
          >
          {/* Background emoji */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: '-60px',
              right: '-30px',
              fontSize: '200px',
              opacity: 0.15,
            }}
          >
            {rank.emoji}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
            }}
          >
            {/* Header with avatar and rank */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '40px',
              }}
            >
              {/* User info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stats.avatar_url}
                  alt={stats.username}
                  width="140"
                  height="140"
                  style={{ borderRadius: '100%', border: '4px solid #d97706' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', color: '#1f2937' }}>
                    {stats.username}
                  </div>
                  <div style={{ display: 'flex', fontSize: 24, color: '#6b7280' }}>
                    Member since {new Date(stats.created_at).getFullYear()}
                  </div>
                </div>
              </div>

              {/* Rank badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    fontSize: 72,
                    fontWeight: 900,
                    color: badgeColor,
                    lineHeight: 1,
                  }}
                >
                  {rank.rank}
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: badgeColor,
                  }}
                >
                  {rank.title}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                gap: '40px',
                marginBottom: '40px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', color: '#1f2937' }}>
                  {stats.total_stars}
                </div>
                <div style={{ display: 'flex', fontSize: 20, color: '#6b7280', textTransform: 'uppercase' }}>
                  STARS
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', color: '#1f2937' }}>
                  {stats.followers}
                </div>
                <div style={{ display: 'flex', fontSize: 20, color: '#6b7280', textTransform: 'uppercase' }}>
                  FOLLOWERS
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', fontSize: 48, fontWeight: 'bold', color: '#1f2937' }}>
                  {stats.public_repos}
                </div>
                <div style={{ display: 'flex', fontSize: 20, color: '#6b7280', textTransform: 'uppercase' }}>
                  REPOS
                </div>
              </div>
            </div>

            {/* Languages section */}
            {topLanguages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    fontSize: 18,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    justifyContent: 'center',
                  }}
                >
                  PUDIM FLAVORS
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    display: 'flex',
                    height: '16px',
                    width: '100%',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    backgroundColor: '#e5e7eb',
                  }}
                >
                  {topLanguages.map((lang: { name: string; percentage: number }) => (
                    <div
                      key={lang.name}
                      style={{
                        width: `${lang.percentage}%`,
                        backgroundColor: languageColors[lang.name] || '#cbd5e1',
                      }}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '20px',
                  }}
                >
                  {topLanguages.map((lang: { name: string; percentage: number }) => (
                    <div key={lang.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '999px',
                          backgroundColor: languageColors[lang.name] || '#cbd5e1',
                        }}
                      />
                      <span style={{ fontSize: 18, color: '#6b7280' }}>
                        {lang.name} {Math.round(lang.percentage)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      ),
      {
        width: 1000,
        height: 600,
      }
    )

    // Cache the generated image in Redis (fire and forget)
    // Convert ImageResponse to buffer for caching
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    setCachedBadge(decodedUsername, imageBuffer).catch((error) => {
      // Log but don't throw - caching failures shouldn't break the app
      console.error('Failed to cache badge image:', error)
    })

    // Add cache headers for CDN and browser caching
    imageResponse.headers.set(
      'Cache-Control',
      'public, max-age=300, s-maxage=300, stale-while-revalidate=60'
    )
    imageResponse.headers.set('CDN-Cache-Control', 'public, max-age=300')

    return imageResponse
  } catch (error) {
    console.error('Badge generation error:', error)
    const errorResponse = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fef3c7',
              borderRadius: '24px',
              border: '4px solid #d97706',
            }}
          >
            <div style={{ display: 'flex', fontSize: 32, color: '#78350f' }}>
              Error generating badge
            </div>
          </div>
        </div>
      ),
      {
        width: 1000,
        height: 600,
      }
    )
    
    // Cache errors for shorter duration (60 seconds)
    errorResponse.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=60, stale-while-revalidate=30'
    )
    errorResponse.headers.set('CDN-Cache-Control', 'public, max-age=60')
    
    return errorResponse
  }
}

