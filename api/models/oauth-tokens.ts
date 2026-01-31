import { Pool } from 'pg'

export interface OAuthToken {
  id: string
  user_id: string
  platform: 'tiktok' | 'meta' | 'google'
  access_token: string
  refresh_token: string | null
  expires_at: Date
  created_at: Date
}

export interface ConnectedPlatform {
  id: string
  user_id: string
  platform: 'tiktok' | 'meta' | 'google'
  platform_user_id: string
  platform_username: string
  platform_email?: string
  connected_at: Date
}

export class OAuthTokenModel {
  constructor(private pool: Pool) {}

  async createToken(data: {
    user_id: string
    platform: 'tiktok' | 'meta' | 'google'
    access_token: string
    refresh_token: string | null
    expires_at: Date
  }) {
    const query = `
      INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await this.pool.query(query, [
      data.user_id,
      data.platform,
      data.access_token,
      data.refresh_token,
      data.expires_at,
    ])
    return result.rows[0]
  }

  async getTokenByUserAndPlatform(userId: string, platform: string) {
    const query = `
      SELECT * FROM oauth_tokens
      WHERE user_id = $1 AND platform = $2
      ORDER BY created_at DESC
      LIMIT 1
    `
    const result = await this.pool.query(query, [userId, platform])
    return result.rows[0]
  }

  async updateToken(id: string, accessToken: string, expiresAt: Date) {
    const query = `
      UPDATE oauth_tokens
      SET access_token = $1, expires_at = $2, created_at = NOW()
      WHERE id = $3
      RETURNING *
    `
    const result = await this.pool.query(query, [accessToken, expiresAt, id])
    return result.rows[0]
  }

  async deleteToken(id: string) {
    const query = `DELETE FROM oauth_tokens WHERE id = $1`
    await this.pool.query(query, [id])
  }
}

export class ConnectedPlatformModel {
  constructor(private pool: Pool) {}

  async createPlatform(data: {
    user_id: string
    platform: 'tiktok' | 'meta' | 'google'
    platform_user_id: string
    platform_username: string
    platform_email?: string
  }) {
    const query = `
      INSERT INTO connected_platforms (user_id, platform, platform_user_id, platform_username, platform_email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await this.pool.query(query, [
      data.user_id,
      data.platform,
      data.platform_user_id,
      data.platform_username,
      data.platform_email,
    ])
    return result.rows[0]
  }

  async getPlatformsByUser(userId: string) {
    const query = `
      SELECT * FROM connected_platforms
      WHERE user_id = $1
      ORDER BY connected_at DESC
    `
    const result = await this.pool.query(query, [userId])
    return result.rows
  }

  async deletePlatform(id: string) {
    const query = `DELETE FROM connected_platforms WHERE id = $1`
    await this.pool.query(query, [id])
  }
}
