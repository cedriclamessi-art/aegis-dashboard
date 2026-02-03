import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'aegis_media_buying',
  user: process.env.DB_USER || 'aegis_app',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Unexpected database error:', err)
})

export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms):`, text.substring(0, 100))
    }
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export const getClient = () => pool.connect()

export default pool
