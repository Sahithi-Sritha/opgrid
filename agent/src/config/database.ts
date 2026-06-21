// PostgreSQL Database Configuration (AWS RDS)
import { Pool, QueryResult } from 'pg'

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'opgrid',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err)
  process.exit(-1)
})

// Helper function for queries
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const duration = Date.now() - start
    if (duration > 1000) {
      console.warn(`⚠️  Slow query (${duration}ms): ${text}`)
    }
    return res
  } catch (error) {
    console.error('Database query error:', error)
    console.error('Query:', text)
    console.error('Params:', params)
    throw error
  }
}

// Helper for transactions
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing database pool')
  await pool.end()
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing database pool')
  await pool.end()
})

export default pool
