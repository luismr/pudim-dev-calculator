import { ImageResponse } from 'next/og'
import { getGithubStats } from '@/app/actions'

export const runtime = 'edge'

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

type PudimRank = {
  rank: string
  title: string
  description: string
  emoji: string
  color: string
}

function calculatePudimScore(stats: any): { score: number; rank: PudimRank } {
  const score = (stats.followers * 0.5) + (stats.total_stars * 2) + (stats.public_repos * 1)
  
  let rank: PudimRank
  
  if (score > 1000) {
    rank = { rank: "S+", title: "Legendary Flan", description: "The texture is perfect!", emoji: "🍮✨", color: "#f59e0b" }
  } else if (score > 500) {
    rank = { rank: "S", title: "Master Pudim", description: "Michelin star worthy.", emoji: "🍮", color: "#ca8a04" }
  } else if (score > 200) {
    rank = { rank: "A", title: "Tasty Pudding", description: "Everyone wants a slice!", emoji: "😋", color: "#f97316" }
  } else if (score > 100) {
    rank = { rank: "B", title: "Sweet Treat", description: "A good dessert.", emoji: "🍬", color: "#fb923c" }
  } else if (score > 50) {
    rank = { rank: "C", title: "Homemade", description: "Made with love.", emoji: "🏠", color: "#a16207" }
  } else {
    rank = { rank: "D", title: "Underbaked", description: "Needs more time.", emoji: "🥚", color: "#71717a" }
  }

  return { score, rank }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const decodedUsername = decodeURIComponent(username)
    
    // Fetch GitHub stats
    const stats = await getGithubStats(decodedUsername)
    
    if (stats.error) {
      // Return error badge
      return new ImageResponse(
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
    }

    const { score, rank } = calculatePudimScore(stats)
    const topLanguages = stats.languages?.slice(0, 5) || []

    return new ImageResponse(
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
                    color: rank.color,
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
                    color: rank.color,
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
                  {topLanguages.map((lang: any) => (
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
                  {topLanguages.map((lang: any) => (
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
  } catch (error) {
    console.error('Badge generation error:', error)
    return new ImageResponse(
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
  }
}

