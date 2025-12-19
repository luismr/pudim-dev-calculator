import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import type { GitHubStats, PudimRank } from '@/lib/pudim/types'
import { getCachedStatistics, setCachedStatistics, invalidateStatisticsCache } from '@/lib/redis'

const TABLE_NAME = 'PudimScores'

export type PudimScoreRecord = {
  username: string
  timestamp: string // ISO 8601 UTC timestamp
  score: number
  rank: PudimRank
  stats: GitHubStats
  leaderboard_consent?: boolean // User consent to appear in leaderboard
}

export type TopScoreEntry = {
  username: string
  timestamp: string
  score: number
  rank: PudimRank
  avatar_url: string
  followers: number
  total_stars: number
  public_repos: number
}

// Circuit breaker state
let circuitBreakerOpenUntil: number | null = null
let client: DynamoDBClient | null = null
let docClient: DynamoDBDocumentClient | null = null

/**
 * Check if DynamoDB is enabled via environment variable
 */
function isDynamoDBEnabled(): boolean {
  return process.env.DYNAMODB_ENABLED === 'true'
}

/**
 * Check if circuit breaker is open (DynamoDB should not be used)
 */
function isCircuitBreakerOpen(): boolean {
  if (circuitBreakerOpenUntil === null) {
    return false
  }

  const now = Date.now()
  if (now >= circuitBreakerOpenUntil) {
    // Cooldown period expired, reset circuit breaker
    circuitBreakerOpenUntil = null
    return false
  }

  return true
}

/**
 * Open circuit breaker (stop using DynamoDB for cooldown period)
 */
function openCircuitBreaker(): void {
  const cooldown = parseInt(
    process.env.DYNAMODB_CIRCUIT_BREAKER_COOLDOWN || '300000',
    10
  )
  circuitBreakerOpenUntil = Date.now() + cooldown
  console.log(JSON.stringify({ level: 'warn', message: 'DynamoDB circuit breaker opened', cooldown_ms: cooldown }))
}

/**
 * Close the circuit breaker (re-enable DynamoDB)
 */
export function closeCircuitBreaker(): void {
  circuitBreakerOpenUntil = null
}

/**
 * Get or create DynamoDB clients (lazy initialization)
 * Returns null if DynamoDB is disabled or circuit breaker is open
 */
function getClients(): {
  client: DynamoDBClient
  docClient: DynamoDBDocumentClient
} | null {
  // Check if DynamoDB is enabled
  if (!isDynamoDBEnabled()) {
    return null
  }

  // Check circuit breaker
  if (isCircuitBreakerOpen()) {
    return null
  }

  // Create clients if they don't exist
  if (!client || !docClient) {
    try {
      const config: {
        region: string
        endpoint?: string
        credentials: {
          accessKeyId: string
          secretAccessKey: string
        }
      } = {
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
        },
      }

      // Only set endpoint if provided (for local development)
      // In production, omit endpoint to use AWS DynamoDB
      if (process.env.DYNAMODB_ENDPOINT) {
        config.endpoint = process.env.DYNAMODB_ENDPOINT
      }

      client = new DynamoDBClient(config)
      docClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorName = error instanceof Error ? error.name : typeof error
      console.error(JSON.stringify({ level: 'error', message: 'Failed to create DynamoDB clients', error: errorMessage, error_name: errorName }))
      openCircuitBreaker()
      return null
    }
  }

  return { client, docClient }
}

/**
 * Ensures the DynamoDB table exists
 * Returns true if table exists or was created, false otherwise
 * Table schema:
 * - Partition key: username (String)
 * - Sort key: timestamp (String) - descending order for latest first
 * - GSI: score-index with score as partition key for top scores queries
 */
export async function ensureTableExists(): Promise<boolean> {
  const clients = getClients()
  if (!clients) {
    return false
  }

  try {
    await clients.docClient.send(
      new DescribeTableCommand({
        TableName: TABLE_NAME,
      })
    )
    return true
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      // Create table with GSI for querying top scores
      try {
        await clients.client.send(
          new CreateTableCommand({
            TableName: TABLE_NAME,
            KeySchema: [
              { AttributeName: 'username', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            AttributeDefinitions: [
              { AttributeName: 'username', AttributeType: 'S' },
              { AttributeName: 'timestamp', AttributeType: 'S' },
              { AttributeName: 'score', AttributeType: 'N' },
            ],
            GlobalSecondaryIndexes: [
              {
                IndexName: 'score-index',
                KeySchema: [{ AttributeName: 'score', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                  ReadCapacityUnits: 5,
                  WriteCapacityUnits: 5,
                },
              },
            ],
            BillingMode: 'PROVISIONED',
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          })
        )
        return true
      } catch (createError) {
        // If table was created by another concurrent request, that's fine
        if (createError instanceof ResourceInUseException) {
          return true
        }
        const errorMessage = createError instanceof Error ? createError.message : 'Unknown error'
        const errorName = createError instanceof Error ? createError.name : typeof createError
        console.error(JSON.stringify({ level: 'error', message: 'Failed to create DynamoDB table', error: errorMessage, error_name: errorName }))
        openCircuitBreaker()
        return false
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorName = error instanceof Error ? error.name : typeof error
      console.error(JSON.stringify({ level: 'error', message: 'DynamoDB table check failed', error: errorMessage, error_name: errorName }))
      openCircuitBreaker()
      return false
    }
  }
}

/**
 * Saves a pudim score record to DynamoDB
 * Only saves if the score has changed from the last saved score
 * Silently returns if DynamoDB is disabled or unavailable
 * @param leaderboardConsent - User consent to appear in leaderboard (default: false)
 */
export async function savePudimScore(
  username: string,
  score: number,
  rank: PudimRank,
  stats: GitHubStats,
  leaderboardConsent: boolean = false
): Promise<void> {
  const clients = getClients()
  if (!clients) {
    // DynamoDB is disabled or circuit breaker is open
    console.log(JSON.stringify({ level: 'info', message: '[DynamoDB] SAVE skipped', reason: 'DynamoDB disabled or circuit breaker open', username, score: Math.round(score), rank: rank.rank, timestamp: new Date().toISOString() }))
    return
  }

  try {
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      console.log(JSON.stringify({ level: 'info', message: '[DynamoDB] SAVE skipped', reason: 'table does not exist', username, score: Math.round(score), rank: rank.rank, timestamp: new Date().toISOString() }))
      return
    }

    // Check if user has an existing score
    const existingScore = await getUserLatestScore(username)
    
    // Only save if score has changed (or no existing score)
    if (existingScore !== null) {
      // Round scores for comparison to avoid floating point precision issues
      const existingScoreRounded = Math.round(existingScore.score)
      const newScoreRounded = Math.round(score)
      
      if (existingScoreRounded === newScoreRounded) {
        console.log(JSON.stringify({ level: 'info', message: '[DynamoDB] SAVE skipped', reason: 'score unchanged', username, score: newScoreRounded, rank: rank.rank, existing_timestamp: existingScore.timestamp, timestamp: new Date().toISOString() }))
        return
      }
      
      console.log(JSON.stringify({ level: 'info', message: '[DynamoDB] Score changed', username, previous_score: existingScoreRounded, new_score: newScoreRounded, previous_rank: existingScore.rank.rank, new_rank: rank.rank, previous_timestamp: existingScore.timestamp }))
    }

    const timestamp = new Date().toISOString()

    const record: PudimScoreRecord = {
      username,
      timestamp,
      score,
      rank,
      stats,
      leaderboard_consent: leaderboardConsent,
    }

    await clients.docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: record,
      })
    )
    
    console.log(JSON.stringify({ level: 'info', message: '[DynamoDB] SAVE successful', username, score: Math.round(score), rank: rank.rank, rank_title: rank.title, timestamp, followers: stats.followers, total_stars: stats.total_stars, public_repos: stats.public_repos, is_new_user: existingScore === null }))
    
    // Invalidate and refresh statistics cache after saving a new score
    invalidateStatisticsCache().catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(JSON.stringify({ level: 'error', message: '[DynamoDB] Failed to invalidate statistics cache after save', username, error: errorMessage, timestamp: new Date().toISOString() }))
    })
    
    // Refresh statistics cache in background (fire and forget)
    getStatistics().catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(JSON.stringify({ level: 'error', message: '[DynamoDB] Failed to refresh statistics cache after save', username, error: errorMessage, timestamp: new Date().toISOString() }))
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    console.error(JSON.stringify({ level: 'error', message: '[DynamoDB] Failed to save score', username, score: Math.round(score), rank: rank.rank, error: errorMessage, error_name: errorName, timestamp: new Date().toISOString() }))
    openCircuitBreaker()
    throw error
  }
}

/**
 * Updates the leaderboard consent for the user's latest score
 * Only updates if DynamoDB is enabled and available
 */
export async function updateConsentForLatestScore(
  username: string,
  consent: boolean
): Promise<void> {
  const clients = getClients()
  if (!clients) {
    console.log(JSON.stringify({ level: 'info', message: '[DynamoDB] UPDATE consent skipped', reason: 'DynamoDB disabled or circuit breaker open', username, consent }))
    return
  }

  try {
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      console.log(JSON.stringify({ level: 'info', message: '[DynamoDB] UPDATE consent skipped', reason: 'table does not exist', username, consent }))
      return
    }

    // Get the latest score for this user
    const latestScore = await getUserLatestScore(username)
    if (!latestScore) {
      console.log(JSON.stringify({ level: 'info', message: '[DynamoDB] UPDATE consent skipped', reason: 'no score found for user', username, consent }))
      return
    }

    // Update the consent field for the latest record
    await clients.docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          username: latestScore.username,
          timestamp: latestScore.timestamp,
        },
        UpdateExpression: 'SET leaderboard_consent = :consent',
        ExpressionAttributeValues: {
          ':consent': consent,
        },
      })
    )

    console.log(JSON.stringify({ level: 'info', message: '[DynamoDB] UPDATE consent successful', username, consent, timestamp: latestScore.timestamp }))
    
    // Invalidate and refresh statistics cache after updating consent
    // Consent changes affect totalConsents count in statistics
    invalidateStatisticsCache().catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(JSON.stringify({ level: 'error', message: '[DynamoDB] Failed to invalidate statistics cache after consent update', username, error: errorMessage, timestamp: new Date().toISOString() }))
    })
    
    // Refresh statistics cache in background (fire and forget)
    getStatistics().catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(JSON.stringify({ level: 'error', message: '[DynamoDB] Failed to refresh statistics cache after consent update', username, error: errorMessage, timestamp: new Date().toISOString() }))
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    console.error(JSON.stringify({ level: 'error', message: '[DynamoDB] Failed to update consent', username, consent, error: errorMessage, error_name: errorName }))
    openCircuitBreaker()
    throw error
  }
}

/**
 * Gets the latest score for a specific user
 * Returns null if DynamoDB is disabled, unavailable, or user not found
 */
export async function getUserLatestScore(
  username: string
): Promise<PudimScoreRecord | null> {
  const clients = getClients()
  if (!clients) {
    return null
  }

  try {
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      return null
    }

    const result = await clients.docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username,
        },
        ScanIndexForward: false, // descending order (latest first)
        Limit: 1,
      })
    )

    if (!result.Items || result.Items.length === 0) {
      return null
    }

    return result.Items[0] as PudimScoreRecord
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    console.error(JSON.stringify({ level: 'error', message: 'Failed to get user latest score from DynamoDB', username, error: errorMessage, error_name: errorName }))
    openCircuitBreaker()
    return null
  }
}

/**
 * Gets top 10 scores across all users
 * Returns the latest score entry for each unique user, sorted by score descending
 * Returns empty array if DynamoDB is disabled or unavailable
 */
export async function getTop10Scores(): Promise<TopScoreEntry[]> {
  const clients = getClients()
  if (!clients) {
    return []
  }

  try {
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      return []
    }

    // Scan all records and get the latest for each user
    const result = await clients.docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    )

    if (!result.Items || result.Items.length === 0) {
      return []
    }

    // First, filter to only entries with consent
    // Then group by username (normalized to lowercase) and keep only the latest entry per user
    // GitHub usernames are case-insensitive, so we normalize them
    const userLatestScores = new Map<string, PudimScoreRecord>()

    for (const item of result.Items as PudimScoreRecord[]) {
      // Only process entries with consent
      if (item.leaderboard_consent !== true) {
        continue
      }

      // Normalize username: lowercase and trim whitespace
      const normalizedUsername = item.username.toLowerCase().trim()
      
      // Update the item's username to normalized version for consistency
      const normalizedItem: PudimScoreRecord = {
        ...item,
        username: normalizedUsername,
      }
      
      const existing = userLatestScores.get(normalizedUsername)
      if (!existing || normalizedItem.timestamp > existing.timestamp) {
        userLatestScores.set(normalizedUsername, normalizedItem)
      }
    }

    // Convert to array, sort by score descending, take top 10
    const topScores = Array.from(userLatestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((record) => ({
        username: record.username,
        timestamp: record.timestamp,
        score: record.score,
        rank: record.rank,
        avatar_url: record.stats.avatar_url,
        followers: record.stats.followers,
        total_stars: record.stats.total_stars,
        public_repos: record.stats.public_repos,
      }))

    return topScores
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    console.error(JSON.stringify({ level: 'error', message: 'Failed to get top scores from DynamoDB', error: errorMessage, error_name: errorName }))
    openCircuitBreaker()
    return []
  }
}

/**
 * Gets all scores for a specific user with pagination
 * Returns empty array if DynamoDB is disabled or unavailable
 */
export async function getUserScoreHistory(
  username: string,
  limit: number = 10
): Promise<PudimScoreRecord[]> {
  const clients = getClients()
  if (!clients) {
    return []
  }

  try {
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      return []
    }

    const result = await clients.docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username,
        },
        ScanIndexForward: false, // descending order (latest first)
        Limit: limit,
      })
    )

    return (result.Items || []) as PudimScoreRecord[]
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    console.error(JSON.stringify({ level: 'error', message: 'Failed to get user score history from DynamoDB', username, error: errorMessage, error_name: errorName }))
    openCircuitBreaker()
    return []
  }
}

export type StatisticsData = {
  totalScores: number
  totalConsents: number
  uniqueUsers: number
  rankDistribution: Record<string, number> // rank -> count
  languageDistribution: Record<string, number> // language name -> count (number of users using this language)
  averageScore: number
}

/**
 * Gets statistics about all scores in the database
 * Returns statistics including total scores, consents, unique users, rank distribution, and average score
 * Returns default values if DynamoDB is disabled or unavailable
 * Uses Redis cache if enabled to reduce DynamoDB scan operations
 */
export async function getStatistics(): Promise<StatisticsData> {
  // Check cache first if Redis is enabled
  const cachedStats = await getCachedStatistics()
  if (cachedStats) {
    console.log(JSON.stringify({ level: 'info', message: '[Statistics] Using cached data', timestamp: new Date().toISOString() }))
    return cachedStats
  }

  const clients = getClients()
  if (!clients) {
    return {
      totalScores: 0,
      totalConsents: 0,
      uniqueUsers: 0,
      rankDistribution: {},
      languageDistribution: {},
      averageScore: 0,
    }
  }

  try {
    const tableExists = await ensureTableExists()
    if (!tableExists) {
      return {
        totalScores: 0,
        totalConsents: 0,
        uniqueUsers: 0,
        rankDistribution: {},
        languageDistribution: {},
        averageScore: 0,
      }
    }

    console.log(JSON.stringify({ level: 'info', message: '[Statistics] Fetching from DynamoDB', timestamp: new Date().toISOString() }))

    // Scan all records
    const result = await clients.docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    )

    if (!result.Items || result.Items.length === 0) {
      return {
        totalScores: 0,
        totalConsents: 0,
        uniqueUsers: 0,
        rankDistribution: {},
        languageDistribution: {},
        averageScore: 0,
      }
    }

    const records = result.Items as PudimScoreRecord[]
    
    // Calculate statistics
    const totalScores = records.length
    const totalConsents = records.filter((r) => r.leaderboard_consent === true).length
    
    // Get unique users (using latest score per user)
    const userLatestScores = new Map<string, PudimScoreRecord>()
    for (const item of records) {
      const existing = userLatestScores.get(item.username)
      if (!existing || item.timestamp > existing.timestamp) {
        userLatestScores.set(item.username, item)
      }
    }
    const uniqueUsers = userLatestScores.size
    
    // Rank distribution (using latest score per user)
    const rankDistribution: Record<string, number> = {}
    for (const record of userLatestScores.values()) {
      const rank = record.rank.rank
      rankDistribution[rank] = (rankDistribution[rank] || 0) + 1
    }
    
    // Language distribution (using latest score per user)
    // Count how many users use each language (at least once in their top languages)
    const languageDistribution: Record<string, number> = {}
    for (const record of userLatestScores.values()) {
      if (record.stats.languages && record.stats.languages.length > 0) {
        // Count each language the user has (even if they have multiple languages)
        for (const lang of record.stats.languages) {
          languageDistribution[lang.name] = (languageDistribution[lang.name] || 0) + 1
        }
      }
    }
    
    // Average score (using latest score per user)
    const scores = Array.from(userLatestScores.values()).map((r) => r.score)
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0

    const statistics: StatisticsData = {
      totalScores,
      totalConsents,
      uniqueUsers,
      rankDistribution,
      languageDistribution,
      averageScore,
    }

    // Cache the result if Redis is enabled (fire and forget)
    setCachedStatistics(statistics).catch((error) => {
      // Log but don't throw - caching failures shouldn't break the app
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorName = error instanceof Error ? error.name : typeof error
      console.error(JSON.stringify({ level: 'error', message: '[Statistics] Failed to cache statistics', error: errorMessage, error_name: errorName, timestamp: new Date().toISOString() }))
    })

    return statistics
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorName = error instanceof Error ? error.name : typeof error
    console.error(JSON.stringify({ level: 'error', message: 'Failed to get statistics from DynamoDB', error: errorMessage, error_name: errorName }))
    openCircuitBreaker()
    return {
      totalScores: 0,
      totalConsents: 0,
      uniqueUsers: 0,
      rankDistribution: {},
      languageDistribution: {},
      averageScore: 0,
    }
  }
}
