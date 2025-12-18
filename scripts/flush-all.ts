#!/usr/bin/env tsx
/**
 * Flush DynamoDB and Redis for testing
 * 
 * Usage:
 *   npm run flush-all
 *   or
 *   npx tsx scripts/flush-all.ts
 */

// Load environment variables from .env file
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env file from project root
config({ path: resolve(process.cwd(), '.env') })

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import Redis from 'ioredis'

const TABLE_NAME = 'PudimScores'

async function flushDynamoDB() {
  const dynamodbEnabled = process.env.DYNAMODB_ENABLED === 'true'
  
  if (!dynamodbEnabled) {
    console.log('⚠️  DynamoDB is not enabled. Skipping DynamoDB flush.')
    return
  }

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

    if (process.env.DYNAMODB_ENDPOINT) {
      config.endpoint = process.env.DYNAMODB_ENDPOINT
    }

    const client = new DynamoDBClient(config)
    const docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    })

    console.log('🗑️  Flushing DynamoDB...')

    // Scan all items
    let itemsDeleted = 0
    let lastEvaluatedKey: Record<string, unknown> | undefined = undefined

    do {
      const scanResult: { Items?: Array<Record<string, unknown>>; LastEvaluatedKey?: Record<string, unknown> } = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      )

      if (scanResult.Items && scanResult.Items.length > 0) {
        // Delete all items in batch
        for (const item of scanResult.Items) {
          await docClient.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: {
                username: item.username,
                timestamp: item.timestamp,
              },
            })
          )
          itemsDeleted++
        }
      }

      lastEvaluatedKey = scanResult.LastEvaluatedKey
    } while (lastEvaluatedKey)

    console.log(`✅ DynamoDB flushed: ${itemsDeleted} items deleted`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error flushing DynamoDB: ${errorMessage}`)
    throw error
  }
}

async function flushRedis() {
  const redisEnabled = process.env.REDIS_ENABLED === 'true'
  
  if (!redisEnabled) {
    console.log('⚠️  Redis is not enabled. Skipping Redis flush.')
    return
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    const client = new Redis(redisUrl)

    console.log('🗑️  Flushing Redis...')

    // Flush all databases
    await client.flushall()

    await client.quit()
    console.log('✅ Redis flushed: All keys deleted')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error flushing Redis: ${errorMessage}`)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting flush operation...\n')

  try {
    await Promise.all([
      flushDynamoDB(),
      flushRedis(),
    ])
    
    console.log('\n✨ All databases flushed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('\n💥 Flush operation failed:', error)
    process.exit(1)
  }
}

main()

