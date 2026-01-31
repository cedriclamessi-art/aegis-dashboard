import express, { Request, Response } from 'express'
import crypto from 'crypto'
import { Pool } from 'pg'
import { TikTokService } from '../../services/platforms/tiktok'
import { MetaService } from '../../services/platforms/meta'
import { GoogleService } from '../../services/platforms/google'
import { OAuthTokenModel, ConnectedPlatformModel } from '../../models/oauth-tokens'
import { encryptToken } from '../../services/crypto'

const router = express.Router()
const pool = new Pool()

// Services
const tiktokService = new TikTokService()
const metaService = new MetaService()
const googleService = new GoogleService()

// Models
const tokenModel = new OAuthTokenModel(pool)
const platformModel = new ConnectedPlatformModel(pool)

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

    // TODO: Récupérer user_id du JWT
    const userId = 'user-123'

    // Créer/Mettre à jour le token
    const encryptedAccessToken = encryptToken(tokenResponse.access_token)
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encryptToken(tokenResponse.refresh_token)
      : null

    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

    await tokenModel.createToken({
      user_id: userId,
      platform: 'tiktok',
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
    })

    // Créer plateforme connectée
    await platformModel.createPlatform({
      user_id: userId,
      platform: 'tiktok',
      platform_user_id: userInfo.user_id,
      platform_username: userInfo.username,
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

    const userId = 'user-123'
    const encryptedAccessToken = encryptToken(tokenResponse.access_token)

    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

    await tokenModel.createToken({
      user_id: userId,
      platform: 'meta',
      access_token: encryptedAccessToken,
      refresh_token: null,
      expires_at: expiresAt,
    })

    await platformModel.createPlatform({
      user_id: userId,
      platform: 'meta',
      platform_user_id: userInfo.id,
      platform_username: userInfo.name,
      platform_email: userInfo.email,
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

    const userId = 'user-123'
    const encryptedAccessToken = encryptToken(tokenResponse.access_token)
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encryptToken(tokenResponse.refresh_token)
      : null

    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)

    await tokenModel.createToken({
      user_id: userId,
      platform: 'google',
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
    })

    await platformModel.createPlatform({
      user_id: userId,
      platform: 'google',
      platform_user_id: userInfo.id,
      platform_username: userInfo.name,
      platform_email: userInfo.email,
    })

    res.redirect(`/connected-accounts?platform=google&success=true`)
  } catch (error) {
    console.error('Google OAuth error:', error)
    res.redirect(`/connect-platforms?error=oauth_failed`)
  }
})

// === GET PLATFORMS ===
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const userId = 'user-123' // TODO: Récupérer du JWT
    const platforms = await platformModel.getPlatformsByUser(userId)
    res.json(platforms)
  } catch (error) {
    console.error('Error getting platforms:', error)
    res.status(500).json({ error: 'Failed to get platforms' })
  }
})

// === DISCONNECT ===
router.post('/disconnect/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params
    const userId = 'user-123' // TODO: Récupérer du JWT

    const platforms = await platformModel.getPlatformsByUser(userId)
    const platformRecord = platforms.find((p: any) => p.platform === platform)

    if (!platformRecord) {
      return res.status(404).json({ error: 'Platform not connected' })
    }

    await platformModel.deletePlatform(platformRecord.id)

    // Supprimer aussi le token
    const token = await (tokenModel as any).getTokenByUserAndPlatform(userId, platform)
    if (token) {
      await (tokenModel as any).deleteToken(token.id)
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting platform:', error)
    res.status(500).json({ error: 'Failed to disconnect' })
  }
})

export default router
