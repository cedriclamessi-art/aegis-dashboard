import express, { Request, Response } from 'express'
import crypto from 'crypto'
import { TikTokService } from '../../services/platforms/tiktok'
import { MetaService } from '../../services/platforms/meta'
import { GoogleService } from '../../services/platforms/google'
import { env } from '../../../config/env-validator'

const router = express.Router()

// In-memory store for demo mode
const connectedPlatforms = new Map<string, any>()
const tokenStore = new Map<string, any>()

// Services
const tiktokService = new TikTokService()
const metaService = new MetaService()
const googleService = new GoogleService()

// Demo user ID
const DEMO_USER_ID = 'demo-user-123'

// === TIKTOK ===
router.get('/tiktok/authorize', (req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString('hex')
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600000 })
  
  const authUrl = tiktokService.getAuthorizationUrl(state)
  res.redirect(authUrl)
})

router.get('/tiktok/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query
    const savedState = req.cookies?.oauth_state

    if (state !== savedState) {
      return res.status(400).json({ error: 'Invalid state parameter' })
    }

    if (!code) {
      return res.status(400).json({ error: 'No authorization code' })
    }

    const tokenResponse = await tiktokService.exchangeCodeForToken(code as string)
    const userInfo = await tiktokService.getUserInfo(tokenResponse.access_token)

    // Store in demo mode
    connectedPlatforms.set(`${DEMO_USER_ID}-tiktok`, {
      user_id: DEMO_USER_ID,
      platform: 'tiktok',
      platform_user_id: userInfo.user_id,
      platform_username: userInfo.username,
      connected_at: new Date().toISOString(),
    })

    tokenStore.set(`${DEMO_USER_ID}-tiktok`, {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000),
    })

    res.redirect(`/connected-accounts?platform=tiktok&success=true`)
  } catch (error) {
    console.error('TikTok OAuth error:', error)
    res.redirect(`/connect-platforms?error=oauth_failed`)
  }
})

// === META ===
router.get('/meta/authorize', (req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString('hex')
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600000 })

  const authUrl = metaService.getAuthorizationUrl(state)
  res.redirect(authUrl)
})

router.get('/meta/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query
    const savedState = req.cookies?.oauth_state

    if (state !== savedState) {
      return res.status(400).json({ error: 'Invalid state parameter' })
    }

    if (!code) {
      return res.status(400).json({ error: 'No authorization code' })
    }

    const tokenResponse = await metaService.exchangeCodeForToken(code as string)
    const userInfo = await metaService.getUserInfo(tokenResponse.access_token)

    // Store in demo mode
    connectedPlatforms.set(`${DEMO_USER_ID}-meta`, {
      user_id: DEMO_USER_ID,
      platform: 'meta',
      platform_user_id: userInfo.user_id,
      platform_username: userInfo.username,
      connected_at: new Date().toISOString(),
    })

    tokenStore.set(`${DEMO_USER_ID}-meta`, {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000),
    })

    res.redirect(`/connected-accounts?platform=meta&success=true`)
  } catch (error) {
    console.error('Meta OAuth error:', error)
    res.redirect(`/connect-platforms?error=oauth_failed`)
  }
})

// === GOOGLE ===
router.get('/google/authorize', (req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString('hex')
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600000 })

  const authUrl = googleService.getAuthorizationUrl(state)
  res.redirect(authUrl)
})

router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query
    const savedState = req.cookies?.oauth_state

    if (state !== savedState) {
      return res.status(400).json({ error: 'Invalid state parameter' })
    }

    if (!code) {
      return res.status(400).json({ error: 'No authorization code' })
    }

    const tokenResponse = await googleService.exchangeCodeForToken(code as string)
    const userInfo = await googleService.getUserInfo(tokenResponse.access_token)

    // Store in demo mode
    connectedPlatforms.set(`${DEMO_USER_ID}-google`, {
      user_id: DEMO_USER_ID,
      platform: 'google',
      platform_user_id: userInfo.user_id,
      platform_username: userInfo.username,
      connected_at: new Date().toISOString(),
    })

    tokenStore.set(`${DEMO_USER_ID}-google`, {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000),
    })

    res.redirect(`/connected-accounts?platform=google&success=true`)
  } catch (error) {
    console.error('Google OAuth error:', error)
    res.redirect(`/connect-platforms?error=oauth_failed`)
  }
})

// === GET CONNECTED PLATFORMS ===
router.get('/platforms', (req: Request, res: Response) => {
  const platforms = Array.from(connectedPlatforms.values()).filter(
    (p) => p.user_id === DEMO_USER_ID
  )
  res.json({ platforms })
})

// === DISCONNECT PLATFORM ===
router.post('/disconnect/:platform', (req: Request, res: Response) => {
  const platform = req.params.platform
  const key = `${DEMO_USER_ID}-${platform}`
  
  if (connectedPlatforms.has(key)) {
    connectedPlatforms.delete(key)
    tokenStore.delete(key)
    res.json({ success: true, message: `Disconnected from ${platform}` })
  } else {
    res.status(404).json({ error: `Platform ${platform} not connected` })
  }
})

export default router
