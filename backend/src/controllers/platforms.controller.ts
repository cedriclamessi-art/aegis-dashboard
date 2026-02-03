import { Response } from 'express'
import { query } from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: 'ads_management,ads_read,business_management'
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/adwords'
  },
  tiktok: {
    authUrl: 'https://business-api.tiktok.com/portal/auth',
    tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
    scope: ''
  }
}

export const getConnections = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId

    const result = await query(`
      SELECT 
        connection_id,
        platform,
        account_id,
        account_name,
        status,
        last_sync_at,
        sync_status,
        error_message,
        created_at
      FROM connectors.platform_connections
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [tenantId])

    res.json(result.rows.map(row => ({
      id: row.connection_id,
      platform: row.platform,
      accountId: row.account_id,
      accountName: row.account_name,
      status: row.status,
      lastSync: row.last_sync_at,
      syncStatus: row.sync_status,
      error: row.error_message,
      createdAt: row.created_at
    })))
  } catch (error) {
    console.error('Get connections error:', error)
    res.status(500).json({ error: 'Failed to fetch connections' })
  }
}

export const initiateOAuth = async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params
    const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS]
    
    if (!config) {
      return res.status(400).json({ error: 'Unsupported platform' })
    }

    const state = Buffer.from(JSON.stringify({
      tenantId: req.user?.tenantId,
      userId: req.user?.userId,
      timestamp: Date.now()
    })).toString('base64')

    let authUrl: string

    if (platform === 'facebook') {
      authUrl = `${config.authUrl}?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI || '')}&scope=${config.scope}&state=${state}`
    } else if (platform === 'google') {
      authUrl = `${config.authUrl}?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || '')}&scope=${encodeURIComponent(config.scope)}&state=${state}&response_type=code&access_type=offline&prompt=consent`
    } else if (platform === 'tiktok') {
      authUrl = `${config.authUrl}?app_id=${process.env.TIKTOK_APP_ID}&redirect_uri=${encodeURIComponent(process.env.TIKTOK_REDIRECT_URI || '')}&state=${state}`
    } else {
      return res.status(400).json({ error: 'Unsupported platform' })
    }

    res.json({ authUrl })
  } catch (error) {
    console.error('OAuth initiate error:', error)
    res.status(500).json({ error: 'Failed to initiate OAuth' })
  }
}

export const handleOAuthCallback = async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params
    const { code, state } = req.query

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' })
    }

    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString())
    const { tenantId } = stateData

    let tokenData: any
    let accountInfo: any

    if (platform === 'facebook') {
      const tokenResponse = await axios.get(OAUTH_CONFIGS.facebook.tokenUrl, {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
          code
        }
      })
      tokenData = tokenResponse.data

      const accountResponse = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
        params: {
          access_token: tokenData.access_token,
          fields: 'id,name,account_status'
        }
      })
      accountInfo = accountResponse.data.data[0]
    } else if (platform === 'google') {
      const tokenResponse = await axios.post(OAUTH_CONFIGS.google.tokenUrl, {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        code,
        grant_type: 'authorization_code'
      })
      tokenData = tokenResponse.data
      accountInfo = { id: 'google_account', name: 'Google Ads Account' }
    } else if (platform === 'tiktok') {
      const tokenResponse = await axios.post(OAUTH_CONFIGS.tiktok.tokenUrl, {
        app_id: process.env.TIKTOK_APP_ID,
        secret: process.env.TIKTOK_APP_SECRET,
        auth_code: code
      })
      tokenData = tokenResponse.data.data
      accountInfo = { id: tokenData.advertiser_id, name: 'TikTok Ads Account' }
    }

    const connectionId = uuidv4()
    await query(`
      INSERT INTO connectors.platform_connections 
      (connection_id, tenant_id, platform, account_id, account_name, credentials, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      ON CONFLICT (tenant_id, platform, account_id) DO UPDATE SET
        credentials = $6,
        status = 'active',
        updated_at = NOW()
    `, [
      connectionId,
      tenantId,
      platform,
      accountInfo.id,
      accountInfo.name,
      JSON.stringify(tokenData)
    ])

    res.redirect(`${process.env.FRONTEND_URL}/connect-platforms?success=true&platform=${platform}`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect(`${process.env.FRONTEND_URL}/connect-platforms?error=true`)
  }
}

export const disconnectPlatform = async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId } = req.params
    const tenantId = req.user?.tenantId

    await query(`
      UPDATE connectors.platform_connections 
      SET status = 'disconnected', updated_at = NOW()
      WHERE connection_id = $1 AND tenant_id = $2
    `, [connectionId, tenantId])

    res.json({ success: true, message: 'Platform disconnected' })
  } catch (error) {
    console.error('Disconnect error:', error)
    res.status(500).json({ error: 'Failed to disconnect platform' })
  }
}

export const syncPlatform = async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId } = req.params
    const tenantId = req.user?.tenantId

    const result = await query(`
      SELECT * FROM connectors.platform_connections 
      WHERE connection_id = $1 AND tenant_id = $2
    `, [connectionId, tenantId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection not found' })
    }

    const connection = result.rows[0]

    await query(`
      UPDATE connectors.platform_connections 
      SET sync_status = 'syncing', updated_at = NOW()
      WHERE connection_id = $1
    `, [connectionId])

    if (connection.platform === 'facebook') {
      await query('SELECT connectors.sync_facebook_campaigns($1)', [connectionId])
    } else if (connection.platform === 'google') {
      await query('SELECT connectors.sync_google_campaigns($1)', [connectionId])
    } else if (connection.platform === 'tiktok') {
      await query('SELECT connectors.sync_tiktok_campaigns($1)', [connectionId])
    }

    await query('SELECT connectors.collect_platform_metrics($1)', [connectionId])

    await query(`
      UPDATE connectors.platform_connections 
      SET sync_status = 'completed', last_sync_at = NOW(), updated_at = NOW()
      WHERE connection_id = $1
    `, [connectionId])

    res.json({ success: true, message: 'Sync completed' })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ error: 'Failed to sync platform' })
  }
}
